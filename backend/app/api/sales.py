from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.auth import get_current_user, require_role
from app.models.models import Employee
from app.schemas.schemas import SaleInDB, SaleCreate
from app.repositories.base_repos import SaleRepository
from app.pdf.generator import generate_pdf_receipt
from pydantic import BaseModel
from typing import List
import os

router = APIRouter(prefix="/sales", tags=["Sales"])

class PaginatedSalesResponse(BaseModel):
    items: List[SaleInDB]
    total: int
    page: int
    limit: int

@router.get("/", response_model=PaginatedSalesResponse)
async def list_sales(
    search: str = Query("", description="Search by customer name or phone"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get paginated transaction list.
    """
    repo = SaleRepository(db)
    items, total = await repo.get_all_paginated(search=search, page=page, limit=limit)
    return PaginatedSalesResponse(
        items=items,
        total=total,
        page=page,
        limit=limit
    )

@router.get("/{sale_id}", response_model=SaleInDB)
async def get_sale(
    sale_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get details of a single transaction.
    """
    repo = SaleRepository(db)
    sale = await repo.get_by_id(sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@router.post("/", response_model=SaleInDB, status_code=status.HTTP_201_CREATED)
async def create_sale(
    obj_in: SaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECHNICIAN"]))
):
    """
    Create a new POS transaction (Admins and Technicians).
    Uses strict inventory deduction and safe transaction-isolated PDF generation.
    """
    repo = SaleRepository(db)
    try:
        # 1. Save and commit transaction in DB
        sale = await repo.create(obj_in, seller_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # Refresh sale object with fully loaded relationships for PDF drawing
    sale = await repo.get_by_id(sale.id)
    
    # 2. Generate PDF receipt safely
    items_list = []
    for item in sale.items:
        items_list.append({
            "name": item.custom_name or (item.product.name if item.product else "Unknown"),
            "quantity": item.quantity,
            "price": item.unit_price,
            "subtotal": item.subtotal
        })
        
    date_str = sale.created_at.strftime('%Y-%m-%d %H:%M')
    
    # Call generator which handles reportlab failures cleanly internally
    pdf_path = generate_pdf_receipt(
        sale_id=sale.id,
        customer_name=sale.customer_name or "General Customer",
        date_str=date_str,
        items=items_list,
        total=sale.total,
        payment_method=sale.payment_method,
        seller_name=current_user.name,
        warranty_info=sale.warranty_info
    )
    
    # 3. If PDF was successfully created, update database record
    if pdf_path:
        sale.pdf_path = pdf_path
        db.add(sale)
        await db.commit()
        sale = await repo.get_by_id(sale.id)
        
    return sale

@router.get("/{sale_id}/pdf")
async def download_sale_receipt(
    sale_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Serve raw receipt PDF for viewing/printing.
    If PDF does not exist, re-generate it on the fly before sending.
    """
    repo = SaleRepository(db)
    sale = await repo.get_by_id(sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
        
    # Check if file exists, if not, generate it!
    if not sale.pdf_path or not os.path.exists(sale.pdf_path):
        items_list = [{
            "name": item.custom_name or (item.product.name if item.product else "Unknown"),
            "quantity": item.quantity,
            "price": item.unit_price,
            "subtotal": item.subtotal
        } for item in sale.items]
        
        pdf_path = generate_pdf_receipt(
            sale_id=sale.id,
            customer_name=sale.customer_name or "General Customer",
            date_str=sale.created_at.strftime('%Y-%m-%d %H:%M'),
            items=items_list,
            total=sale.total,
            payment_method=sale.payment_method,
            seller_name=sale.seller.name,
            warranty_info=sale.warranty_info
        )
        if pdf_path:
            sale.pdf_path = pdf_path
            db.add(sale)
            await db.commit()
        else:
            raise HTTPException(status_code=500, detail="Could not generate receipt PDF file")
            
    return FileResponse(sale.pdf_path, media_type="application/pdf", filename=os.path.basename(sale.pdf_path))
