from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.auth import get_current_user, require_role
from app.models.models import Employee, Category
from app.schemas.schemas import CategoryInDB, CategoryCreate
from app.repositories.base_repos import CategoryRepository

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=list[CategoryInDB])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """Get all product categories. All authenticated users."""
    repo = CategoryRepository(db)
    return await repo.get_all()


@router.post("/", response_model=CategoryInDB, status_code=status.HTTP_201_CREATED)
async def create_category(
    obj_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECH_IT"]))
):
    """Create a new product category."""
    repo = CategoryRepository(db)
    existing = await repo.get_by_name(obj_in.name)
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    return await repo.create(obj_in)


@router.put("/{category_id}", response_model=CategoryInDB)
async def update_category(
    category_id: int,
    obj_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECH_IT"]))
):
    """Update a category (name, description, is_repuesto flag)."""
    repo = CategoryRepository(db)
    cat = await repo.get_by_id(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.name = obj_in.name
    cat.description = obj_in.description
    cat.is_repuesto = obj_in.is_repuesto
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat
