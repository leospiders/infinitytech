import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.auth import get_current_user, require_role
from app.models.models import Employee
from app.schemas.schemas import EmployeeInDB, EmployeeUpdate, ApproveRequest, RejectRequest
from app.repositories.base_repos import EmployeeRepository
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter(prefix="/employees", tags=["Employees"])

# --- Helpers ---

async def call_supabase_rpc(rpc_name: str, params: dict | None = None, user_jwt: str = "") -> dict | list | None:
    """Call a Supabase Postgres function (RPC) via REST API."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        return None
    url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/rpc/{rpc_name}"
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    if user_jwt:
        headers["Authorization"] = f"Bearer {user_jwt}"
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=params or {}, headers=headers, timeout=10)
        if resp.status_code == 200:
            try:
                return resp.json()
            except Exception:
                return None
        return None

async def call_supabase_rpc_void(rpc_name: str, params: dict, user_jwt: str = "") -> bool:
    """Call a Supabase RPC that returns void; returns True on success."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        return False
    url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/rpc/{rpc_name}"
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    if user_jwt:
        headers["Authorization"] = f"Bearer {user_jwt}"
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=params, headers=headers, timeout=10)
        return resp.status_code == 200 or resp.status_code == 204

# --- Endpoints ---

@router.get("/me", response_model=EmployeeInDB)
async def read_current_employee(current_user: Employee = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=list[EmployeeInDB])
async def list_employees(
    active_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"]))
):
    repo = EmployeeRepository(db)
    return await repo.get_all(active_only=active_only)

@router.get("/pending")
async def list_pending_employees(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"]))
):
    """List pending technician registrations from Supabase user_profiles not yet in SQLite."""
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")

    # Try RPC first, fallback to direct query on empty
    profiles = await call_supabase_rpc("list_pending_profiles", user_jwt=token)
    if not profiles:
        profiles = await _fetch_user_profiles_direct(token)

    if not profiles:
        return []

    # Filter out profiles that already have a resolved Employee in SQLite
    # (ACTIVE, REJECTED, SUSPENDED, DELETED). Only show truly pending
    # profiles — either no Employee record yet, or status='PENDING'.
    emails = [p.get("email", "") for p in profiles if p.get("email")]
    if not emails:
        return profiles

    result = await db.execute(select(Employee).filter(Employee.email.in_(emails)))
    resolved_employees = {
        e.email for e in result.scalars().all()
        if e.status in ("ACTIVE", "REJECTED", "SUSPENDED", "DELETED")
    }

    return [
        p for p in profiles
        if p.get("email") not in resolved_employees
    ]


async def _fetch_user_profiles_direct(user_jwt: str) -> list[dict]:
    """Fetch pending user_profiles via REST API, using service_role_key if available."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        return []
    url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/user_profiles"

    # Prefer service_role_key (bypasses RLS)
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    auth = f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY or user_jwt}"

    headers = {
        "apikey": key,
        "Authorization": auth,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            return resp.json()
    return []

@router.put("/pending/{profile_uuid}/approve", response_model=EmployeeInDB)
async def approve_pending_employee(
    profile_uuid: str,
    body: ApproveRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"]))
):
    """Approve a pending user with role from request body.

    Accepts {\"role\": \"ADMIN\"}, {\"role\": \"TECH_IT\"}, or {\"role\": \"TECH_COM\"}.
    Updates Supabase profile via approve_profile RPC and creates/updates
    the Employee record in SQLite.
    """
    # Validate role
    VALID_APPROVE_ROLES = ["ADMIN", "TECH_IT", "TECH_COM"]
    if body.role not in VALID_APPROVE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{body.role}'. Must be one of: {VALID_APPROVE_ROLES}"
        )

    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    now = datetime.now(timezone.utc)

    # 1. Call approve_profile RPC — updates Supabase user_profiles
    await call_supabase_rpc_void("approve_profile", {
        "profile_id": profile_uuid,
        "new_role": body.role,
        "admin_id": current_user.uuid,
    }, user_jwt=token)

    # 2. Try to find existing Employee by uuid
    result = await db.execute(
        select(Employee).filter(Employee.uuid == profile_uuid)
    )
    employee = result.scalars().first()

    if employee:
        # Already exists — update with role, status, and audit trail
        employee.is_active = True
        employee.role = body.role
        employee.status = "ACTIVE"
        employee.approved_by = current_user.uuid
        employee.approved_at = now
        await db.commit()
        await db.refresh(employee)
        return employee

    # 3. Not in SQLite — fetch profile from Supabase (user_profiles via service_role)
    profile = None
    url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/user_profiles"
    srk = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    profile_headers = {
        "apikey": srk,
        "Authorization": f"Bearer {srk}",
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{url}?id=eq.{profile_uuid}", headers=profile_headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data:
                profile = data[0]

    # Fallback: use Admin API
    if not profile and settings.SUPABASE_SERVICE_ROLE_KEY:
        srk = settings.SUPABASE_SERVICE_ROLE_KEY
        admin_headers = {"apikey": srk, "Authorization": f"Bearer {srk}"}
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/admin/users/{profile_uuid}",
                headers=admin_headers,
                timeout=10,
            )
            if resp.status_code == 200:
                user = resp.json()
                profile = {
                    "id": user["id"],
                    "email": user.get("email", ""),
                    "display_name": (
                        user.get("user_metadata", {}).get("display_name")
                        or user.get("user_metadata", {}).get("full_name")
                        or user.get("email", "").split("@")[0]
                    ),
                    "role": body.role,
                    "is_active": True,
                }

    if not profile:
        raise HTTPException(status_code=404, detail="User not found in Supabase")

    # 4. Create Employee in SQLite with approved status
    employee = Employee(
        email=profile.get("email", ""),
        uuid=profile_uuid,
        name=profile.get("display_name", profile.get("email", "").split("@")[0]),
        role=body.role,
        phone=profile.get("phone"),
        is_active=True,
        status="ACTIVE",
        approved_by=current_user.uuid,
        approved_at=now,
    )
    db.add(employee)
    await db.commit()
    await db.refresh(employee)

    return employee

@router.delete("/pending/{profile_uuid}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_pending_employee(
    profile_uuid: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"])),
    body: RejectRequest | None = None,
):
    """Reject a pending technician: updates Supabase profile + creates soft-deleted SQLite record.

    Accepts optional {\"reason\": \"...\"} for the rejection reason.
    """
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    reason = body.reason if body else None

    # 1. Try to get email from user_profiles (use service_role_key to bypass RLS)
    email = None
    name = None
    url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/user_profiles"
    srk = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    profile_headers = {
        "apikey": srk,
        "Authorization": f"Bearer {srk}",
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{url}?id=eq.{profile_uuid}",
            headers=profile_headers,
            timeout=10,
        )
        if resp.status_code == 200 and resp.json():
            profile = resp.json()[0]
            email = profile.get("email")
            name = profile.get("display_name") or profile.get("name")

    # 2. Fallback: get email from Supabase Auth Admin API
    if not email:
        srk = settings.SUPABASE_SERVICE_ROLE_KEY
        if srk:
            admin_headers = {
                "apikey": srk,
                "Authorization": f"Bearer {srk}",
            }
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/admin/users/{profile_uuid}",
                    headers=admin_headers,
                    timeout=10,
                )
                if resp.status_code == 200:
                    user = resp.json()
                    email = user.get("email", "")
                    name = user.get("user_metadata", {}).get("display_name") or email.split("@")[0]

    # 3. Reject in Supabase — try RPC (with reason + admin_id), fallback to direct REST update
    ok = await call_supabase_rpc_void("reject_profile", {
        "profile_id": profile_uuid,
        "admin_id": current_user.uuid,
        "reason": reason,
    }, user_jwt=token)
    if not ok:
        srk = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        svc_headers = {
            "apikey": srk,
            "Authorization": f"Bearer {srk}",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient() as client:
                await client.patch(
                    f"{url}?id=eq.{profile_uuid}",
                    json={"is_active": False, "status": "REJECTED", "updated_at": "now()"},
                    headers=svc_headers,
                    timeout=10,
                )
        except Exception:
            pass  # Best effort

    # 4. Create or soft-delete SQLite record so the email stays in `employees`
    #    and `list_pending_employees` won't return this profile again.
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Employee).filter(
            (Employee.uuid == profile_uuid) | (Employee.email == email)
        )
    )
    existing = result.scalars().first()
    if existing:
        existing.is_active = False
        existing.deleted_at = now
        existing.status = "REJECTED"
        existing.rejected_by = current_user.uuid
        existing.rejected_at = now
        existing.rejection_reason = reason
        db.add(existing)
    elif email:
        # Ghost user: create a soft-deleted record as a "don't show again" marker
        rejected = Employee(
            uuid=profile_uuid,
            email=email,
            name=name or email.split("@")[0],
            role="TECH_COM",
            is_active=False,
            status="REJECTED",
            rejected_by=current_user.uuid,
            rejected_at=now,
            rejection_reason=reason,
            deleted_at=now,
        )
        db.add(rejected)

    await db.commit()
    return

@router.get("/{employee_id}", response_model=EmployeeInDB)
async def get_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"]))
):
    repo = EmployeeRepository(db)
    employee = await repo.get_by_id(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.put("/{employee_id}/approve", response_model=EmployeeInDB)
async def approve_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"]))
):
    repo = EmployeeRepository(db)
    employee = await repo.get_by_id(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if employee.role == "ADMIN" and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a ADMIN can approve or modify a ADMIN user."
        )

    # Also sync to Supabase if we have the email
    if employee.email and settings.SUPABASE_URL:
        async with httpx.AsyncClient() as client:
            await client.patch(
                f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/user_profiles?email=eq.{employee.email}",
                json={"is_active": True, "updated_at": "now()"},
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                },
                timeout=10,
            )

    update_schema = EmployeeUpdate(is_active=True)
    return await repo.update(employee, update_schema)

@router.put("/me", response_model=EmployeeInDB)
async def update_my_profile(
    obj_in: EmployeeUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """Update own profile (name, phone). Syncs to Supabase and SQLite."""
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")

    # Update Supabase profile
    supabase_params = {}
    if obj_in.name is not None:
        supabase_params["p_display_name"] = obj_in.name
    if obj_in.phone is not None:
        supabase_params["p_phone"] = obj_in.phone

    if supabase_params and settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
        await call_supabase_rpc("update_my_profile", supabase_params, user_jwt=token)

    # Update SQLite
    repo = EmployeeRepository(db)
    updated = await repo.update(current_user, obj_in)
    await db.refresh(updated)
    return updated


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"]))
):
    """Delete an employee record and their Supabase user profile."""
    repo = EmployeeRepository(db)
    employee = await repo.get_by_id(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if employee.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account."
        )

    if employee.role == "ADMIN" and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a ADMIN can delete a ADMIN user."
        )

    # Delete from Supabase auth (cascades to user_profiles) — best effort
    if employee.uuid and settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "")
        await call_supabase_rpc_void(
            "admin_delete_user",
            {"p_user_id": employee.uuid},
            user_jwt=token,
        )

    # Soft-delete: mark as deleted instead of hard-deleting, so the email stays
    # in employees table and the user won't re-appear as "pending".
    employee.is_active = False
    employee.status = "DELETED"
    employee.deleted_at = datetime.now(timezone.utc)
    db.add(employee)
    await db.commit()
    return


@router.put("/{employee_id}", response_model=EmployeeInDB)
async def update_employee_profile(
    employee_id: int,
    obj_in: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"]))
):
    """Admin update employee profile (name, phone, role, active status)."""
    repo = EmployeeRepository(db)
    employee = await repo.get_by_id(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if obj_in.role is not None and obj_in.role not in ("ADMIN", "TECH_IT", "TECH_COM"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Allowed: ADMIN, TECH_IT, TECH_COM."
        )

    if obj_in.is_active is False and employee.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account."
        )

    if obj_in.role is not None and obj_in.role != employee.role and employee.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role to prevent lockout."
        )

    # Sync to Supabase via Admin API (service_role_key bypasses RLS)
    if employee.uuid and settings.SUPABASE_SERVICE_ROLE_KEY:
        srk = settings.SUPABASE_SERVICE_ROLE_KEY
        admin_headers = {
            "apikey": srk,
            "Authorization": f"Bearer {srk}",
        }

        # Update user_profiles table directly (service_role bypasses RLS)
        profile_updates = {}
        if obj_in.name is not None:
            profile_updates["display_name"] = obj_in.name
        if obj_in.phone is not None:
            profile_updates["phone"] = obj_in.phone
        if obj_in.role is not None:
            profile_updates["role"] = obj_in.role.lower()
        if obj_in.is_active is not None:
            profile_updates["is_active"] = obj_in.is_active

        if profile_updates:
            api_url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/user_profiles"
            params = {"id": f"eq.{employee.uuid}"}
            async with httpx.AsyncClient() as client:
                await client.patch(
                    api_url,
                    params=params,
                    json=profile_updates,
                    headers=admin_headers,
                    timeout=10,
                )

        # Also sync role to Auth user_metadata for JWTs
        if obj_in.role is not None:
            auth_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/admin/users/{employee.uuid}"
            async with httpx.AsyncClient() as client:
                await client.put(
                    auth_url,
                    json={"user_metadata": {"role": obj_in.role.lower()}},
                    headers=admin_headers,
                    timeout=10,
                )

    return await repo.update(employee, obj_in)
