from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.auth import get_current_user, require_role
from app.models.models import Employee
from app.schemas.schemas import WorkOrderInDB, WorkOrderCreate, WorkOrderUpdate, WorkOrderAssignmentBase
from app.repositories.base_repos import WorkOrderRepository, EmployeeRepository
from app.pdf.generator import generate_work_order_pdf
from pydantic import BaseModel
from typing import List
import os

router = APIRouter(prefix="/work-orders", tags=["Work Orders"])

class PaginatedWorkOrdersResponse(BaseModel):
    items: List[WorkOrderInDB]
    total: int
    page: int
    limit: int

@router.get("/", response_model=PaginatedWorkOrdersResponse)
async def list_work_orders(
    search: str = Query("", description="Search by customer name, phone, imei, brand, or model"),
    status: str = Query("", description="Filter by status (RECEIVED, IN_REVIEW, WAITING_PARTS, IN_PROGRESS, READY, DELIVERED, CANCELLED)"),
    assigned_id: int = Query(None, description="Filter by assigned technician employee ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get paginated repair work orders with filters.
    Accessible to all logged-in employees.
    """
    repo = WorkOrderRepository(db)
    items, total = await repo.get_all_paginated(
        search=search, status=status, assigned_id=assigned_id, page=page, limit=limit
    )
    return PaginatedWorkOrdersResponse(
        items=items,
        total=total,
        page=page,
        limit=limit
    )

@router.get("/{work_order_id}", response_model=WorkOrderInDB)
async def get_work_order(
    work_order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get detailed view of a work order including transfer logs.
    """
    repo = WorkOrderRepository(db)
    work_order = await repo.get_by_id(work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    return work_order

@router.post("/", response_model=WorkOrderInDB, status_code=status.HTTP_201_CREATED)
async def create_work_order(
    obj_in: WorkOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECHNICIAN"]))
):
    """
    Create a new technical service repair work order (Admins and Cashiers only).
    """
    repo = WorkOrderRepository(db)
    # If assigned, check if technician is actually an employee
    if obj_in.assigned_technician_id:
        emp_repo = EmployeeRepository(db)
        tech = await emp_repo.get_by_id(obj_in.assigned_technician_id)
        if not tech or tech.role != "TECHNICIAN":
            raise HTTPException(status_code=400, detail="Assigned technician ID is not a valid Technician")
            
    return await repo.create(obj_in, creator_id=current_user.id)

@router.put("/{work_order_id}", response_model=WorkOrderInDB)
async def update_work_order(
    work_order_id: int,
    obj_in: WorkOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Update work order fields or status.
    Role checks: Technicians can modify assigned jobs; Cashiers/Admins can modify any.
    """
    repo = WorkOrderRepository(db)
    work_order = await repo.get_by_id(work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
        
    # Enforce technician ownership restriction
    if current_user.role == "TECHNICIAN" and work_order.assigned_technician_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Technicians can only modify repair orders explicitly assigned to them."
        )
        
    # Check if technician updated
    if obj_in.assigned_technician_id:
        emp_repo = EmployeeRepository(db)
        tech = await emp_repo.get_by_id(obj_in.assigned_technician_id)
        if not tech or tech.role != "TECHNICIAN":
            raise HTTPException(status_code=400, detail="Technician assignment is invalid")

    return await repo.update(work_order, obj_in, updater_id=current_user.id)

@router.post("/{work_order_id}/transfer", response_model=WorkOrderInDB)
async def transfer_work_order(
    work_order_id: int,
    obj_in: WorkOrderAssignmentBase,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN", "TECHNICIAN"]))
):
    """
    Transfer a repair order to another technician.
    Saves transfer logs inside the assignment history to maintain full accountability.
    """
    repo = WorkOrderRepository(db)
    work_order = await repo.get_by_id(work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
        
    emp_repo = EmployeeRepository(db)
    to_tech = await emp_repo.get_by_id(obj_in.to_employee_id)
    if not to_tech or to_tech.role != "TECHNICIAN":
        raise HTTPException(status_code=400, detail="Recipient employee must be a Technician")
        
    # Enforce technician ownership on transfer initiation
    if current_user.role == "TECHNICIAN" and work_order.assigned_technician_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Technicians can only transfer repair jobs assigned to themselves."
        )
        
    return await repo.transfer(
        db_obj=work_order, 
        to_tech_id=obj_in.to_employee_id, 
        reason=obj_in.reason, 
        actor_id=current_user.id
    )

@router.get("/{work_order_id}/pdf")
async def download_work_order_pdf(
    work_order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    repo = WorkOrderRepository(db)
    wo = await repo.get_by_id(work_order_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    pdf_path = generate_work_order_pdf(
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
        created_by_name=wo.created_by.name if wo.created_by else "System",
        assigned_tech_name=wo.assigned_technician.name if wo.assigned_technician else "",
    )

    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail="Could not generate work order PDF")

    return FileResponse(pdf_path, media_type="application/pdf", filename=os.path.basename(pdf_path))
