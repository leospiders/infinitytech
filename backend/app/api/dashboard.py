from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from sqlalchemy.orm import selectinload
from app.db.session import get_db, _Session
from app.core.auth import get_current_user, require_role
from app.models.models import Employee, Sale, SaleItem, WorkOrder, Product, WeeklySnapshot
from app.schemas.schemas import (
    DashboardMetrics, WeeklySnapshotInDB, ReportPeriodOut, PeriodicReportOut,
    WeeklyDetailReport, WeeklySaleDetail, WeeklyRepairDetail,
)
from app.reports.html_reporter import generate_weekly_html
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi.responses import HTMLResponse

# Bolivia timezone (UTC-4, no DST)
BOLIVIA_TZ = timezone(timedelta(hours=-4))


def _now_bolivia() -> datetime:
    """Current datetime in Bolivia timezone."""
    return datetime.now(timezone.utc).astimezone(BOLIVIA_TZ)


def _today_start_utc() -> datetime:
    """Midnight today Bolivia time, converted to UTC for DB queries."""
    bolivia_now = datetime.now(timezone.utc).astimezone(BOLIVIA_TZ)
    bolivia_midnight = bolivia_now.replace(hour=0, minute=0, second=0, microsecond=0)
    return bolivia_midnight.astimezone(timezone.utc)

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

        emp_items_res = await db.execute(
            select(func.sum(SaleItem.quantity))
            .join(Sale, SaleItem.sale_id == Sale.id)
            .filter(
                and_(Sale.seller_id == emp.id, Sale.created_at >= period_start)
            )
        )
        emp_items = emp_items_res.scalar() or 0

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
            items_sold=emp_items,
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

    total_items = sum(s.items_sold for s in created_snapshots)

    return PeriodicReportOut(
        period_start=period_start.isoformat(),
        period_end=period_end.isoformat(),
        is_definitive=is_definitive,
        total_sales=total_sales,
        total_repairs=total_repairs,
        total_items_sold=total_items,
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
    today_start = _today_start_utc()

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

    # 6. Sales this week (from last DEFINITIVE report or Bolivia Monday)
    last_def_res = await db.execute(
        select(func.max(WeeklySnapshot.created_at)).filter(
            WeeklySnapshot.is_definitive == True
        )
    )
    last_definitive = last_def_res.scalar()
    # Use Bolivia time to determine the start of the current week
    bolivia_now = _now_bolivia()
    week_start = last_definitive if last_definitive else _get_week_start(bolivia_now).astimezone(timezone.utc)
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
    bolivia_now = _now_bolivia()

    # Find last DEFINITIVE report date as period start
    last_def_res = await db.execute(
        select(func.max(WeeklySnapshot.created_at)).filter(
            WeeklySnapshot.is_definitive == True
        )
    )
    last_definitive = last_def_res.scalar()

    if last_definitive is None:
        period_start = _get_week_start(bolivia_now).astimezone(timezone.utc)
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


# ─── Weekly Detail Report ─────────────────────────────────────────

async def _parse_period(period: str) -> tuple[datetime, datetime]:
    """Parse period label 'YYYY-MM-DD--YYYY-MM-DD' into UTC datetime boundaries."""
    parts = period.split("--")
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid period format, expected YYYY-MM-DD--YYYY-MM-DD")
    try:
        start_date = datetime.strptime(parts[0], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end_date = datetime.strptime(parts[1], "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        return start_date, end_date
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format in period label")


@router.get("/weekly-report/detail", response_model=WeeklyDetailReport)
async def weekly_report_detail(
    period: str = Query(..., description="Period label YYYY-MM-DD--YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"])),
):
    """Returns full transactional detail for a period."""
    start_date, end_date = await _parse_period(period)

    # ── Sales detail ──
    sales_query = (
        select(
            Product.name.label("product_name"),
            SaleItem.quantity,
            SaleItem.unit_price,
            Sale.total,
            Sale.created_at,
            Employee.name.label("seller_name"),
        )
        .join(SaleItem, SaleItem.sale_id == Sale.id)
        .join(Product, Product.id == SaleItem.product_id)
        .join(Employee, Employee.id == Sale.seller_id)
        .filter(Sale.created_at.between(start_date, end_date))
        .order_by(Sale.created_at.desc())
    )
    sales_res = await db.execute(sales_query)
    sales_rows = sales_res.all()

    sales_detail = [
        WeeklySaleDetail(
            product_name=row.product_name,
            quantity=int(row.quantity),
            price=float(row.unit_price),
            total=float(row.total),
            date=row.created_at.isoformat(),
            seller_name=row.seller_name,
        )
        for row in sales_rows
    ]

    # ── Repairs detail ──
    repairs_query = (
        select(
            func.concat(WorkOrder.brand, " ", WorkOrder.model).label("equipment"),
            WorkOrder.imei,
            WorkOrder.status,
            WorkOrder.amount_paid,
            WorkOrder.updated_at,
            Employee.name.label("technician"),
        )
        .join(Employee, Employee.id == WorkOrder.assigned_technician_id)
        .filter(
            WorkOrder.updated_at.between(start_date, end_date),
            WorkOrder.status == "entregado",
        )
        .order_by(WorkOrder.updated_at.desc())
    )
    repairs_res = await db.execute(repairs_query)
    repairs_rows = repairs_res.all()

    repairs_detail = [
        WeeklyRepairDetail(
            equipment=row.equipment,
            imei=row.imei or "—",
            status=row.status,
            cost=float(row.amount_paid or 0),
            date=row.updated_at.isoformat(),
            technician=row.technician,
        )
        for row in repairs_rows
    ]

    total_sales = sum(d.total for d in sales_detail)
    total_items = sum(d.quantity for d in sales_detail)
    total_repairs = len(repairs_detail)
    total_repairs_revenue = sum(r.cost for r in repairs_detail)

    return WeeklyDetailReport(
        period=period,
        generated_at=_now_bolivia().isoformat(),
        total_sales=total_sales,
        total_items=total_items,
        total_repairs=total_repairs,
        total_repairs_revenue=total_repairs_revenue,
        sales=sales_detail,
        repairs=repairs_detail,
    )


@router.get("/weekly-report/html", response_class=HTMLResponse)
async def weekly_report_html(
    period: str = Query(..., description="Period label YYYY-MM-DD--YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_role(["ADMIN"])),
):
    """Generates and downloads an auto-contained HTML report for a period."""
    detail = await weekly_report_detail(period, db, current_user)

    html = generate_weekly_html(
        period=detail.period,
        generated_at=detail.generated_at,
        total_sales=detail.total_sales,
        total_items=detail.total_items,
        total_repairs=detail.total_repairs,
        total_repairs_revenue=detail.total_repairs_revenue,
        sales=[s.model_dump() for s in detail.sales],
        repairs=[r.model_dump() for r in detail.repairs],
    )

    filename = f"reporte-semanal-{period.replace('--', '-')}.html"
    return HTMLResponse(
        content=html,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
