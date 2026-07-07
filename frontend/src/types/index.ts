export type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'DELETED';

export interface EmployeeProfile {
  id: number;
  uuid: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TECH_IT' | 'TECH_COM' | 'PENDING';
  phone?: string;
  is_active: boolean;
  status: UserStatus;
  rejection_reason?: string;
  created_at: string;
}

export interface RepuestoStockItem {
  id: number;
  uuid: string;
  name: string;
  sku: string;
  stock: number;
  low_stock_limit: number;
  category?: Category;
}

export interface PublicProduct {
  id: number;
  name: string;
  price: number;
  product_type: string;
  stock?: number;
  description?: string;
  category?: Category;
}

export interface PublicInventoryResult {
  id: number;
  name: string;
  price: number;
  product_type: string;
  category_name: string | null;
  category_id: number;
  is_repuesto: boolean;
  stock: number;
  in_stock: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Category {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  is_repuesto?: boolean;
}

export interface Product {
  id: number;
  uuid: string;
  name: string;
  sku: string;
  category_id: number;
  price: number;
  cost: number;
  stock: number;
  low_stock_limit: number;
  created_at: string;
  category?: Category;
}

export interface WorkOrderAssignment {
  id: number;
  uuid: string;
  work_order_id: number;
  from_employee_id?: number;
  to_employee_id: number;
  reason?: string;
  assigned_at: string;
  from_employee?: { name: string; email: string };
  to_employee: { name: string; email: string };
}

export type WorkOrderStatus = 'progreso' | 'listo' | 'entregado';

export interface WorkOrderItem {
  id: number;
  work_order_id: number;
  brand: string;
  model: string;
  imei?: string;
  desperfecto: string;
  diagnostico?: string;
  motivo?: string;
  total_cost: number;
  security_type?: string;
  security_value?: string;
}

export interface WorkOrder {
  id: number;
  uuid: string;
  status: WorkOrderStatus;
  customer_name: string;
  phone_number: string;
  imei?: string;
  brand: string;
  model: string;
  desperfecto: string;
  diagnostico?: string;
  motivo?: string;
  total_cost: number;
  amount_paid: number;
  balance: number;
  payment_method?: string;
  payment_status: 'PENDING' | 'PAID' | 'PARTIAL';
  warranty_info?: string;
  security_type?: string;
  security_value?: string;
  assigned_technician_id?: number;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  assigned_technician?: { id: number; name: string; role: string };
  created_by: { id: number; name: string; role: string };
  assignments: WorkOrderAssignment[];
  items: WorkOrderItem[];
}

export interface SaleItem {
  id: number;
  uuid: string;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

export interface Sale {
  id: number;
  uuid: string;
  seller_id: number;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  warranty_info?: string;
  pdf_path?: string;
  created_at: string;
  seller: { name: string; role: string };
  items: SaleItem[];
}

export interface DashboardMetrics {
  sales_today: number;
  sales_items_count: number;
  repairs_today: number;
  repairs_revenue_today: number;
  revenue_today: number;
  low_stock_products_count: number;
  sales_this_week: number;
  last_report_date: string | null;
  top_sold_products: Array<{ name: string; sku: string; quantity: number }>;
  employee_activity: Array<{
    employee_id: number;
    name: string;
    role: string;
    sales_total: number;
    repairs_revenue: number;
  }>;
}

export interface WeeklySnapshot {
  id: number;
  uuid: string;
  employee_id: number;
  snapshot_week: string;
  total_sales: number;
  completed_repairs: number;
  is_definitive: boolean;
  created_at: string;
  employee: { name: string; role: string };
}

export interface PeriodicReportOut {
  period_start: string;
  period_end: string;
  is_definitive: boolean;
  total_sales: number;
  total_repairs: number;
  employees: WeeklySnapshot[];
}

export interface ReportPeriodOut {
  label: string;
  is_definitive: boolean;
  generated_at: string;
  total_sales: number;
  total_repairs: number;
  employee_count: number;
}

export interface HistoryItem {
  type: 'sale' | 'repair';
  id: number;
  uuid: string;
  customer_name: string;
  created_at: string;
  total: number;
  status: string;
  payment_method: string;
  data: Sale | WorkOrder;
}
