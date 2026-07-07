import random
from datetime import datetime, timedelta, timezone

from app.models.models import Category, Employee, Product, Sale, SaleItem, WorkOrder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


async def seed_data(db: AsyncSession):
    # 1. Seed Employees — only the superadmin, others create via Supabase OAuth
    employees_to_seed = [
        {
            "email": "adonix2000@gmail.com",
            "name": "Leonel Ramos",
            "role": "ADMIN",
            "phone": "+15551112",
            "status": "ACTIVE",
            "is_active": True,
        },
    ]

    seeded_employees = {}
    for emp_data in employees_to_seed:
        result = await db.execute(
            select(Employee).filter(Employee.email == emp_data["email"])
        )
        emp = result.scalars().first()
        if not emp:
            emp = Employee(**emp_data)
            db.add(emp)
            await db.commit()
            await db.refresh(emp)
        seeded_employees[emp.email] = emp.id

    await db.commit()

    admin_id = seeded_employees.get("admin@infinity.com")

    if admin_id is None:
        return


def randfloat(min_v, max_v):
    return round(random.uniform(min_v, max_v), 2)
