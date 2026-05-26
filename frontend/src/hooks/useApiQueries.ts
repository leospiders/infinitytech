import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useProducts(search = '', categoryId?: number, page = 1) {
  return useQuery({
    queryKey: ['products', search, categoryId, page],
    queryFn: () => api.getProducts(search, categoryId, page),
  });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: api.getCategories });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => api.createCategory(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); },
  });
}

export function useWorkOrders(search = '', status = '', assignedId?: number, page = 1) {
  return useQuery({
    queryKey: ['workOrders', search, status, assignedId, page],
    queryFn: () => api.getWorkOrders(search, status, assignedId, page),
  });
}

export function useSales(search = '', page = 1) {
  return useQuery({
    queryKey: ['sales', search, page],
    queryFn: () => api.getSales(search, page),
  });
}

export function useDashboardMetrics(technicianId?: number) {
  return useQuery({
    queryKey: ['dashboard', technicianId],
    queryFn: () => api.getDashboardMetrics(technicianId),
    refetchInterval: 30_000,
  });
}

export function useSnapshots() {
  return useQuery({
    queryKey: ['snapshots'],
    queryFn: api.getSnapshots,
  });
}

export function useEmployees(activeOnly = false) {
  return useQuery({
    queryKey: ['employees', activeOnly],
    queryFn: () => api.getEmployees(activeOnly),
  });
}

export function useHistory(search = '', typeFilter = '', page = 1) {
  return useQuery({
    queryKey: ['history', search, typeFilter, page],
    queryFn: () => api.getHistory(search, typeFilter, page),
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

export function useWeeklyReset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.triggerWeeklyReset,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['snapshots'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}
