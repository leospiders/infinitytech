from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, func, update
from sqlalchemy.orm import selectinload
from app.models.models import Employee, Category, Product, WorkOrder, WorkOrderAssignment, Sale, SaleItem, WeeklySnapshot
from app.schemas.schemas import EmployeeCreate, EmployeeUpdate, CategoryCreate, ProductCreate, ProductUpdate, WorkOrderCreate, WorkOrderUpdate, SaleCreate
from datetime import datetime, timezone
import uuid

class EmployeeRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, employee_id: int) -> Employee:
        result = await self.db.execute(select(Employee).filter(Employee.id == employee_id))
        return result.scalars().first()

    async def get_by_uuid(self, employee_uuid: str) -> Employee:
        result = await self.db.execute(select(Employee).filter(Employee.uuid == employee_uuid))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Employee:
        result = await self.db.execute(select(Employee).filter(Employee.email == email))
        return result.scalars().first()

    async def get_all(self, active_only: bool = False) -> list[Employee]:
        query = select(Employee)
        if active_only:
            query = query.filter(Employee.is_active == True)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, obj_in: EmployeeCreate) -> Employee:
        db_obj = Employee(
            email=obj_in.email,
            name=obj_in.name,
            role=obj_in.role,
            phone=obj_in.phone,
            is_active=obj_in.is_active
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, db_obj: Employee, obj_in: EmployeeUpdate) -> Employee:
        update_data = obj_in.dict(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

class CategoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, category_id: int) -> Category:
        result = await self.db.execute(select(Category).filter(Category.id == category_id))
        return result.scalars().first()

    async def get_by_name(self, name: str) -> Category:
        result = await self.db.execute(select(Category).filter(Category.name == name))
        return result.scalars().first()

    async def get_all(self) -> list[Category]:
        result = await self.db.execute(select(Category))
        return list(result.scalars().all())

    async def create(self, obj_in: CategoryCreate) -> Category:
        db_obj = Category(
            name=obj_in.name,
            description=obj_in.description
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

class ProductRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, product_id: int) -> Product:
        query = select(Product).options(selectinload(Product.category)).filter(Product.id == product_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_by_uuid(self, product_uuid: str) -> Product:
        query = select(Product).filter(Product.uuid == product_uuid)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_by_sku(self, sku: str) -> Product:
        result = await self.db.execute(select(Product).filter(Product.sku == sku))
        return result.scalars().first()

    async def get_all_paginated(
        self, search: str = "", category_id: int = None, page: int = 1, limit: int = 20
    ) -> tuple[list[Product], int]:
        query = select(Product).options(selectinload(Product.category))
        filters = []
        if search:
            filters.append(or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%")
            ))
        if category_id:
            filters.append(Product.category_id == category_id)
            
        if filters:
            query = query.filter(and_(*filters))
            
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()
        
        # Paginate
        query = query.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def create(self, obj_in: ProductCreate) -> Product:
        db_obj = Product(
            name=obj_in.name,
            sku=obj_in.sku,
            category_id=obj_in.category_id,
            price=obj_in.price,
            cost=obj_in.cost,
            stock=obj_in.stock,
            low_stock_limit=obj_in.low_stock_limit
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return await self.get_by_id(db_obj.id)

    async def update(self, db_obj: Product, obj_in: ProductUpdate) -> Product:
        update_data = obj_in.dict(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return await self.get_by_id(db_obj.id)

    async def delete(self, db_obj: Product) -> bool:
        await self.db.delete(db_obj)
        await self.db.commit()
        return True

class WorkOrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, work_order_id: int) -> WorkOrder:
        query = select(WorkOrder).options(
            selectinload(WorkOrder.assigned_technician),
            selectinload(WorkOrder.created_by),
            selectinload(WorkOrder.assignments).selectinload(WorkOrderAssignment.from_employee),
            selectinload(WorkOrder.assignments).selectinload(WorkOrderAssignment.to_employee),
        ).filter(WorkOrder.id == work_order_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_by_uuid(self, work_order_uuid: str) -> WorkOrder:
        query = select(WorkOrder).filter(WorkOrder.uuid == work_order_uuid)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_all_paginated(
        self, search: str = "", status: str = "", assigned_id: int = None, page: int = 1, limit: int = 20
    ) -> tuple[list[WorkOrder], int]:
        query = select(WorkOrder).options(
            selectinload(WorkOrder.assigned_technician),
            selectinload(WorkOrder.created_by),
            selectinload(WorkOrder.assignments).selectinload(WorkOrderAssignment.from_employee),
            selectinload(WorkOrder.assignments).selectinload(WorkOrderAssignment.to_employee),
        )
        filters = []
        if search:
            filters.append(or_(
                WorkOrder.customer_name.ilike(f"%{search}%"),
                WorkOrder.phone_number.ilike(f"%{search}%"),
                WorkOrder.model.ilike(f"%{search}%"),
                WorkOrder.brand.ilike(f"%{search}%"),
                WorkOrder.imei.ilike(f"%{search}%")
            ))
        if status:
            filters.append(WorkOrder.status == status)
        if assigned_id:
            filters.append(WorkOrder.assigned_technician_id == assigned_id)
            
        if filters:
            query = query.filter(and_(*filters))
            
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()
        
        query = query.order_by(WorkOrder.created_at.desc()).offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def create(self, obj_in: WorkOrderCreate, creator_id: int) -> WorkOrder:
        payment_status = "PENDING"
        if obj_in.amount_paid >= obj_in.total_cost:
            payment_status = "PAID"
        elif obj_in.amount_paid > 0:
            payment_status = "PARTIAL"
            
        db_obj = WorkOrder(
            status="RECEIVED",
            customer_name=obj_in.customer_name,
            phone_number=obj_in.phone_number,
            imei=obj_in.imei,
            brand=obj_in.brand,
            model=obj_in.model,
            desperfecto=obj_in.desperfecto,
            diagnostico=obj_in.diagnostico,
            motivo=obj_in.motivo,
            total_cost=obj_in.total_cost,
            amount_paid=obj_in.amount_paid,
            payment_method=obj_in.payment_method,
            payment_status=payment_status,
            warranty_info=obj_in.warranty_info,
            security_type=obj_in.security_type if obj_in.security_type else None,
            security_value=obj_in.security_value if obj_in.security_value else None,
            assigned_technician_id=obj_in.assigned_technician_id,
            created_by_id=creator_id
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        
        # Log initial assignment if any
        if obj_in.assigned_technician_id:
            assignment = WorkOrderAssignment(
                work_order_id=db_obj.id,
                from_employee_id=None,
                to_employee_id=obj_in.assigned_technician_id,
                reason="Initial assignment upon entry"
            )
            self.db.add(assignment)
            await self.db.commit()
            
        # Re-fetch with eager loaded relationships
        return await self.get_by_id(db_obj.id)

    async def update(self, db_obj: WorkOrder, obj_in: WorkOrderUpdate, updater_id: int) -> WorkOrder:
        update_data = obj_in.dict(exclude_unset=True)
        
        prev_tech = db_obj.assigned_technician_id
        new_tech = update_data.get("assigned_technician_id", prev_tech)
        
        # Auto-set amount_paid = total_cost when delivering without explicit amount
        if update_data.get("status") == "DELIVERED" and "amount_paid" not in update_data:
            update_data["amount_paid"] = db_obj.total_cost
        
        for field in update_data:
            setattr(db_obj, field, update_data[field])
            
        if "total_cost" in update_data or "amount_paid" in update_data:
            if db_obj.amount_paid >= db_obj.total_cost:
                db_obj.payment_status = "PAID"
            elif db_obj.amount_paid > 0:
                db_obj.payment_status = "PARTIAL"
            else:
                db_obj.payment_status = "PENDING"
                
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        
        if prev_tech != new_tech and new_tech is not None:
            assignment = WorkOrderAssignment(
                work_order_id=db_obj.id,
                from_employee_id=prev_tech,
                to_employee_id=new_tech,
                reason="Repair queue assignment update"
            )
            self.db.add(assignment)
            await self.db.commit()
            
        return await self.get_by_id(db_obj.id)

    async def transfer(self, db_obj: WorkOrder, to_tech_id: int, reason: str, actor_id: int) -> WorkOrder:
        prev_tech = db_obj.assigned_technician_id
        db_obj.assigned_technician_id = to_tech_id
        
        assignment = WorkOrderAssignment(
            work_order_id=db_obj.id,
            from_employee_id=prev_tech,
            to_employee_id=to_tech_id,
            reason=reason
        )
        
        self.db.add(db_obj)
        self.db.add(assignment)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return await self.get_by_id(db_obj.id)

class SaleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, sale_id: int) -> Sale:
        query = select(Sale).options(
            selectinload(Sale.seller),
            selectinload(Sale.items).selectinload(SaleItem.product).selectinload(Product.category),
        ).filter(Sale.id == sale_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_by_uuid(self, sale_uuid: str) -> Sale:
        result = await self.db.execute(select(Sale).filter(Sale.uuid == sale_uuid))
        return result.scalars().first()

    async def get_all_paginated(self, search: str = "", page: int = 1, limit: int = 20) -> tuple[list[Sale], int]:
        query = select(Sale).options(
            selectinload(Sale.seller),
            selectinload(Sale.items).selectinload(SaleItem.product).selectinload(Product.category),
        )
        filters = []
        if search:
            filters.append(or_(
                Sale.customer_name.ilike(f"%{search}%"),
                Sale.customer_phone.ilike(f"%{search}%")
            ))
        if filters:
            query = query.filter(and_(*filters))
            
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()
        
        query = query.order_by(Sale.created_at.desc()).offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def create(self, obj_in: SaleCreate, seller_id: int) -> Sale:
        # Calculate subtotal & total
        subtotal = 0.0
        sale_items = []
        
        # Begin nested-like manual operations in session transaction
        for item in obj_in.items:
            if item.product_id:
                product_res = await self.db.execute(select(Product).filter(Product.id == item.product_id))
                product = product_res.scalars().first()
                if not product:
                    raise ValueError(f"Product ID {item.product_id} does not exist.")
                # Deduct stock
                product.stock -= item.quantity
                self.db.add(product)
            else:
                product = None
            
            item_subtotal = item.unit_price * item.quantity
            subtotal += item_subtotal
            
            sale_items.append(SaleItem(
                product_id=product.id if product else None,
                custom_name=item.custom_name if not product else None,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=item_subtotal
            ))
            
        total = max(0.0, subtotal - obj_in.discount)
        
        db_obj = Sale(
            seller_id=seller_id,
            customer_name=obj_in.customer_name,
            customer_phone=obj_in.customer_phone,
            subtotal=subtotal,
            discount=obj_in.discount,
            total=total,
            payment_method=obj_in.payment_method,
            warranty_info=obj_in.warranty_info,
            items=sale_items
        )
        
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return await self.get_by_id(db_obj.id)
