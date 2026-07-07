import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), default=generate_uuid, unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(String(20), default="PENDING", nullable=False)
    approved_by = Column(String(36), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejected_by = Column(String(36), nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String(500), nullable=True)
    last_login = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), default=generate_uuid, unique=True, index=True, nullable=False)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    is_repuesto = Column(Boolean, default=False, nullable=False)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), default=generate_uuid, unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    price = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    stock = Column(Integer, default=0, nullable=False)
    low_stock_limit = Column(Integer, default=5, nullable=False)
    product_type = Column(String(20), default="physical", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    category = relationship("Category", back_populates="products")

    __table_args__ = (
        Index("idx_product_category", category_id),
    )

class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), default=generate_uuid, unique=True, index=True, nullable=False)
    status = Column(String(50), default="progreso", nullable=False)
    customer_name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=False)
    imei = Column(String(50), nullable=True)
    brand = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    desperfecto = Column(String(500), nullable=False)
    diagnostico = Column(String(500), nullable=True)
    motivo = Column(String(500), nullable=True)
    total_cost = Column(Float, default=0.0, nullable=False)
    amount_paid = Column(Float, default=0.0, nullable=False)
    payment_method = Column(String(50), nullable=True)
    payment_status = Column(String(50), default="PENDING", nullable=False)
    warranty_info = Column(String(255), nullable=True)
    security_type = Column(String(20), nullable=True)
    security_value = Column(String(255), nullable=True)

    assigned_technician_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    assigned_technician = relationship("Employee", foreign_keys=[assigned_technician_id])
    created_by = relationship("Employee", foreign_keys=[created_by_id])
    items = relationship("WorkOrderItem", back_populates="work_order", cascade="all, delete-orphan")
    assignments = relationship("WorkOrderAssignment", back_populates="work_order", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_wo_customer_name", customer_name),
        Index("idx_wo_phone", phone_number),
        Index("idx_wo_imei", imei),
        Index("idx_wo_brand_model", brand, model),
        Index("idx_wo_status", status),
        Index("idx_wo_assigned_tech", assigned_technician_id),
        Index("idx_wo_created_at", created_at.desc()),
    )

    @property
    def balance(self) -> float:
        return self.total_cost - self.amount_paid

class WorkOrderItem(Base):
    __tablename__ = "work_order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    brand = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    imei = Column(String(50), nullable=True)
    desperfecto = Column(String(500), nullable=False)
    diagnostico = Column(String(500), nullable=True)
    motivo = Column(String(500), nullable=True)
    total_cost = Column(Float, default=0.0, nullable=False)
    security_type = Column(String(20), nullable=True)
    security_value = Column(String(255), nullable=True)

    work_order = relationship("WorkOrder", back_populates="items")


class WorkOrderAssignment(Base):
    __tablename__ = "work_order_assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), default=generate_uuid, unique=True, index=True, nullable=False)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    from_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    to_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    reason = Column(String(255), nullable=True)
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    work_order = relationship("WorkOrder", back_populates="assignments")
    from_employee = relationship("Employee", foreign_keys=[from_employee_id])
    to_employee = relationship("Employee", foreign_keys=[to_employee_id])

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), default=generate_uuid, unique=True, index=True, nullable=False)
    seller_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    customer_name = Column(String(255), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
    total = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False)
    warranty_info = Column(String(255), nullable=True)
    pdf_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    seller = relationship("Employee")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_sale_customer", customer_name),
        Index("idx_sale_seller", seller_id),
        Index("idx_sale_created", created_at.desc()),
    )

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), default=generate_uuid, unique=True, index=True, nullable=False)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    custom_name = Column(String(255), nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")

    __table_args__ = (
        Index("idx_sale_item_product", product_id),
    )

class WeeklySnapshot(Base):
    __tablename__ = "weekly_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), default=generate_uuid, unique=True, index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    snapshot_week = Column(String(10), nullable=False)
    total_sales = Column(Float, default=0.0, nullable=False)
    completed_repairs = Column(Integer, default=0, nullable=False)
    is_definitive = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    employee = relationship("Employee")

    __table_args__ = (
        Index("idx_snapshot_week", snapshot_week),
        Index("idx_snapshot_employee", employee_id),
    )
