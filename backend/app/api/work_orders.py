from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
import jwt
from app.db.session import get_db
from app.core.auth import get_current_user, require_role
from app.core.config import settings
from app.models.models import Employee, WorkOrder
from app.schemas.schemas import WorkOrderInDB, WorkOrderCreate, WorkOrderUpdate, WorkOrderAssignmentBase, WorkOrderItemInDB
from app.repositories.base_repos import WorkOrderRepository, EmployeeRepository
from app.pdf.generator import generate_work_order_pdf
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/work-orders", tags=["Work Orders"])

class PaginatedWorkOrdersResponse(BaseModel):
    items: List[WorkOrderInDB]
    total: int
    page: int
    limit: int


@router.get("/", response_model=PaginatedWorkOrdersResponse)
async def list_work_orders(
    search: str = Query("", description="Search by customer name, phone, imei, brand, or model"),
    status: str = Query("", description="Filter by status"),
    assigned_id: int = Query(None, description="Filter by assigned technician"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECH_IT"]))
):
    """Get paginated work orders. TECH_IT and ADMIN can see all."""
    repo = WorkOrderRepository(db)
    items, total = await repo.get_all_paginated(
        search=search, status=status, assigned_id=assigned_id, page=page, limit=limit
    )
    return PaginatedWorkOrdersResponse(items=items, total=total, page=page, limit=limit)


@router.get("/my", response_model=PaginatedWorkOrdersResponse)
async def list_my_work_orders(
    search: str = Query("", description="Search by customer name, phone, imei, brand, or model"),
    status: str = Query("", description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
):
    """
    Get work orders assigned to the current user.
    TECH_COM role: can only see their own assigned orders (read-only).
    """
    repo = WorkOrderRepository(db)
    items, total = await repo.get_all_paginated(
        search=search, status=status, assigned_id=current_user.id, page=page, limit=limit
    )
    return PaginatedWorkOrdersResponse(items=items, total=total, page=page, limit=limit)


@router.get("/{work_order_id}", response_model=WorkOrderInDB)
async def get_work_order(
    work_order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get detailed view of a work order.
    TECH_COM: can only see if assigned to them.
    """
    repo = WorkOrderRepository(db)
    work_order = await repo.get_by_id(work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    # TECH_COM can only see own orders
    if current_user.role == "TECH_COM" and work_order.assigned_technician_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only view your assigned orders.")
    return work_order


@router.post("/", response_model=WorkOrderInDB, status_code=status.HTTP_201_CREATED)
async def create_work_order(
    obj_in: WorkOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECH_IT"]))
):
    """Create a new work order."""
    repo = WorkOrderRepository(db)
    if obj_in.assigned_technician_id:
        emp_repo = EmployeeRepository(db)
        tech = await emp_repo.get_by_id(obj_in.assigned_technician_id)
        if not tech or tech.role not in ("TECH_IT", "TECH_COM"):
            raise HTTPException(status_code=400, detail="Assigned technician ID is not a valid technician")
    return await repo.create(obj_in, creator_id=current_user.id)


@router.put("/{work_order_id}", response_model=WorkOrderInDB)
async def update_work_order(
    work_order_id: int,
    obj_in: WorkOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECH_IT"]))
):
    """Update work order fields or status."""
    repo = WorkOrderRepository(db)
    work_order = await repo.get_by_id(work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    if obj_in.assigned_technician_id:
        emp_repo = EmployeeRepository(db)
        tech = await emp_repo.get_by_id(obj_in.assigned_technician_id)
        if not tech or tech.role not in ("TECH_IT", "TECH_COM"):
            raise HTTPException(status_code=400, detail="Technician assignment is invalid")
    return await repo.update(work_order, obj_in, updater_id=current_user.id)


@router.post("/{work_order_id}/transfer", response_model=WorkOrderInDB)
async def transfer_work_order(
    work_order_id: int,
    obj_in: WorkOrderAssignmentBase,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECH_IT"]))
):
    """Transfer a repair order to another technician."""
    repo = WorkOrderRepository(db)
    work_order = await repo.get_by_id(work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    emp_repo = EmployeeRepository(db)
    to_tech = await emp_repo.get_by_id(obj_in.to_employee_id)
    if not to_tech or to_tech.role not in ("TECH_IT", "TECH_COM"):
        raise HTTPException(status_code=400, detail="Recipient employee must be a technician")
    return await repo.transfer(
        db_obj=work_order,
        to_tech_id=obj_in.to_employee_id,
        reason=obj_in.reason,
        actor_id=current_user.id,
    )


@router.get("/{work_order_id}/pdf")
async def download_work_order_pdf(
    work_order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECH_IT"]))
):
    repo = WorkOrderRepository(db)
    wo = await repo.get_by_id(work_order_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    pdf_items = [
        {
            "brand": it.brand, "model": it.model, "imei": it.imei,
            "desperfecto": it.desperfecto, "diagnostico": it.diagnostico,
            "motivo": it.motivo, "total_cost": it.total_cost,
        }
        for it in (wo.items or [])
    ]
    pdf_buf = generate_work_order_pdf(
        work_order_id=wo.id,
        customer_name=wo.customer_name,
        phone_number=wo.phone_number,
        brand=wo.brand,
        model=wo.model,
        imei=wo.imei or "",
        desperfecto=wo.desperfecto,
        diagnostico=wo.diagnostico or "",
        total_cost=wo.total_cost,
        amount_paid=wo.amount_paid,
        status=wo.status,
        date_str=wo.created_at.strftime('%Y-%m-%d %H:%M'),
        tech_name=wo.created_by.name if wo.created_by else "",
        tech_phone=wo.created_by.phone if wo.created_by else "",
        items=pdf_items,
    )
    if not pdf_buf:
        raise HTTPException(status_code=500, detail="Could not generate work order PDF")
    return Response(
        content=pdf_buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=work_order_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.pdf"}
    )


@router.get("/{work_order_id}/share-link")
async def share_work_order_pdf(
    work_order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECH_IT"]))
):
    """Generate a short-lived share link for WhatsApp."""
    repo = WorkOrderRepository(db)
    wo = await repo.get_by_id(work_order_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    share_token = jwt.encode(
        {
            "type": "work_order",
            "id": work_order_id,
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        },
        settings.SHARE_SECRET,
        algorithm="HS256",
    )
    return {"url": f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}/_share/pdf/{share_token}", "expires_in": 3600}
