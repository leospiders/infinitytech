from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.schemas.schemas import PublicProductOut, PublicCategoryOut, PublicInventoryResult
from app.models.models import Product, Category
from typing import List, Optional

router = APIRouter(prefix="/public", tags=["Public"])


@router.get("/categories", response_model=List[PublicCategoryOut])
async def list_public_categories(
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint — no auth required.
    Returns all categories with their product count.
    """
    result = await db.execute(
        select(
            Category.id,
            Category.name,
            Category.description,
            func.count(Product.id).label("product_count"),
        )
        .outerjoin(Product, Product.category_id == Category.id)
        .group_by(Category.id, Category.name, Category.description)
        .order_by(Category.name)
    )
    rows = result.all()
    return [
        PublicCategoryOut(
            id=row.id,
            name=row.name,
            description=row.description,
            product_count=row.product_count,
        )
        for row in rows
    ]


@router.get("/products", response_model=List[PublicProductOut])
async def list_public_products(
    type: Optional[str] = Query(None, pattern="^(physical|digital_service)$"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint — no auth required.
    Returns non-repuesto products with prices for the landing page / catalog.
    Optional `type` filter: 'physical' or 'digital_service'.
    """
    query = (
        select(Product)
        .options(selectinload(Product.category))
        .join(Category, Product.category_id == Category.id)
        .filter(Category.is_repuesto == False)
    )
    if type:
        query = query.filter(Product.product_type == type)
    result = await db.execute(query.order_by(Product.name).limit(limit))
    return list(result.scalars().all())


@router.get("/inventory/search", response_model=List[PublicInventoryResult])
async def search_public_inventory(
    q: str = Query("", min_length=0, max_length=100),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint — no auth required.
    Search across ALL products (repuestos + accesorios + servicios).
    If `q` is empty, returns featured products (limited).
    Never exposes full inventory without a search query.
    """
    query = (
        select(Product, Category.name.label("category_name"), Category.is_repuesto)
        .join(Category, Product.category_id == Category.id)
    )

    if q.strip():
        pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(pattern),
                Product.sku.ilike(pattern),
                Category.name.ilike(pattern),
            )
        )
        max_results = limit
    else:
        max_results = 8  # featured products, never expose full inventory

    result = await db.execute(
        query.order_by(Product.name).limit(max_results)
    )
    rows = result.all()

    return [
        PublicInventoryResult(
            id=row.Product.id,
            name=row.Product.name,
            price=row.Product.price,
            product_type=row.Product.product_type,
            category_name=row.category_name,
            category_id=row.Product.category_id,
            is_repuesto=row.is_repuesto,
            stock=row.Product.stock,
            in_stock=row.Product.stock > 0,
        )
        for row in rows
    ]
