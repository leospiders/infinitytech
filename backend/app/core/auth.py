import logging

import jwt
from jwt import PyJWKClient
import httpx
from fastapi import Depends, HTTPException, status, Request

logger = logging.getLogger("infinity")
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.models import Employee, generate_uuid
from app.core.config import settings

SUPABASE_ROLE_MAP = {
    "superadmin": "ADMIN",
    "tech": "TECH_IT",        # backward compat — old TECHNICIAN → TECH_IT
    "tech_it": "TECH_IT",          # explicit
    "tecnico": "TECH_COM",         # backward compat — old TECNICO → TECH_COM
    "tech_com": "TECH_COM",        # explicit new name
    "pending": "PENDING",     # pending approval — default on signup
}

PENDING_MESSAGE = (
    "Your registration request is pending approval. "
    "An administrator will activate your account shortly."
)

_jwks_client: PyJWKClient | None = None

def _get_jwks_client() -> PyJWKClient | None:
    global _jwks_client
    if _jwks_client is None and settings.SUPABASE_URL:
        jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_client

async def fetch_supabase_profile(user_jwt: str, email: str) -> dict | None:
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        return None
    url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/user_profiles"
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            url,
            params={"email": f"eq.{email}"},
            headers={
                "apikey": settings.SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {user_jwt}",
            },
            timeout=10,
        )
        if resp.status_code == 200:
            rows = resp.json()
            if rows:
                return rows[0]
    return None

async def sync_supabase_profile_to_employee(
    db: AsyncSession, profile: dict
) -> Employee | None:
    email = profile.get("email")
    profile_uuid = profile.get("id")
    if not email and not profile_uuid:
        return None

    # Try matching by uuid first, then email
    result = None
    if profile_uuid:
        result = await db.execute(select(Employee).filter(Employee.uuid == profile_uuid))
        result = result.scalars().first()
    if not result and email:
        result = await db.execute(select(Employee).filter(Employee.email == email))
        result = result.scalars().first()

    if result:
        new_role = SUPABASE_ROLE_MAP.get(profile.get("role", ""), "TECH_COM")
        db_changed = False
        if result.role != new_role:
            result.role = new_role
            db_changed = True
        profile_active = profile.get("is_active", False)
        if result.is_active != profile_active:
            result.is_active = profile_active
            db_changed = True
        if db_changed:
            await db.commit()
            await db.refresh(result)
        return result

    role = SUPABASE_ROLE_MAP.get(profile.get("role", ""), "TECH_COM")
    employee = Employee(
        email=email or f"pending-{profile_uuid}@infinity.tech",
        uuid=profile_uuid or generate_uuid(),
        name=profile.get("display_name", email.split("@")[0] if email else "User"),
        role=role,
        phone=profile.get("phone"),
        is_active=profile.get("is_active", True),
    )
    db.add(employee)
    await db.commit()
    await db.refresh(employee)
    return employee

def _verify_token(token: str) -> dict:
    # Attempt 1: HS256 (works if JWT_SECRET is configured in Supabase dashboard)
    if settings.SUPABASE_JWT_SECRET:
        try:
            logger.debug("Attempting HS256 JWT verification")
            return jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
        except jwt.InvalidAlgorithmError:
            logger.debug("HS256 not available, falling back to JWKS")
            pass
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired")
            raise
        except jwt.PyJWTError as e:
            logger.debug("HS256 verification failed: %s, falling back to JWKS", e)
            pass

    # Attempt 2: JWKS-based verification (RS256, ES256, etc.)
    jwks_client = _get_jwks_client()
    if not jwks_client:
        logger.warning("No JWKS client available")
        raise jwt.PyJWTError("No JWKS client available — check SUPABASE_URL")

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        logger.debug("JWKS resolved key algorithm: %s", signing_key.algorithm_name)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=[signing_key.algorithm_name],
            options={"verify_aud": False}
        )
    except jwt.PyJWTError as e:
        logger.warning("JWKS verification also failed: %s", e)
        raise

def _raise_status_block(status: str, rejection_reason: str | None = None) -> bool:
    """Return True if the given status should block the request."""
    return status in ("PENDING", "REJECTED", "SUSPENDED", "DELETED")


def _status_exception(emp_status: str, rejection_reason: str | None = None) -> HTTPException:
    """Return the appropriate HTTPException for a given employee status."""
    if emp_status == "PENDING":
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="PENDING_APPROVAL",
        )
    if emp_status == "REJECTED":
        reason = f":{rejection_reason}" if rejection_reason else ""
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"REJECTED{reason}",
        )
    if emp_status == "SUSPENDED":
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SUSPENDED",
        )
    if emp_status == "DELETED":
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="DELETED",
        )
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=PENDING_MESSAGE,
    )


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Employee:
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    # 1. Local Development Mock Bypass
    if settings.MOCK_AUTH and token.startswith("mock-"):
        # Direct lookup by employee ID: mock-user:{id}
        if token.startswith("mock-user:"):
            try:
                emp_id = int(token.split(":")[1])
                result = await db.execute(select(Employee).filter(Employee.id == emp_id))
                employee = result.scalars().first()
                if employee:
                    return employee
            except (ValueError, IndexError):
                pass

        role_type = token.split("-")[1].upper()
        if role_type in ("TECH", "TECH_IT"):
            role = "TECH_IT"
        elif role_type == "TECH_COM":
            role = "TECH_COM"
        elif role_type == "ADMIN":
            role = "ADMIN"
        else:
            role = "ADMIN"

        email = f"mock-{role.lower()}@infinity.com"

        result = await db.execute(select(Employee).filter(Employee.email == email))
        employee = result.scalars().first()
        if not employee:
            employee = Employee(
                email=email,
                name=f"Mock {role}",
                role=role,
                phone="+15559999",
                status="ACTIVE",
                is_active=True,
            )
            db.add(employee)
            await db.commit()
            await db.refresh(employee)
        return employee

    # 2. Production Supabase JWT
    try:
        if not settings.SUPABASE_JWT_SECRET and not settings.SUPABASE_URL:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Supabase auth not configured (no JWT_SECRET or SUPABASE_URL)"
            )
        payload = _verify_token(token)

        email = payload.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing email"
            )

        # Try SQLite cache first
        result = await db.execute(select(Employee).filter(Employee.email == email))
        employee = result.scalars().first()

        if not employee:
            profile = await fetch_supabase_profile(token, email)
            if not profile:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not registered"
                )
            # Profile exists in Supabase — create Employee record immediately
            # so admin can see the user in the management list.
            employee = Employee(
                email=email,
                uuid=profile.get("id", generate_uuid()),
                name=profile.get("display_name", email.split("@")[0]),
                role=SUPABASE_ROLE_MAP.get(profile.get("role", ""), "PENDING"),
                status=profile.get("status", "PENDING"),
                is_active=False,  # pending approval
            )
            db.add(employee)
            await db.commit()
            await db.refresh(employee)

            # Still blocked if not approved
            emp_status = employee.status or ("PENDING" if not employee.is_active else "ACTIVE")
            if _raise_status_block(emp_status, employee.rejection_reason):
                raise _status_exception(emp_status, employee.rejection_reason)

        # Re-registration detection: if the employee was soft-deleted (deleted_at set),
        # a successful JWT authentication means they're trying to sign up again.
        # Reset them to PENDING so the admin can re-approve.
        if employee.deleted_at is not None and employee.status in ("PENDING", "DELETED", "REJECTED"):
            logger.info("Resetting previously deleted employee %s to PENDING (re-registration)", employee.email)

            # If the Supabase auth.user was re-created, the JWT has a new sub (uuid).
            # Sync it so approve/reject endpoints work with the correct profile.
            new_uuid = payload.get("sub")
            if new_uuid and new_uuid != employee.uuid:
                logger.info("Updating employee uuid from %s to %s (new auth.users row)", employee.uuid, new_uuid)
                employee.uuid = new_uuid

            employee.status = "PENDING"
            employee.is_active = False
            employee.deleted_at = None
            employee.rejection_reason = None
            employee.rejected_at = None
            employee.rejected_by = None
            await db.commit()
            await db.refresh(employee)

        # Check status — this is the primary gate
        if employee.status and _raise_status_block(employee.status, employee.rejection_reason):
            raise _status_exception(employee.status, employee.rejection_reason)

        # Fallback: is_active check for backward compat with rows not migrated
        if not employee.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=PENDING_MESSAGE
            )

        return employee

    except jwt.PyJWTError as e:
        logger.warning("JWT validation failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

def require_role(allowed_roles: list[str]):
    """Dependency: require current user to have one of the allowed roles.
    ADMIN always passes regardless of the list.
    """
    async def role_checker(current_user: Employee = Depends(get_current_user)) -> Employee:
        if current_user.role == "ADMIN":
            return current_user
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' does not have permission. Allowed: {allowed_roles}"
            )
        return current_user
    return role_checker
