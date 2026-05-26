from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import random
from app.models.models import Employee, Category, Product, WorkOrder, Sale, SaleItem
from datetime import datetime, timezone, timedelta

async def seed_data(db: AsyncSession):
    # 1. Seed Employees
    employees_to_seed = [
        {"email": "superadmin@infinity.com", "name": "Super Admin", "role": "SUPERADMIN", "phone": "+15550000", "is_active": True},
        {"email": "admin@infinity.com", "name": "Admin Chief", "role": "ADMIN", "phone": "+15551111", "is_active": True},
        {"email": "technician1@infinity.com", "name": "Carlos Mendez", "role": "TECHNICIAN", "phone": "+15552222", "is_active": True},
        {"email": "technician2@infinity.com", "name": "Lucia Fernandez", "role": "TECHNICIAN", "phone": "+15553333", "is_active": True},
        {"email": "technician3@infinity.com", "name": "Diego Rojas", "role": "TECHNICIAN", "phone": "+15554444", "is_active": True},
        {"email": "inactive@infinity.com", "name": "New Registered", "role": "TECHNICIAN", "phone": "+15555555", "is_active": False},
    ]

    seeded_employees = {}
    for emp_data in employees_to_seed:
        result = await db.execute(select(Employee).filter(Employee.email == emp_data["email"]))
        emp = result.scalars().first()
        if not emp:
            emp = Employee(**emp_data)
            db.add(emp)
            await db.commit()
            await db.refresh(emp)
        else:
            # Update fields if employee already exists
            emp.phone = emp_data["phone"]
            emp.role = emp_data["role"]
            db.add(emp)
            await db.commit()
        seeded_employees[emp.email] = emp.id

    await db.commit()

    # 2. Seed Categories
    categories_to_seed = [
        {"name": "Replacement Parts", "description": "Screens, batteries, charging ports, and other internal parts"},
        {"name": "Accessories", "description": "Phone cases, chargers, screen protectors, and cables"},
        {"name": "Gaming", "description": "Replacement controllers, analog sticks, and console parts"},
        {"name": "Storage & Memory", "description": "SSDs, hard drives, micro SD cards, and RAM modules"},
    ]

    seeded_categories = {}
    for cat_data in categories_to_seed:
        result = await db.execute(select(Category).filter(Category.name == cat_data["name"]))
        cat = result.scalars().first()
        if not cat:
            cat = Category(**cat_data)
            db.add(cat)
            await db.commit()
            await db.refresh(cat)
        seeded_categories[cat.name] = cat.id

    # 3. Seed Products
    products_to_seed = [
        {"name": "iPhone 13 Screen Replacement Assembly", "sku": "PART-IP13-SCR", "category_name": "Replacement Parts", "price": 120.0, "cost": 45.0, "stock": 12, "low_stock_limit": 3},
        {"name": "Samsung Galaxy S22 Ultra Battery 5000mAh", "sku": "PART-S22U-BAT", "category_name": "Replacement Parts", "price": 45.0, "cost": 15.0, "stock": 8, "low_stock_limit": 2},
        {"name": "USB-C Charging Port Board for iPad Pro 11", "sku": "PART-IPAD-CHG", "category_name": "Replacement Parts", "price": 30.0, "cost": 8.0, "stock": 5, "low_stock_limit": 2},
        {"name": "MacBook Air M1 Replacement Keyboard US", "sku": "PART-MBA-KBD", "category_name": "Replacement Parts", "price": 85.0, "cost": 30.0, "stock": 4, "low_stock_limit": 1},
        {"name": "USB-C Fast Charger 20W (Power Delivery)", "sku": "ACC-CHG-20W", "category_name": "Accessories", "price": 25.0, "cost": 7.5, "stock": 50, "low_stock_limit": 10},
        {"name": "Tempered Glass Screen Protector iPhone 14/15", "sku": "ACC-SCR-IP14", "category_name": "Accessories", "price": 15.0, "cost": 2.0, "stock": 100, "low_stock_limit": 15},
        {"name": "Rugged Armor Phone Case (Universal)", "sku": "ACC-CSE-RUG", "category_name": "Accessories", "price": 20.0, "cost": 5.0, "stock": 35, "low_stock_limit": 5},
        {"name": "Anker 3-in-1 Charging Cable (Lightning/Type-C/Micro)", "sku": "ACC-CBL-ANK", "category_name": "Accessories", "price": 18.0, "cost": 6.0, "stock": 40, "low_stock_limit": 8},
        {"name": "Nintendo Switch Replacement Joy-Con Joysticks (Pair)", "sku": "GAM-JOY-ANL", "category_name": "Gaming", "price": 22.0, "cost": 5.0, "stock": 25, "low_stock_limit": 5},
        {"name": "PlayStation 5 Controller DualSense Analog Drift Repair Kit", "sku": "GAM-PS5-DRI", "category_name": "Gaming", "price": 15.0, "cost": 3.0, "stock": 15, "low_stock_limit": 4},
        {"name": "Xbox Series X HDMI Port replacement", "sku": "GAM-XBOX-HDM", "category_name": "Gaming", "price": 20.0, "cost": 4.5, "stock": 6, "low_stock_limit": 2},
        {"name": "PlayStation 4 Laser Lens KEM-490AAA", "sku": "GAM-PS4-LAS", "category_name": "Gaming", "price": 35.0, "cost": 12.0, "stock": 3, "low_stock_limit": 2},
        {"name": "Kingston 1TB NVMe PCIe 4.0 SSD M.2", "sku": "MEM-SSD-1TB", "category_name": "Storage & Memory", "price": 89.0, "cost": 55.0, "stock": 15, "low_stock_limit": 3},
        {"name": "Crucial 8GB DDR4 Laptop RAM 3200MHz", "sku": "MEM-RAM-8GB", "category_name": "Storage & Memory", "price": 32.0, "cost": 18.0, "stock": 20, "low_stock_limit": 5},
        {"name": "SanDisk Extreme MicroSDXC 128GB with Adapter", "sku": "MEM-MSD-128", "category_name": "Storage & Memory", "price": 24.0, "cost": 9.0, "stock": 60, "low_stock_limit": 10},
    ]

    seeded_products = {}
    for prod_data in products_to_seed:
        result = await db.execute(select(Product).filter(Product.sku == prod_data["sku"]))
        prod = result.scalars().first()
        if not prod:
            cat_id = seeded_categories[prod_data["category_name"]]
            prod = Product(
                name=prod_data["name"],
                sku=prod_data["sku"],
                category_id=cat_id,
                price=prod_data["price"],
                cost=prod_data["cost"],
                stock=prod_data["stock"],
                low_stock_limit=prod_data["low_stock_limit"]
            )
            db.add(prod)
            await db.commit()
            await db.refresh(prod)
        seeded_products[prod.sku] = prod.id

    admin_id = seeded_employees["admin@infinity.com"]
    tech1_id = seeded_employees["technician1@infinity.com"]
    tech2_id = seeded_employees["technician2@infinity.com"]
    tech3_id = seeded_employees["technician3@infinity.com"]

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 4. Seed Work Orders — each technician gets their own
    work_orders_data = [
        {"customer_name": "Juan Perez", "phone_number": "555-0101", "brand": "Apple", "model": "iPhone 13", "desperfecto": "Pantalla rota", "assigned_id": tech1_id, "status": "DELIVERED"},
        {"customer_name": "Maria Lopez", "phone_number": "555-0102", "brand": "Samsung", "model": "Galaxy S22", "desperfecto": "Bateria no carga", "assigned_id": tech1_id, "status": "IN_PROGRESS"},
        {"customer_name": "Pedro Ramirez", "phone_number": "555-0103", "brand": "Xiaomi", "model": "Redmi Note 11", "desperfecto": "Pin de carga roto", "assigned_id": tech2_id, "status": "DELIVERED"},
        {"customer_name": "Ana Martinez", "phone_number": "555-0104", "brand": "Motorola", "model": "G52", "desperfecto": "No enciende", "assigned_id": tech2_id, "status": "RECEIVED"},
        {"customer_name": "Luis Torres", "phone_number": "555-0105", "brand": "Apple", "model": "MacBook Air M1", "desperfecto": "Teclado no responde", "assigned_id": tech3_id, "status": "DELIVERED"},
        {"customer_name": "Sofia Vega", "phone_number": "555-0106", "brand": "Samsung", "model": "Galaxy A54", "desperfecto": "Software lento", "assigned_id": tech3_id, "status": "WAITING_PARTS"},
    ]

    seeded_work_orders = []
    for i, wo_data in enumerate(work_orders_data):
        created = today_start - timedelta(hours=3) + timedelta(hours=i)
        result = await db.execute(
            select(WorkOrder).filter(
                WorkOrder.customer_name == wo_data["customer_name"],
                WorkOrder.phone_number == wo_data["phone_number"]
            )
        )
        if result.scalars().first():
            continue
        total_cost = randfloat(30, 150)
        is_delivered = wo_data["status"] == "DELIVERED"
        wo = WorkOrder(
            customer_name=wo_data["customer_name"],
            phone_number=wo_data["phone_number"],
            brand=wo_data["brand"],
            model=wo_data["model"],
            desperfecto=wo_data["desperfecto"],
            assigned_technician_id=wo_data["assigned_id"],
            created_by_id=admin_id,
            status=wo_data["status"],
            total_cost=total_cost,
            amount_paid=total_cost if is_delivered else 0.0,
            payment_method="CASH" if is_delivered else None,
            created_at=created,
            updated_at=created
        )
        db.add(wo)
        seeded_work_orders.append(wo)

    await db.commit()

    # 5. Seed Sales — with items
    sales_data = [
        {"seller_id": tech1_id, "customer_name": "Cliente Mostrador", "items": [{"sku": "ACC-SCR-IP14", "qty": 3}, {"sku": "ACC-CHG-20W", "qty": 2}, {"sku": "ACC-CBL-ANK", "qty": 1}]},
        {"seller_id": admin_id, "customer_name": "Cliente Online", "items": [{"sku": "MEM-SSD-1TB", "qty": 1}, {"sku": "MEM-MSD-128", "qty": 2}, {"sku": "ACC-CSE-RUG", "qty": 1}]},
        {"seller_id": tech2_id, "customer_name": "Cliente VIP", "items": [{"sku": "PART-IP13-SCR", "qty": 1}, {"sku": "ACC-CSE-RUG", "qty": 2}, {"sku": "ACC-SCR-IP14", "qty": 2}]},
        {"seller_id": admin_id, "customer_name": "Gamer Zone", "items": [{"sku": "GAM-PS5-DRI", "qty": 2}, {"sku": "GAM-JOY-ANL", "qty": 1}, {"sku": "MEM-MSD-128", "qty": 1}, {"sku": "ACC-CHG-20W", "qty": 3}]},
    ]

    for i, sale_data in enumerate(sales_data):
        sale_items = []
        subtotal = 0.0
        for item in sale_data["items"]:
            product_id = seeded_products[item["sku"]]
            result = await db.execute(select(Product).filter(Product.id == product_id))
            product = result.scalars().first()
            unit_price = product.price
            line_subtotal = unit_price * item["qty"]
            subtotal += line_subtotal
            sale_items.append({
                "product_id": product_id,
                "quantity": item["qty"],
                "unit_price": unit_price,
                "subtotal": line_subtotal
            })

        discount = round(subtotal * 0.05, 2)
        total = subtotal - discount
        created = today_start - timedelta(hours=2) + timedelta(hours=i)

        result = await db.execute(
            select(Sale).filter(
                Sale.customer_name == sale_data["customer_name"],
                Sale.seller_id == sale_data["seller_id"],
                Sale.total == total
            )
        )
        if result.scalars().first():
            continue

        sale = Sale(
            seller_id=sale_data["seller_id"],
            customer_name=sale_data["customer_name"],
            subtotal=subtotal,
            discount=discount,
            total=total,
            payment_method="CASH",
            created_at=created
        )
        db.add(sale)
        await db.commit()
        await db.refresh(sale)

        for si_data in sale_items:
            si = SaleItem(
                sale_id=sale.id,
                product_id=si_data["product_id"],
                quantity=si_data["quantity"],
                unit_price=si_data["unit_price"],
                subtotal=si_data["subtotal"]
            )
            db.add(si)

    await db.commit()

def randfloat(min_v, max_v):
    return round(random.uniform(min_v, max_v), 2)
