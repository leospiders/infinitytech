from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.auth import get_current_user, require_role
from app.models.models import Employee
from app.schemas.schemas import CategoryInDB, CategoryCreate
from app.repositories.base_repos import CategoryRepository

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=list[CategoryInDB])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get all product categories.
    """
    repo = CategoryRepository(db)
    return await repo.get_all()

@router.post("/", response_model=CategoryInDB, status_code=status.HTTP_201_CREATED)
async def create_category(
    obj_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECHNICIAN"]))
):
    """
    Create a new product category (Admins and Technicians only).
    """
    repo = CategoryRepository(db)
    existing = await repo.get_by_name(obj_in.name)
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    return await repo.create(obj_in)
