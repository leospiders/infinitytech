from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from app.db.session import get_db
from app.core.auth import get_current_user, require_role
from app.models.models import Employee, Product
from app.schemas.schemas import ProductInDB, ProductCreate, ProductUpdate
from app.repositories.base_repos import ProductRepository
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/products", tags=["Products"])

class PaginatedProductsResponse(BaseModel):
    items: List[ProductInDB]
    total: int
    page: int
    limit: int

@router.get("/", response_model=PaginatedProductsResponse)
async def list_products(
    search: str = Query("", description="Debounced search for name or SKU"),
    category_id: int = Query(None, description="Filter by category ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get paginated products with server-side filters and indexed search queries.
    Avoids memory bloating by loading only requested chunk from SQLite database.
    """
    repo = ProductRepository(db)
    items, total = await repo.get_all_paginated(
        search=search, category_id=category_id, page=page, limit=limit
    )
    return PaginatedProductsResponse(
        items=items,
        total=total,
        page=page,
        limit=limit
    )

@router.get("/low-stock-count/")
async def get_low_stock_count(
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """Returns the count of products whose stock is at or below their low_stock_limit."""
    result = await db.execute(
        select(func.count(Product.id)).filter(Product.stock <= Product.low_stock_limit)
    )
    return {"count": result.scalar() or 0}

@router.get("/{product_id}", response_model=ProductInDB)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get detail of a single product.
    """
    repo = ProductRepository(db)
    product = await repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductInDB, status_code=status.HTTP_201_CREATED)
async def create_product(
    obj_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECHNICIAN"]))
):
    """
    Add a new product to inventory (Admins and Technicians only).
    """
    repo = ProductRepository(db)
    existing = await repo.get_by_sku(obj_in.sku)
    if existing:
        raise HTTPException(status_code=400, detail="Product with this SKU/Barcode already exists")
    return await repo.create(obj_in)

@router.put("/{product_id}", response_model=ProductInDB)
async def update_product(
    product_id: int,
    obj_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECHNICIAN"]))
):
    """
    Update product details or inventory count (Admins and Technicians only).
    """
    repo = ProductRepository(db)
    product = await repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return await repo.update(product, obj_in)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"]))
):
    """
    Remove product from catalog (Admin-only).
    """
    repo = ProductRepository(db)
    product = await repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await repo.delete(product)
    return
