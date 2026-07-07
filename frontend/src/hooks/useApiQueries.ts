import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

// Queries
export function useProducts(search = '', categoryId?: number, page = 1) {
  return useQuery({
    queryKey: ['products', search, categoryId, page],
    queryFn: () => api.getProducts(search, categoryId, page),
    staleTime: 30_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
    staleTime: 300_000,
  });
}

export function useWorkOrders(search = '', status = '', assignedId?: number, page = 1) {
  return useQuery({
    queryKey: ['workOrders', search, status, assignedId, page],
    queryFn: () => api.getWorkOrders(search, status, assignedId, page),
    staleTime: 10_000,
  });
}

export function useSales(search = '', page = 1) {
  return useQuery({
    queryKey: ['sales', search, page],
    queryFn: () => api.getSales(search, page),
    staleTime: 10_000,
  });
}

export function useDashboardMetrics(technicianId?: number) {
  return useQuery({
    queryKey: ['dashboard', technicianId],
    queryFn: () => api.getDashboardMetrics(technicianId),
    refetchInterval: 30_000,
    staleTime: 30_000,
  });
}

export function useSnapshots() {
  return useQuery({
    queryKey: ['snapshots'],
    queryFn: api.getSnapshots,
    staleTime: 300_000,
  });
}

export function useEmployees(activeOnly = false) {
  return useQuery({
    queryKey: ['employees', activeOnly],
    queryFn: () => api.getEmployees(activeOnly),
    staleTime: 60_000,
  });
}

export function usePendingEmployees() {
  return useQuery({
    queryKey: ['pendingEmployees'],
    queryFn: api.getPendingEmployees,
    refetchInterval: 15_000,
    staleTime: 15_000,
  });
}

export function useHistory(search = '', typeFilter = '', page = 1) {
  return useQuery({
    queryKey: ['history', search, typeFilter, page],
    queryFn: () => api.getHistory(search, typeFilter, page),
    staleTime: 10_000,
  });
}

// Mutations
export function useApproveEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.approveEmployee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useApprovePendingEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, role }: { uuid: string; role: string }) => api.approvePendingEmployee(uuid, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingEmployees'] });
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRejectPendingEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, reason }: { uuid: string; reason?: string }) => api.rejectPendingEmployee(uuid, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingEmployees'] });
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateEmployee(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateMyProfile() {
  return useMutation({
    mutationFn: (data: { name?: string; phone?: string }) => api.updateMyProfile(data),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteEmployee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['pendingEmployees'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createSale(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useCreateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createWorkOrder(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workOrders'] }); },
  });
}

export function useUpdateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateWorkOrder(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workOrders'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useTransferWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { to_employee_id: number; reason?: string } }) =>
      api.transferWorkOrder(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workOrders'] }); },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createProduct(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateProduct(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); },
  });
}

export function usePartialReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.triggerPartialReport,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reportPeriods'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useReportPeriods() {
  return useQuery({
    queryKey: ['reportPeriods'],
    queryFn: api.getReportPeriods,
    staleTime: 30_000,
  });
}

export function useReport(period: string | null) {
  return useQuery({
    queryKey: ['report', period],
    queryFn: () => api.getReport(period!),
    enabled: !!period,
    staleTime: 60_000,
  });
}

export function useRepuestoStock(search = '') {
  return useQuery({
    queryKey: ['repuestoStock', search],
    queryFn: () => api.getRepuestoStock(search),
    staleTime: 15_000,
  });
}

export function useMyWorkOrders(search = '', status = '', page = 1) {
  return useQuery({
    queryKey: ['myWorkOrders', search, status, page],
    queryFn: () => api.getMyWorkOrders(search, status, page),
    staleTime: 10_000,
  });
}

export function usePublicProducts(search = '', limit = 50) {
  return useQuery({
    queryKey: ['publicProducts', search, limit],
    queryFn: () => api.getPublicProducts(limit, search),
    staleTime: 60_000,
  });
}

export function usePublicInventorySearch(q: string, limit = 20) {
  return useQuery({
    queryKey: ['publicInventory', q, limit],
    queryFn: () => api.getPublicInventorySearch(q, limit),
    staleTime: 30_000,
    enabled: true,
  });
}

export function usePublicCategories() {
  return useQuery({
    queryKey: ['publicCategories'],
    queryFn: () => api.getPublicCategories(),
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => api.createCategory(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); },
  });
}

