import jwt
import datetime
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.models import Employee
from app.core.config import settings

def generate_approval_token(email: str) -> str:
    # Expires in 24 hours
    exp = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    payload = {
        "sub": "registration_approval",
        "email": email,
        "exp": exp
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Employee:
    # Try Authorization header first, then query param
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    if not token:
        token = request.query_params.get("token", "")

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
        if role_type == "TECH":
            role = "TECHNICIAN"
        elif role_type == "SUPERADMIN":
            role = "SUPERADMIN"
        else:
            role = "ADMIN"

        email = f"mock-{role.lower()}@infinity.com"

        result = await db.execute(select(Employee).filter(Employee.email == email))
        employee = result.scalars().first()
        if not employee:
            employee = Employee(
                email=email,
                name=f"Mock {role.capitalize() if role != 'SUPERADMIN' else 'Super Admin'}",
                role=role,
                phone="+15559999",
                is_active=True
            )
            db.add(employee)
            await db.commit()
            await db.refresh(employee)
        return employee

    # 2. Production Supabase JWT Validation
    try:
        if not settings.SUPABASE_JWT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Supabase JWT secret not configured and mock auth disabled"
            )

        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )

        email = payload.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing email"
            )

        result = await db.execute(select(Employee).filter(Employee.email == email))
        employee = result.scalars().first()

        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not registered"
            )

        if not employee.is_active:
            # Generate temporary approval token so the user can copy/share it from the login screen
            approval_token = generate_approval_token(employee.email)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": "Employee account is inactive. Please contact an Administrator to approve your registration.",
                    "approval_token": approval_token
                }
            )

        return employee

    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )

def require_role(allowed_roles: list[str]):
    async def role_checker(current_user: Employee = Depends(get_current_user)) -> Employee:
        if current_user.role == "SUPERADMIN":
            return current_user
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' does not have permission to perform this action. Required: {allowed_roles}"
            )
        return current_user
    return role_checker