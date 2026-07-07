from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional, List

# --- Employee Schemas ---
class EmployeeBase(BaseModel):
    email: EmailStr
    name: str
    role: str  # "ADMIN", "TECH_IT", "TECH_COM"
    phone: Optional[str] = None
    is_active: bool = True

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class EmployeeInDB(EmployeeBase):
    id: int
    uuid: str
    status: str = "PENDING"
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejected_by: Optional[str] = None
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApproveRequest(BaseModel):
    role: str


class RejectRequest(BaseModel):
    reason: Optional[str] = None

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_repuesto: bool = False

class CategoryCreate(CategoryBase):
    pass

class CategoryInDB(CategoryBase):
    id: int
    uuid: str
    is_repuesto: bool = False

    class Config:
        from_attributes = True

# --- Repuesto Stock (visible to TECH_COM, no prices) ---
class RepuestoStockOut(BaseModel):
    id: int
    uuid: str
    name: str
    sku: str
    stock: int
    low_stock_limit: int
    category: Optional[CategoryInDB] = None

    class Config:
        from_attributes = True

# --- Public products (visible to anyone, no auth) ---
class PublicProductOut(BaseModel):
    id: int
    name: str
    price: float
    product_type: str = "physical"
    category: Optional[CategoryInDB] = None

    class Config:
        from_attributes = True

class PublicCategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    product_count: int = 0


class PublicInventoryResult(BaseModel):
    id: int
    name: str
    price: float
    product_type: str = "physical"
    category_name: Optional[str] = None
    category_id: int
    is_repuesto: bool = False
    stock: int = 0
    in_stock: bool = False

    class Config:
        from_attributes = True


# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    sku: str
    category_id: int
    price: float
    cost: float
    stock: int = 0
    low_stock_limit: int = 5
    product_type: str = "physical"

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    stock: Optional[int] = None
    low_stock_limit: Optional[int] = None
    product_type: Optional[str] = None

class ProductInDB(ProductBase):
    id: int
    uuid: str
    created_at: datetime
    category: Optional[CategoryInDB] = None

    class Config:
        from_attributes = True

# --- Work Order Schemas ---
class WorkOrderItemBase(BaseModel):
    brand: str
    model: str
    imei: Optional[str] = None
    desperfecto: str
    diagnostico: Optional[str] = None
    motivo: Optional[str] = None
    total_cost: float = 0.0
    security_type: Optional[str] = None
    security_value: Optional[str] = None

class WorkOrderItemCreate(WorkOrderItemBase):
    pass

class WorkOrderItemInDB(WorkOrderItemBase):
    id: int
    work_order_id: int

    class Config:
        from_attributes = True

class WorkOrderBase(BaseModel):
    customer_name: str
    phone_number: str
    imei: Optional[str] = None
    brand: str = ""
    model: str = ""
    desperfecto: str = ""
    diagnostico: Optional[str] = None
    motivo: Optional[str] = None
    total_cost: float = 0.0
    amount_paid: float = 0.0
    payment_method: Optional[str] = None
    warranty_info: Optional[str] = None
    security_type: Optional[str] = None
    security_value: Optional[str] = None

class WorkOrderCreate(WorkOrderBase):
    assigned_technician_id: Optional[int] = None
    items: Optional[list[WorkOrderItemCreate]] = None

class WorkOrderUpdate(BaseModel):
    status: Optional[str] = None  # RECEIVED, IN_REVIEW, WAITING_PARTS, IN_PROGRESS, READY, DELIVERED, CANCELLED
    customer_name: Optional[str] = None
    phone_number: Optional[str] = None
    imei: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    desperfecto: Optional[str] = None
    diagnostico: Optional[str] = None
    motivo: Optional[str] = None
    total_cost: Optional[float] = None
    amount_paid: Optional[float] = None
    payment_method: Optional[str] = None
    warranty_info: Optional[str] = None
    security_type: Optional[str] = None
    security_value: Optional[str] = None
    assigned_technician_id: Optional[int] = None

class WorkOrderAssignmentBase(BaseModel):
    to_employee_id: int
    reason: Optional[str] = None

class WorkOrderAssignmentCreate(WorkOrderAssignmentBase):
    pass

class WorkOrderAssignmentInDB(WorkOrderAssignmentBase):
    id: int
    uuid: str
    work_order_id: int
    from_employee_id: Optional[int] = None
    assigned_at: datetime
    from_employee: Optional[EmployeeInDB] = None
    to_employee: Optional[EmployeeInDB] = None

    class Config:
        from_attributes = True

class WorkOrderInDB(WorkOrderBase):
    id: int
    uuid: str
    status: str
    balance: float
    payment_status: str
    assigned_technician_id: Optional[int] = None
    created_by_id: int
    created_at: datetime
    items: list[WorkOrderItemInDB] = []
    updated_at: datetime
    assigned_technician: Optional[EmployeeInDB] = None
    created_by: Optional[EmployeeInDB] = None
    assignments: List[WorkOrderAssignmentInDB] = []

    class Config:
        from_attributes = True

# --- Sale Schemas ---
class SaleItemBase(BaseModel):
    product_id: Optional[int] = None
    custom_name: Optional[str] = None
    quantity: int
    unit_price: float

class SaleItemCreate(SaleItemBase):
    pass

class SaleItemInDB(SaleItemBase):
    id: int
    uuid: str
    sale_id: int
    subtotal: float
    product: Optional[ProductInDB] = None

    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    discount: float = 0.0
    payment_method: str
    warranty_info: Optional[str] = None
    items: List[SaleItemCreate]

class SaleInDB(BaseModel):
    id: int
    uuid: str
    seller_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    subtotal: float
    discount: float
    total: float
    payment_method: str
    warranty_info: Optional[str] = None
    pdf_path: Optional[str] = None
    created_at: datetime
    seller: Optional[EmployeeInDB] = None
    items: List[SaleItemInDB] = []

    class Config:
        from_attributes = True

# --- Dashboard & Weekly Snapshot Schemas ---
class WeeklySnapshotInDB(BaseModel):
    id: int
    uuid: str
    employee_id: int
    snapshot_week: str
    total_sales: float
    completed_repairs: int
    is_definitive: bool = False
    created_at: datetime
    employee: EmployeeInDB

    class Config:
        from_attributes = True

class DashboardMetrics(BaseModel):
    sales_today: float
    sales_items_count: int = 0
    repairs_today: int
    repairs_revenue_today: float = 0.0
    revenue_today: float
    low_stock_products_count: int
    sales_this_week: float = 0.0  # sales from last report (or Monday) to now
    last_report_date: Optional[str] = None  # ISO datetime of most recent snapshot
    top_sold_products: List[dict]  # product details + sold quantity
    employee_activity: List[dict]  # employee names + sales totals + repair counts

class PeriodicReportOut(BaseModel):
    """A single report response (partial or definitive)."""
    period_start: str
    period_end: str
    is_definitive: bool = False
    total_sales: float
    total_repairs: int
    employees: List[WeeklySnapshotInDB]

class ReportPeriodOut(BaseModel):
    """Summary for a period — used in the select dropdown."""
    label: str
    is_definitive: bool = False
    generated_at: str
    total_sales: float
    total_repairs: int
    employee_count: int
