from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, delete, update
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.core.auth import get_current_user, require_role
from app.core.config import settings
from app.models.models import Employee, Sale, SaleItem, WorkOrder, WorkOrderAssignment, Product, WeeklySnapshot
from app.schemas.schemas import DashboardMetrics, WeeklySnapshotInDB
from datetime import datetime, timezone, timedelta
from typing import List, Optional

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    technician_id: Optional[int] = Query(None, description="Admin: filter by technician employee ID"),
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get real-time dashboard analytics.
    - ADMIN: sees combined data; optional technician_id filter scopes to one tech.
    - TECHNICIAN: sees only their own metrics (technician_id param is ignored).
    - Work order revenue counts only when status is DELIVERED.
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Determine scope: TECH sees own data, ADMIN can filter or see all
    scope_employee_id: Optional[int] = None
    if current_user.role == 'TECHNICIAN':
        scope_employee_id = current_user.id
    elif current_user.role == 'ADMIN' and technician_id is not None:
        if technician_id != current_user.id:
            # Verify the requested technician exists
            tech = await db.get(Employee, technician_id)
            if not tech or tech.role not in ('TECHNICIAN',):
                raise HTTPException(status_code=400, detail="Invalid technician_id")
        scope_employee_id = technician_id

    # Cleanup: migrate any remaining CASHIER role to TECHNICIAN
    await db.execute(
        update(Employee).where(Employee.role == "CASHIER").values(role="TECHNICIAN")
    )
    await db.commit()

    # 1. Sales today
    sales_query = select(func.sum(Sale.total)).filter(Sale.created_at >= today_start)
    if scope_employee_id is not None:
        sales_query = sales_query.filter(Sale.seller_id == scope_employee_id)
    sales_res = await db.execute(sales_query)
    sales_today = sales_res.scalar() or 0.0

    # 1b. Items sold today
    items_query = (
        select(func.sum(SaleItem.quantity))
        .join(Sale, SaleItem.sale_id == Sale.id)
        .filter(Sale.created_at >= today_start)
    )
    if scope_employee_id is not None:
        items_query = items_query.filter(Sale.seller_id == scope_employee_id)
    items_res = await db.execute(items_query)
    sales_items_count = items_res.scalar() or 0

    # 2. Repairs completed today (only DELIVERED — counts when actually delivered)
    repairs_count_query = select(func.count(WorkOrder.id)).filter(
        WorkOrder.status == "DELIVERED",
        WorkOrder.updated_at >= today_start
    )
    if scope_employee_id is not None:
        repairs_count_query = repairs_count_query.filter(WorkOrder.assigned_technician_id == scope_employee_id)
    repairs_count_res = await db.execute(repairs_count_query)
    repairs_today = repairs_count_res.scalar() or 0

    # 3. Revenue today: sales total + amount_paid from DELIVERED orders only
    repairs_rev_query = select(func.sum(WorkOrder.amount_paid)).filter(
        WorkOrder.status == "DELIVERED",
        WorkOrder.updated_at >= today_start
    )
    if scope_employee_id is not None:
        repairs_rev_query = repairs_rev_query.filter(WorkOrder.assigned_technician_id == scope_employee_id)
    repairs_rev_res = await db.execute(repairs_rev_query)
    repairs_rev_today = repairs_rev_res.scalar() or 0.0
    revenue_today = sales_today + repairs_rev_today

    # 4. Low stock products count (global, not per-tech)
    low_stock_res = await db.execute(
        select(func.count(Product.id)).filter(Product.stock <= Product.low_stock_limit)
    )
    low_stock_count = low_stock_res.scalar() or 0

    # 5. Top sold products (scoped if technician filter)
    top_sold_query = (
        select(Product.name, Product.sku, func.sum(SaleItem.quantity).label("sold_qty"))
        .join(SaleItem, SaleItem.product_id == Product.id)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .group_by(Product.id)
        .order_by(func.sum(SaleItem.quantity).desc())
        .limit(5)
    )
    if scope_employee_id is not None:
        top_sold_query = top_sold_query.filter(Sale.seller_id == scope_employee_id)
    top_sold_res = await db.execute(top_sold_query)
    top_sold_products = []
    for row in top_sold_res.all():
        top_sold_products.append({
            "name": row[0],
            "sku": row[1],
            "quantity": int(row[2])
        })

    # 6. Employee activity (Weekly summary)
    # When scoped to a technician, only show that employee
    monday_start = today_start - timedelta(days=today_start.weekday())

    if scope_employee_id is not None:
        emp = await db.get(Employee, scope_employee_id)
        active_employees = [emp] if emp else []
    else:
        emp_res = await db.execute(
            select(Employee).filter(
                Employee.is_active == True,
                Employee.role.in_(["ADMIN", "TECHNICIAN"])
            )
        )
        active_employees = emp_res.scalars().all()

    employee_activity = []
    for emp in active_employees:
        # Sum of sales by this employee this week
        emp_sales_res = await db.execute(
            select(func.sum(Sale.total)).filter(
                and_(Sale.seller_id == emp.id, Sale.created_at >= monday_start)
            )
        )
        emp_sales = emp_sales_res.scalar() or 0.0

        # Sum of amount_paid for repairs delivered this week
        emp_repairs_rev_res = await db.execute(
            select(func.sum(WorkOrder.amount_paid)).filter(
                and_(
                    WorkOrder.assigned_technician_id == emp.id,
                    WorkOrder.status == "DELIVERED",
                    WorkOrder.updated_at >= monday_start
                )
            )
        )
        emp_repairs_rev = emp_repairs_rev_res.scalar() or 0.0

        employee_activity.append({
            "employee_id": emp.id,
            "name": emp.name,
            "role": emp.role,
            "sales_total": emp_sales,
            "repairs_revenue": emp_repairs_rev
        })

    return DashboardMetrics(
        sales_today=sales_today,
        sales_items_count=sales_items_count,
        repairs_today=repairs_today,
        repairs_revenue_today=repairs_rev_today,
        revenue_today=revenue_today,
        low_stock_products_count=low_stock_count,
        top_sold_products=top_sold_products,
        employee_activity=employee_activity
    )


@router.post("/weekly-reset", response_model=List[WeeklySnapshotInDB])
async def reset_weekly_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"]))
):
    """
    Admin-only: Trigger weekly snapshots before resetting statistics.
    Pre-saves employee metrics into a snapshots history table so performance is retained.
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    monday_start = today_start - timedelta(days=today_start.weekday())

    # Snapshot week format: e.g., 2026-W22
    year, week, _ = now.isocalendar()
    snapshot_week_str = f"{year}-W{week:02d}"

    # Check if a snapshot for this week already exists
    exists_res = await db.execute(
        select(WeeklySnapshot).filter(WeeklySnapshot.snapshot_week == snapshot_week_str)
    )
    if exists_res.scalars().first():
        raise HTTPException(
            status_code=400,
            detail=f"Weekly snapshot for week {snapshot_week_str} has already been created."
        )

    emp_res = await db.execute(select(Employee).filter(Employee.is_active == True))
    active_employees = emp_res.scalars().all()

    created_snapshots = []
    for emp in active_employees:
        # Weekly sales
        emp_sales_res = await db.execute(
            select(func.sum(Sale.total)).filter(
                and_(Sale.seller_id == emp.id, Sale.created_at >= monday_start)
            )
        )
        emp_sales = emp_sales_res.scalar() or 0.0

        # Weekly repairs completed
        emp_repairs_res = await db.execute(
            select(func.count(WorkOrder.id)).filter(
                and_(
                    WorkOrder.assigned_technician_id == emp.id,
                    WorkOrder.status == "DELIVERED",
                    WorkOrder.updated_at >= monday_start
                )
            )
        )
        emp_repairs = emp_repairs_res.scalar() or 0

        snapshot = WeeklySnapshot(
            employee_id=emp.id,
            snapshot_week=snapshot_week_str,
            total_sales=emp_sales,
            completed_repairs=emp_repairs
        )
        db.add(snapshot)
        created_snapshots.append(snapshot)

    await db.commit()

    final_snapshots = []
    for snap in created_snapshots:
        res = await db.execute(
            select(WeeklySnapshot).options(selectinload(WeeklySnapshot.employee)).filter(WeeklySnapshot.id == snap.id)
        )
        final_snapshots.append(res.scalars().first())

    return final_snapshots


@router.post("/reset-test-data")
async def reset_test_data(
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Dev-only: Clears all test transactions (sales, work orders, assignments).
    Only available when MOCK_AUTH is enabled.
    """
    if not settings.MOCK_AUTH:
        raise HTTPException(status_code=403, detail="Only available in mock/dev mode")

    # Delete in order: SaleItems cascade from Sales, but explicit order is cleaner
    await db.execute(delete(SaleItem))
    await db.execute(delete(Sale))
    await db.execute(delete(WorkOrderAssignment))
    await db.execute(delete(WorkOrder))
    await db.commit()

    return {"message": "All test data cleared successfully"}


@router.get("/snapshots", response_model=List[WeeklySnapshotInDB])
async def list_snapshots(
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"]))
):
    """
    Admin-only: View historic performance snapshots.
    """
    result = await db.execute(
        select(WeeklySnapshot).options(selectinload(WeeklySnapshot.employee)).order_by(WeeklySnapshot.created_at.desc())
    )
    return list(result.scalars().all())
