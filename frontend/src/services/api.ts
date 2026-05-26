import { useAuthStore } from '../stores/authStore';
import type {
  PaginatedResponse, Category, Product, WorkOrder,
  Sale, DashboardMetrics, WeeklySnapshot, HistoryItem, EmployeeProfile
} from '../types';

export function getApiBaseUrl(): string {
  // Use env var, or relative path (Vite dev server proxies /api to backend)
  return import.meta.env.VITE_API_URL || '/api';
}
const BASE_URL = getApiBaseUrl();

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed (${response.status})`);
  }
  if (response.status === 204) return {} as T;
  return response.json();
}

export const api = {
  // Auth / Employees
  getProfile: () => apiFetch<EmployeeProfile>('/employees/me'),
  getEmployees: (activeOnly = false) =>
    apiFetch<EmployeeProfile[]>(`/employees/?active_only=${activeOnly}`),
  approveEmployee: (id: number) =>
    apiFetch<EmployeeProfile>(`/employees/${id}/approve`, { method: 'PUT' }),
  updateEmployee: (id: number, data: any) =>
    apiFetch<EmployeeProfile>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Categories
  getCategories: () => apiFetch<Category[]>('/categories/'),
  createCategory: (data: { name: string; description?: string }) =>
    apiFetch<Category>('/categories/', { method: 'POST', body: JSON.stringify(data) }),

  // Products
  getProducts: (search = '', categoryId?: number, page = 1, limit = 20) => {
    const params = new URLSearchParams({ search, page: String(page), limit: String(limit) });
    if (categoryId) params.set('category_id', String(categoryId));
    return apiFetch<PaginatedResponse<Product>>(`/products/?${params}`);
  },
  getProduct: (id: number) => apiFetch<Product>(`/products/${id}`),
  getLowStockCount: () => apiFetch<{ count: number }>('/products/low-stock-count/'),
  createProduct: (data: Partial<Product>) =>
    apiFetch<Product>('/products/', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number, data: Partial<Product>) =>
    apiFetch<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: number) =>
    apiFetch<void>(`/products/${id}`, { method: 'DELETE' }),

  // Work Orders
  getWorkOrders: (search = '', status = '', assignedId?: number, page = 1, limit = 20) => {
    const params = new URLSearchParams({ search, status, page: String(page), limit: String(limit) });
    if (assignedId) params.set('assigned_id', String(assignedId));
    return apiFetch<PaginatedResponse<WorkOrder>>(`/work-orders/?${params}`);
  },
  getWorkOrder: (id: number) => apiFetch<WorkOrder>(`/work-orders/${id}`),
  createWorkOrder: (data: any) =>
    apiFetch<WorkOrder>('/work-orders/', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkOrder: (id: number, data: any) =>
    apiFetch<WorkOrder>(`/work-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  transferWorkOrder: (id: number, data: { to_employee_id: number; reason?: string }) =>
    apiFetch<WorkOrder>(`/work-orders/${id}/transfer`, { method: 'POST', body: JSON.stringify(data) }),

  // Sales
  getSales: (search = '', page = 1, limit = 20) => {
    const params = new URLSearchParams({ search, page: String(page), limit: String(limit) });
    return apiFetch<PaginatedResponse<Sale>>(`/sales/?${params}`);
  },
  getSale: (id: number) => apiFetch<Sale>(`/sales/${id}`),
  createSale: (data: any) =>
    apiFetch<Sale>('/sales/', { method: 'POST', body: JSON.stringify(data) }),
  getReceiptPdfUrl: (saleId: number) => {
    const token = useAuthStore.getState().token;
    return `${BASE_URL}/sales/${saleId}/pdf?token=${encodeURIComponent(token || '')}`;
  },
  getWorkOrderPdfUrl: (woId: number) => {
    const token = useAuthStore.getState().token;
    return `${BASE_URL}/work-orders/${woId}/pdf?token=${encodeURIComponent(token || '')}`;
  },

  // WhatsApp share
  sharePdfOnWhatsApp: (pdfUrl: string, label: string) => {
    const absoluteUrl = pdfUrl.startsWith('http') ? pdfUrl : `${window.location.origin}${pdfUrl}`;
    const text = encodeURIComponent(`${label}\n${absoluteUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  },

  // Dashboard
  getDashboardMetrics: (technicianId?: number) => {
    const params = technicianId ? `?technician_id=${technicianId}` : '';
    return apiFetch<DashboardMetrics>(`/dashboard/${params}`);
  },
  resetTestData: () =>
    apiFetch<{ message: string }>('/dashboard/reset-test-data', { method: 'POST' }),
  getSnapshots: () =>
    apiFetch<WeeklySnapshot[]>('/dashboard/snapshots'),
  triggerWeeklyReset: () =>
    apiFetch<WeeklySnapshot[]>('/dashboard/weekly-reset', { method: 'POST' }),

  // History
  getHistory: (search = '', typeFilter = '', page = 1, limit = 20) => {
    const params = new URLSearchParams({ search, type_filter: typeFilter, page: String(page), limit: String(limit) });
    return apiFetch<PaginatedResponse<HistoryItem>>(`/history/?${params}`);
  },
};


