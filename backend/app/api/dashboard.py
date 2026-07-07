from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from sqlalchemy.orm import selectinload
from app.db.session import get_db, _Session
from app.core.auth import get_current_user, require_role
from app.models.models import Employee, Sale, SaleItem, WorkOrder, Product, WeeklySnapshot
from app.schemas.schemas import DashboardMetrics, WeeklySnapshotInDB, ReportPeriodOut, PeriodicReportOut
from datetime import datetime, timezone, timedelta
from typing import List, Optional

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ─── Shared helpers ───────────────────────────────────────────────

async def _generate_snapshots(
    db: AsyncSession,
    period_start: datetime,
    period_end: datetime,
    is_definitive: bool,
) -> PeriodicReportOut:
    """Calculate per-employee metrics and save snapshots for a period."""
    period_label = (
        f"{period_start.strftime('%Y-%m-%d')}--{period_end.strftime('%Y-%m-%d')}"
    )

    emp_res = await db.execute(select(Employee).filter(Employee.is_active == True))
    active_employees = emp_res.scalars().all()

    created_snapshots: list[WeeklySnapshot] = []
    total_sales = 0.0
    total_repairs = 0

    for emp in active_employees:
        emp_sales_res = await db.execute(
            select(func.sum(Sale.total)).filter(
                and_(Sale.seller_id == emp.id, Sale.created_at >= period_start)
            )
        )
        emp_sales = emp_sales_res.scalar() or 0.0

        emp_repairs_res = await db.execute(
            select(func.count(WorkOrder.id)).filter(
                and_(
                    WorkOrder.assigned_technician_id == emp.id,
                    WorkOrder.status == "entregado",
                    WorkOrder.updated_at >= period_start,
                )
            )
        )
        emp_repairs = emp_repairs_res.scalar() or 0

        snapshot = WeeklySnapshot(
            employee_id=emp.id,
            snapshot_week=period_label,
            total_sales=emp_sales,
            completed_repairs=emp_repairs,
            is_definitive=is_definitive,
        )
        db.add(snapshot)
        created_snapshots.append(snapshot)
        total_sales += emp_sales
        total_repairs += emp_repairs

    await db.commit()

    final_snapshots: list[WeeklySnapshot] = []
    for snap in created_snapshots:
        res = await db.execute(
            select(WeeklySnapshot)
            .options(selectinload(WeeklySnapshot.employee))
            .filter(WeeklySnapshot.id == snap.id)
        )
        final_snapshots.append(res.scalars().first())

    return PeriodicReportOut(
        period_start=period_start.isoformat(),
        period_end=period_end.isoformat(),
        is_definitive=is_definitive,
        total_sales=total_sales,
        total_repairs=total_repairs,
        employees=final_snapshots,
    )


def _get_week_start(dt: datetime) -> datetime:
    """Return Monday 00:00 of the ISO week containing dt."""
    start = dt.replace(hour=0, minute=0, second=0, microsecond=0)
    return start - timedelta(days=start.weekday())


# ─── Endpoints ────────────────────────────────────────────────────

@router.get("/", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    technician_id: Optional[int] = Query(None, description="Admin: filter by technician employee ID"),
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    scope_employee_id: Optional[int] = None
    if current_user.role in ("TECH_IT", "TECH_COM"):
        scope_employee_id = current_user.id
    elif current_user.role == "ADMIN" and technician_id is not None:
        if technician_id != current_user.id:
            tech = await db.get(Employee, technician_id)
            if not tech or tech.role not in ("TECH_IT", "TECH_COM"):
                raise HTTPException(status_code=400, detail="Invalid technician_id")
        scope_employee_id = technician_id

    if current_user.role == "TECH_COM":
        return DashboardMetrics(
            sales_today=0, sales_items_count=0, repairs_today=0,
            repairs_revenue_today=0, revenue_today=0,
            low_stock_products_count=0, top_sold_products=[], employee_activity=[],
        )

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

    # 2. Repairs completed today
    repairs_count_query = select(func.count(WorkOrder.id)).filter(
        WorkOrder.status == "entregado",
        WorkOrder.updated_at >= today_start,
    )
    if scope_employee_id is not None:
        repairs_count_query = repairs_count_query.filter(
            WorkOrder.assigned_technician_id == scope_employee_id
        )
    repairs_count_res = await db.execute(repairs_count_query)
    repairs_today = repairs_count_res.scalar() or 0

    # 3. Revenue today
    repairs_rev_query = select(func.sum(WorkOrder.amount_paid)).filter(
        WorkOrder.status == "entregado",
        WorkOrder.updated_at >= today_start,
    )
    if scope_employee_id is not None:
        repairs_rev_query = repairs_rev_query.filter(
            WorkOrder.assigned_technician_id == scope_employee_id
        )
    repairs_rev_res = await db.execute(repairs_rev_query)
    repairs_rev_today = repairs_rev_res.scalar() or 0.0
    revenue_today = sales_today + repairs_rev_today

    # 4. Low stock
    low_stock_res = await db.execute(
        select(func.count(Product.id)).filter(Product.stock <= Product.low_stock_limit)
    )
    low_stock_count = low_stock_res.scalar() or 0

    # 5. Top sold products
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
    top_sold_products = [
        {"name": row[0], "sku": row[1], "quantity": int(row[2])}
        for row in top_sold_res.all()
    ]

    # 6. Sales this week (from last DEFINITIVE report or Monday)
    last_def_res = await db.execute(
        select(func.max(WeeklySnapshot.created_at)).filter(
            WeeklySnapshot.is_definitive == True
        )
    )
    last_definitive = last_def_res.scalar()
    week_start = last_definitive if last_definitive else _get_week_start(now)
    last_report_str = last_definitive.isoformat() if last_definitive else None

    sales_week_query = select(func.sum(Sale.total)).filter(
        Sale.created_at >= week_start
    )
    if scope_employee_id is not None:
        sales_week_query = sales_week_query.filter(Sale.seller_id == scope_employee_id)
    sales_week_res = await db.execute(sales_week_query)
    sales_this_week = sales_week_res.scalar() or 0.0

    # 7. Employee activity (from last definitive report or Monday)
    if scope_employee_id is not None:
        emp = await db.get(Employee, scope_employee_id)
        active_employees = [emp] if emp else []
    else:
        emp_res = await db.execute(
            select(Employee).filter(
                Employee.is_active == True,
                Employee.role.in_(["ADMIN", "TECH_IT"]),
            )
        )
        active_employees = emp_res.scalars().all()

    employee_activity = []
    for emp in active_employees:
        emp_sales_res = await db.execute(
            select(func.sum(Sale.total)).filter(
                and_(Sale.seller_id == emp.id, Sale.created_at >= week_start)
            )
        )
        emp_sales = emp_sales_res.scalar() or 0.0

        emp_repairs_rev_res = await db.execute(
            select(func.sum(WorkOrder.amount_paid)).filter(
                and_(
                    WorkOrder.assigned_technician_id == emp.id,
                    WorkOrder.status == "entregado",
                    WorkOrder.updated_at >= week_start,
                )
            )
        )
        emp_repairs_rev = emp_repairs_rev_res.scalar() or 0.0

        employee_activity.append({
            "employee_id": emp.id,
            "name": emp.name,
            "role": emp.role,
            "sales_total": emp_sales,
            "repairs_revenue": emp_repairs_rev,
        })

    return DashboardMetrics(
        sales_today=sales_today,
        sales_items_count=sales_items_count,
        repairs_today=repairs_today,
        repairs_revenue_today=repairs_rev_today,
        revenue_today=revenue_today,
        low_stock_products_count=low_stock_count,
        sales_this_week=sales_this_week,
        last_report_date=last_report_str,
        top_sold_products=top_sold_products,
        employee_activity=employee_activity,
    )


@router.post("/partial-report", response_model=PeriodicReportOut)
async def partial_report(
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"])),
):
    """
    Manual partial report — saves snapshots WITHOUT resetting the period.
    is_definitive=False. Use this between weeks to check progress.
    """
    now = datetime.now(timezone.utc)

    # Find last DEFINITIVE report date as period start
    last_def_res = await db.execute(
        select(func.max(WeeklySnapshot.created_at)).filter(
            WeeklySnapshot.is_definitive == True
        )
    )
    last_definitive = last_def_res.scalar()

    if last_definitive is None:
        period_start = _get_week_start(now)
    else:
        period_start = last_definitive

    return await _generate_snapshots(db, period_start, now, is_definitive=False)


@router.get("/report-periods", response_model=List[ReportPeriodOut])
async def report_periods(
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"])),
):
    """
    List distinct report periods for the select dropdown.
    Groups by snapshot_week label, returns summary per period.
    """
    rows = await db.execute(
        select(
            WeeklySnapshot.snapshot_week,
            WeeklySnapshot.is_definitive,
            func.max(WeeklySnapshot.created_at).label("generated_at"),
            func.sum(WeeklySnapshot.total_sales).label("total_sales"),
            func.sum(WeeklySnapshot.completed_repairs).label("total_repairs"),
            func.count().label("employee_count"),
        )
        .group_by(WeeklySnapshot.snapshot_week, WeeklySnapshot.is_definitive)
        .order_by(func.max(WeeklySnapshot.created_at).desc())
    )
    return [
        ReportPeriodOut(
            label=row.snapshot_week,
            is_definitive=bool(row.is_definitive),
            generated_at=row.generated_at.isoformat() if row.generated_at else "",
            total_sales=float(row.total_sales or 0),
            total_repairs=int(row.total_repairs or 0),
            employee_count=int(row.employee_count),
        )
        for row in rows.all()
    ]


@router.get("/report", response_model=PeriodicReportOut)
async def get_report(
    period: str = Query(..., description="Period label (snapshot_week value)"),
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"])),
):
    """
    Get a full report for a given period label.
    Returns per-employee breakdown.
    """
    snap_res = await db.execute(
        select(WeeklySnapshot)
        .options(selectinload(WeeklySnapshot.employee))
        .filter(WeeklySnapshot.snapshot_week == period)
    )
    snapshots = list(snap_res.scalars().all())

    if not snapshots:
        raise HTTPException(status_code=404, detail="Report period not found")

    is_definitive = snapshots[0].is_definitive or False
    total_sales = sum(s.total_sales for s in snapshots)
    total_repairs = sum(s.completed_repairs for s in snapshots)
    period_start = snapshots[0].snapshot_week.split("--")[0] if "--" in snapshots[0].snapshot_week else snapshots[0].snapshot_week
    period_end = snapshots[0].snapshot_week.split("--")[1] if "--" in snapshots[0].snapshot_week else snapshots[0].snapshot_week

    return PeriodicReportOut(
        period_start=period_start,
        period_end=period_end,
        is_definitive=is_definitive,
        total_sales=total_sales,
        total_repairs=total_repairs,
        employees=[WeeklySnapshotInDB.model_validate(s) for s in snapshots],
    )


@router.get("/snapshots", response_model=List[WeeklySnapshotInDB])
async def list_snapshots(
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"])),
):
    """Admin-only: View all individual snapshots."""
    result = await db.execute(
        select(WeeklySnapshot)
        .options(selectinload(WeeklySnapshot.employee))
        .order_by(WeeklySnapshot.created_at.desc())
    )
    return list(result.scalars().all())
