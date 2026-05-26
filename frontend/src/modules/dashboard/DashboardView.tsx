import { useState } from 'react';
import { useDashboardMetrics, useSnapshots, useWeeklyReset, useEmployees } from '../../hooks/useApiQueries';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { CardSkeleton, TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../../utils/formatDate';

export function DashboardView() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';
  const isTech = user?.role === 'TECHNICIAN';
  const queryClient = useQueryClient();

  // Admin: optional technician filter
  const [techFilter, setTechFilter] = useState<number | undefined>(undefined);
  const { data: employees } = useEmployees(true);

  // Tech-filtered dashboard: admin passes techFilter, tech sees own data
  const { data: metrics, isLoading, refetch } = useDashboardMetrics(
    isAdmin ? techFilter : undefined
  );

  const { data: snapshots } = useSnapshots();
  const resetMutation = useWeeklyReset();

  const handleReset = async () => {
    if (!window.confirm('Capture weekly snapshot? This will not delete history.')) return;
    try { await resetMutation.mutateAsync(); } catch {}
  };

  const handleResetTestData = async () => {
    if (!window.confirm('Delete ALL sales and work orders? This is irreversible — only for testing.')) return;
    try {
      await api.resetTestData();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand/10 pb-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-deep">
              {isAdmin ? 'Business Dashboard' : 'My Dashboard'}
            </h1>
            <p className="text-xs text-muted dark:text-dim">
              Welcome back, {user?.name} — {isTech ? 'Here are your stats.' : 'Today\'s overview.'}
            </p>
          </div>
          {/* Admin tech filter */}
          {isAdmin && (
            <select
              value={techFilter ?? ''}
              onChange={e => setTechFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="neo-input text-xs w-48"
            >
              <option value="">All Technicians</option>
              {employees?.filter(e => e.role === 'TECHNICIAN').map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="neo-btn py-2 px-4 text-xs font-semibold">
            <RefreshCw className="h-3 w-3 mr-2 animate-pulse" /> Refresh
          </button>
          {/* Dev-only: reset test data */}
          <button onClick={handleResetTestData} className="neo-btn py-2 px-3 text-xs font-semibold text-danger border-red-500/30">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="neo-card p-6 flex flex-col gap-2 border-l-4 border-success">
          <span className="text-xs font-semibold text-muted dark:text-dim">
            {isTech ? 'My Revenue Today' : 'Combined Revenue Today'}
          </span>
          <span className="text-2xl font-bold ">${metrics?.revenue_today.toFixed(2)}</span>
        </div>
        <div className="neo-card p-6 flex flex-col gap-2">
          <span className="text-xs font-semibold text-muted dark:text-dim">
            {isTech ? 'My Repairs Delivered' : 'Completed Repairs Today'}
          </span>
          <span className="text-2xl font-bold text-brand">${metrics?.repairs_revenue_today.toFixed(2)}</span>
          <span className="text-xs text-muted dark:text-dim">{metrics?.repairs_today} repairs</span>
        </div>
        <div className="neo-card p-4 lg:p-6 flex flex-col gap-2">
          <span className="text-xs font-semibold text-muted dark:text-dim">
            {isTech ? 'My Sales Today' : 'Sales Revenue Today'}
          </span>
          <span className="text-2xl font-bold text-success">${metrics?.sales_today.toFixed(2)}</span>
          <span className="text-xs text-muted dark:text-dim">{metrics?.sales_items_count ?? 0} items sold</span>
        </div>
      </div>

      {/* Employee Performance + Top Sold Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Employee performance — only for admin */}
        {isAdmin && (
          <div className="neo-card p-6 flex flex-col gap-4 lg:col-span-2">
            <div className="flex justify-between items-center border-b pb-2 border-brand/10 dark:border-brand/20">
              <h3 className="font-bold text-sm ">Employee Performance (Current Week)</h3>
              {(user?.role === 'SUPERADMIN' || user?.role === 'ADMIN') && (
                <button onClick={handleReset} disabled={resetMutation.isPending} className="neo-btn py-1 px-3 text-[10px] font-semibold text-danger border-red-500/20">
                  {resetMutation.isPending ? 'Saving...' : 'Weekly Snap'}
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#D2D6DC] dark:border-[#1F1E2E] text-muted">
                    <th className="py-2">Employee</th>
                    <th className="py-2">Role</th>
                    <th className="py-2 text-right">Weekly Sales</th>
                    <th className="py-2 text-right">Repairs Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.employee_activity.map((emp, i) => (
                    <tr key={i} className="border-b border-[#E5E7EB] dark:border-black/5 hover:bg-black/5">
                      <td className="py-3 font-semibold">{emp.name}</td>
                      <td className="py-3">{emp.role}</td>
                      <td className="py-3 text-right font-bold text-success">${emp.sales_total.toFixed(2)}</td>
                      <td className="py-3 text-right font-bold text-brand">${emp.repairs_revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!metrics?.employee_activity?.length && (
              <span className="text-xs text-dim text-center py-4">No employee activity recorded yet.</span>
            )}
          </div>
        )}

        {/* Top Sold Products */}
        <div className="neo-card p-6 flex flex-col gap-4 lg:col-span-1">
          <h3 className="font-bold text-sm border-b pb-2 border-brand/10 dark:border-[#1F1E2E]">
            {isTech ? 'My Top Sold Products' : 'Top Sold Products'}
            {techFilter && employees?.find(e => e.id === techFilter)?.name ? ` — ${employees.find(e => e.id === techFilter)!.name}` : ''}
          </h3>
          {metrics?.top_sold_products?.length ? (
            <div className="flex flex-col gap-3">
              {metrics.top_sold_products.map((p, i) => (
                <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-[#F8FAFC]/50 dark:bg-black/10">
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold truncate">{p.name}</span>
                    <span className="text-[10px] text-muted dark:text-dim">{p.sku}</span>
                  </div>
                  <span className="font-bold px-2 py-1 rounded bg-[#EBF0F6] dark:bg-[#1F1E2E] shrink-0">{p.quantity} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-xs text-dim text-center py-8">No sale items recorded yet.</span>
          )}
        </div>
      </div>

      {/* Weekly Snapshots — admin only */}
      {isAdmin && snapshots && snapshots.length > 0 && (
        <div className="neo-card p-6 flex flex-col gap-4">
          <h3 className="font-bold text-sm border-b pb-2 border-brand/10 dark:border-[#1F1E2E]">Weekly Snapshots History</h3>
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#D2D6DC] dark:border-[#1F1E2E] text-muted">
                  <th className="py-2">Week</th>
                  <th className="py-2">Employee</th>
                  <th className="py-2 text-right">Sales</th>
                  <th className="py-2 text-right">Repairs</th>
                  <th className="py-2 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s, i) => (
                  <tr key={i} className="border-b border-[#E5E7EB] dark:border-black/5">
                    <td className="py-2 font-bold">{s.snapshot_week}</td>
                    <td className="py-2">{s.employee.name}</td>
                    <td className="py-2 text-right text-success">${s.total_sales.toFixed(2)}</td>
                    <td className="py-2 text-right text-brand">{s.completed_repairs}</td>
                    <td className="py-2 text-right text-dim">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
