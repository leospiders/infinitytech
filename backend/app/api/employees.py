import jwt
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.auth import get_current_user, require_role, generate_approval_token
from app.models.models import Employee
from app.schemas.schemas import EmployeeInDB, EmployeeUpdate, EmployeeCreate
from app.repositories.base_repos import EmployeeRepository
from pydantic import BaseModel, Field
from app.core.config import settings

router = APIRouter(prefix="/employees", tags=["Employees"])

class EmployeeRegisterInput(BaseModel):
    name: str
    phone: str

class TokenExecuteInput(BaseModel):
    token: str
    action: str  # "approve" or "deny"

async def get_unregistered_email(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    if not token:
        token = request.query_params.get("token", "")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
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
                detail="Invalid token: missing email"
            )
        return email
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )

@router.get("/me", response_model=EmployeeInDB)
async def read_current_employee(current_user: Employee = Depends(get_current_user)):
    """
    Get current logged-in employee profile.
    """
    return current_user

@router.get("/", response_model=list[EmployeeInDB])
async def list_employees(
    active_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"]))
):
    """
    Admin-only: list all registered employees.
    """
    repo = EmployeeRepository(db)
    return await repo.get_all(active_only=active_only)

@router.post("/register", response_model=dict)
async def register_employee(
    input_data: EmployeeRegisterInput,
    db: AsyncSession = Depends(get_db),
    email: str = Depends(get_unregistered_email)
):
    """
    Register a new employee/technician after Google OAuth authentication.
    Creates the user in inactive state. Returns the temporary approval token.
    """
    repo = EmployeeRepository(db)
    
    # Check if already exists
    existing = await repo.get_by_email(email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already registered. Please log in."
        )
        
    # Create employee as inactive and technician role by default
    new_emp_schema = EmployeeCreate(
        email=email,
        name=input_data.name,
        role="TECHNICIAN",
        phone=input_data.phone,
        is_active=False
    )
    
    employee = await repo.create(new_emp_schema)
    
    # Generate approval token
    approval_token = generate_approval_token(email)
    
    return {
        "status": "pending",
        "employee_id": employee.id,
        "approval_token": approval_token
    }

@router.get("/verify-registration-token")
async def verify_registration_token(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify the temporary approval token and return registered technician profile.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        
        if payload.get("sub") != "registration_approval":
            raise HTTPException(status_code=400, detail="Invalid token type")
            
        email = payload.get("email")
        repo = EmployeeRepository(db)
        employee = await repo.get_by_email(email)
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
            
        return {
            "name": employee.name,
            "email": employee.email,
            "phone": employee.phone,
            "role": employee.role,
            "is_active": employee.is_active
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Approval token has expired (expires in 24 hours)")
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid token")

@router.post("/execute-registration-token")
async def execute_registration_token(
    input_data: TokenExecuteInput,
    db: AsyncSession = Depends(get_db)
):
    """
    Approve or deny technician registration using the temporary token.
    """
    try:
        payload = jwt.decode(
            input_data.token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        
        if payload.get("sub") != "registration_approval":
            raise HTTPException(status_code=400, detail="Invalid token type")
            
        email = payload.get("email")
        repo = EmployeeRepository(db)
        employee = await repo.get_by_email(email)
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
            
        if input_data.action == "approve":
            update_schema = EmployeeUpdate(is_active=True)
            await repo.update(employee, update_schema)
            return {"message": f"User {employee.name} approved successfully."}
        elif input_data.action == "deny":
            await db.delete(employee)
            await db.commit()
            return {"message": f"Registration request for {employee.name} denied and removed."}
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Approval token has expired (expires in 24 hours)")
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid token")

@router.put("/{employee_id}/approve", response_model=EmployeeInDB)
async def approve_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"]))
):
    """
    Admin-only: approve employee registration by making them active.
    """
    repo = EmployeeRepository(db)
    employee = await repo.get_by_id(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    # Security: Admin cannot approve/modify a Superadmin
    if employee.role == "SUPERADMIN" and current_user.role != "SUPERADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a SUPERADMIN can approve or modify a SUPERADMIN user."
        )
        
    update_schema = EmployeeUpdate(is_active=True)
    return await repo.update(employee, update_schema)

@router.put("/{employee_id}", response_model=EmployeeInDB)
async def update_employee_profile(
    employee_id: int,
    obj_in: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"]))
):
    """
    Admin-only: update employee roles or status.
    """
    repo = EmployeeRepository(db)
    employee = await repo.get_by_id(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    # Security Check 1: Non-SUPERADMIN modifying a SUPERADMIN user
    if employee.role == "SUPERADMIN" and current_user.role != "SUPERADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a SUPERADMIN can modify a SUPERADMIN user."
        )
        
    # Security Check 2: Non-SUPERADMIN assigning SUPERADMIN role
    if obj_in.role == "SUPERADMIN" and current_user.role != "SUPERADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a SUPERADMIN can assign the SUPERADMIN role."
        )
        
    # Security Check 3: User deactivating themselves
    if obj_in.is_active is False and employee.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account."
        )
        
    # Security Check 4: User changing their own role
    if obj_in.role is not None and obj_in.role != employee.role and employee.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role to prevent lockout."
        )
        
    return await repo.update(employee, obj_in)
