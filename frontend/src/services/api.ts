import { useAuthStore } from '../stores/authStore';
import type {
  PaginatedResponse, Category, Product, WorkOrder,
  Sale, DashboardMetrics, ReportPeriodOut, HistoryItem, EmployeeProfile,
  PublicInventoryResult,
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
  updateMyProfile: (data: { name?: string; phone?: string }) =>
    apiFetch<EmployeeProfile>('/employees/me', { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id: number) =>
    apiFetch<void>(`/employees/${id}`, { method: 'DELETE' }),
  getPendingEmployees: () => apiFetch<any[]>('/employees/pending'),
  approvePendingEmployee: (uuid: string, role: string) =>
    apiFetch<EmployeeProfile>(`/employees/pending/${uuid}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  rejectPendingEmployee: (uuid: string, reason?: string) =>
    apiFetch<void>(`/employees/pending/${uuid}/reject`, {
      method: 'DELETE',
      body: reason ? JSON.stringify({ reason }) : undefined,
    }),

  // Public inventory search (no auth)
  getPublicInventorySearch: (q: string, limit = 20) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (q) params.set('q', q);
    return fetch(`${getApiBaseUrl()}/public/inventory/search?${params}`).then(r => {
      if (!r.ok) throw new Error('Failed to search inventory');
      return r.json() as Promise<PublicInventoryResult[]>;
    });
  },

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
  // PDF — print via auth header (no JWT in URL)
  printPdf: async (type: 'sale' | 'work-order', id: number) => {
    try {
      const token = useAuthStore.getState().token;
      const endpoint = type === 'sale' ? `/sales/${id}/pdf` : `/work-orders/${id}/pdf`;
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load PDF');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';

      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        URL.revokeObjectURL(blobUrl);
        try { if (iframe.parentNode) document.body.removeChild(iframe); } catch {}
      };

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch {}
          // Clean up after giving time for the print dialog
          setTimeout(cleanup, 5000);
        }, 1500);
      };

      document.body.appendChild(iframe);
      iframe.src = blobUrl;
    } catch (e) {
      console.error('Print failed:', e);
    }
  },

  // Share link for WhatsApp (short-lived token, no JWT in URL)
  getSharePdfUrl: async (type: 'sale' | 'work-order', id: number): Promise<string> => {
    const endpoint = type === 'sale'
      ? `/sales/${id}/share-link`
      : `/work-orders/${id}/share-link`;
    const { url } = await apiFetch<{ url: string }>(endpoint);
    // Return absolute URL for WhatsApp sharing
    const base = import.meta.env.VITE_API_URL || window.location.origin + '/api';
    return base.replace('/api', '') + url;
  },

  // WhatsApp share — uses short-lived share link instead of JWT URL
  sharePdfOnWhatsApp: async (type: 'sale' | 'work-order', id: number, label: string) => {
    try {
      const shareUrl = await api.getSharePdfUrl(type, id);
      const text = encodeURIComponent(`${label}\n${shareUrl}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    } catch {
      console.error('Failed to generate share link');
    }
  },

  // Dashboard
  getDashboardMetrics: (technicianId?: number) => {
    const params = technicianId ? `?technician_id=${technicianId}` : '';
    return apiFetch<DashboardMetrics>(`/dashboard/${params}`);
  },
  getReportPeriods: () =>
    apiFetch<ReportPeriodOut[]>('/dashboard/report-periods'),

  // History
  getHistory: (search = '', typeFilter = '', page = 1, limit = 20) => {
    const params = new URLSearchParams({ search, type_filter: typeFilter, page: String(page), limit: String(limit) });
    return apiFetch<PaginatedResponse<HistoryItem>>(`/history/?${params}`);
  },
};

export async function downloadWeeklyReportHtml(period: string) {
  const token = useAuthStore.getState().token;
  const response = await fetch(
    `${BASE_URL}/dashboard/weekly-report/html?period=${encodeURIComponent(period)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error('Failed to download report');
  const html = await response.text();
  const blob = new Blob([html], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `reporte-semanal-${period}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}


