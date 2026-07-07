from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, func
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.models import Employee, Product, Sale, SaleItem, WorkOrder, WorkOrderAssignment
from app.schemas.schemas import SaleInDB, WorkOrderInDB
from typing import List, Union
from pydantic import BaseModel
from datetime import timezone

router = APIRouter(prefix="/history", tags=["History"])

class HistoryItem(BaseModel):
    type: str
    id: int
    uuid: str
    customer_name: str
    created_at: str
    total: float
    status: str
    payment_method: str = ""
    data: Union[SaleInDB, WorkOrderInDB, dict]

class PaginatedHistoryResponse(BaseModel):
    items: List[HistoryItem]
    total: int
    page: int
    limit: int

@router.get("/", response_model=PaginatedHistoryResponse)
async def get_unified_history(
    search: str = Query("", description="Search by customer name or phone"),
    type_filter: str = Query("", description="Filter by type: sale, repair"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
):
    combined = []
    total = 0

    if not type_filter or type_filter == "sale":
        sale_query = select(Sale).options(
            selectinload(Sale.seller),
            selectinload(Sale.items).selectinload(SaleItem.product).selectinload(Product.category),
        )
        sale_filters = []
        if search:
            sale_filters.append(or_(
                Sale.customer_name.ilike(f"%{search}%"),
                Sale.customer_phone.ilike(f"%{search}%"),
            ))
        if sale_filters:
            sale_query = sale_query.filter(and_(*sale_filters))
        sale_count_q = select(func.count()).select_from(sale_query.subquery())
        sale_total = (await db.execute(sale_count_q)).scalar_one()
        total += sale_total

        sale_result = await db.execute(
            sale_query.order_by(Sale.created_at.desc()).limit(limit).offset((page - 1) * limit)
        )
        for s in sale_result.scalars().all():
            combined.append(HistoryItem(
                type="sale",
                id=s.id,
                uuid=s.uuid,
                customer_name=s.customer_name or "General",
                created_at=s.created_at.replace(tzinfo=timezone.utc).isoformat(),
                total=s.total,
                status="COMPLETED",
                payment_method=s.payment_method,
                data=SaleInDB.model_validate(s),
            ))

    if not type_filter or type_filter == "repair":
        repair_query = select(WorkOrder).options(
            selectinload(WorkOrder.assigned_technician),
            selectinload(WorkOrder.created_by),
            selectinload(WorkOrder.items),
            selectinload(WorkOrder.assignments).selectinload(WorkOrderAssignment.from_employee),
            selectinload(WorkOrder.assignments).selectinload(WorkOrderAssignment.to_employee),
        )
        repair_filters = []
        if search:
            repair_filters.append(or_(
                WorkOrder.customer_name.ilike(f"%{search}%"),
                WorkOrder.phone_number.ilike(f"%{search}%"),
                WorkOrder.imei.ilike(f"%{search}%"),
            ))
        if repair_filters:
            repair_query = repair_query.filter(and_(*repair_filters))
        repair_count_q = select(func.count()).select_from(repair_query.subquery())
        repair_total = (await db.execute(repair_count_q)).scalar_one()
        total += repair_total

        repair_result = await db.execute(
            repair_query.order_by(WorkOrder.created_at.desc()).limit(limit).offset((page - 1) * limit)
        )
        for wo in repair_result.scalars().all():
            combined.append(HistoryItem(
                type="repair",
                id=wo.id,
                uuid=wo.uuid,
                customer_name=wo.customer_name,
                created_at=wo.created_at.replace(tzinfo=timezone.utc).isoformat(),
                total=wo.total_cost,
                status=wo.status,
                payment_method=wo.payment_method or "",
                data=WorkOrderInDB.model_validate(wo),
            ))

    combined.sort(key=lambda h: h.created_at, reverse=True)
    combined = combined[:limit]

    return PaginatedHistoryResponse(
        items=combined,
        total=total,
        page=page,
        limit=limit,
    )
