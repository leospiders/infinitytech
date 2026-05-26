import { useState, useEffect, useCallback, useRef } from 'react';
import { useWorkOrders, useEmployees, useCreateWorkOrder, useUpdateWorkOrder, useTransferWorkOrder } from '../../hooks/useApiQueries';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, X, Printer, Lock, Unlock, MessageCircle } from 'lucide-react';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { PatternLock } from '../../components/PatternLock';
import { DeliverToggle } from '../../components/DeliverToggle';
import type { WorkOrder, WorkOrderStatus } from '../../types';

const STATUSES: WorkOrderStatus[] = ['RECEIVED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'];

export function RepairsView({ showToast, createTrigger, onConsumeTrigger }: { showToast?: (type: 'success' | 'error', msg: string) => void; createTrigger?: number; onConsumeTrigger?: () => void }) {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<WorkOrder | null>(null);
  const [lastWorkOrder, setLastWorkOrder] = useState<WorkOrder | null>(null);
  useEffect(() => { if (!lastWorkOrder) return; const t = setTimeout(() => setLastWorkOrder(null), 6000); return () => clearTimeout(t); }, [lastWorkOrder]);

  const debouncedSearch = useDebounce(search, 300);
  const { data: repairsData, isLoading } = useWorkOrders(debouncedSearch, statusFilter, user?.role === 'TECHNICIAN' ? user.id : undefined, page);
  const { data: employees } = useEmployees(true);
  const createOrder = useCreateWorkOrder();
  const updateOrder = useUpdateWorkOrder();
  const transferOrder = useTransferWorkOrder();
  const technicians = employees?.filter(e => e.role === 'TECHNICIAN') || [];

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      setShowCreate(true);
      onConsumeTrigger?.();
    }
  }, [createTrigger]);

  const [form, setForm] = useState({ customer_name: '', phone_number: '', imei: '', brand: '', model: '', desperfecto: '', diagnostico: '', motivo: '', total_cost: 0, amount_paid: 0, payment_method: 'CASH', assigned_technician_id: undefined as number | undefined, warranty_info: '', security_type: '', security_value: '' });
  const [transferTechId, setTransferTechId] = useState<number | undefined>(undefined);
  const [transferReason, setTransferReason] = useState('');
  const [deliverTarget, setDeliverTarget] = useState<WorkOrder | null>(null);
  const [partCost, setPartCost] = useState(0);

  const resetForm = () => setForm({ customer_name: '', phone_number: '', imei: '', brand: '', model: '', desperfecto: '', diagnostico: '', motivo: '', total_cost: 0, amount_paid: 0, payment_method: 'CASH', assigned_technician_id: undefined, warranty_info: '', security_type: '', security_value: '' });
  const securityRef = useRef<HTMLDivElement>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Auto-assign to self if tech and no tech was selected
      const payload = {
        ...form,
        assigned_technician_id: form.assigned_technician_id ?? (user?.role === 'TECHNICIAN' ? user.id : undefined),
      };
      const wo = await createOrder.mutateAsync(payload);
      setLastWorkOrder(wo);
      setShowCreate(false);
      resetForm();
    } catch {}
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try { await updateOrder.mutateAsync({ id, data: { status } }); } catch {}
  };

  const handleDeliverConfirm = async () => {
    if (!deliverTarget) return;
    const amountPaid = Math.max(0, deliverTarget.total_cost - partCost);
    try {
      await updateOrder.mutateAsync({ id: deliverTarget.id, data: { status: 'DELIVERED', amount_paid: amountPaid } });
      setDeliverTarget(null);
      setPartCost(0);
    } catch {}
  };

  const handlePrint = (id: number) => {
    window.open(api.getWorkOrderPdfUrl(id), '_blank');
  };

  const handleTransfer = async () => {
    if (!selectedRepair || !transferTechId) return;
    try {
      await transferOrder.mutateAsync({ id: selectedRepair.id, data: { to_employee_id: transferTechId, reason: transferReason } });
      setShowTransfer(false);
      setSelectedRepair(null);
      setTransferReason('');
    } catch {}
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 pb-4 border-b border-brand/10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight text-brand-deep">Technical Service</h1>
          <button onClick={() => setShowCreate(true)} className="neo-btn py-2.5 px-4 text-xs font-semibold bg-brand text-white shrink-0">+ New Repair Order</button>
        </div>
        <p className="text-xs text-muted dark:text-dim">{user?.role === 'TECHNICIAN' ? 'Your assigned jobs' : 'Track client repairs'}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3.5 h-4 w-4 text-dim" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search customer, brand, IMEI..." className="neo-input w-full pl-10" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="neo-input w-full md:w-48 text-xs">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading ? <TableSkeleton rows={5} /> : repairsData?.items.map(rep => (
          <div key={rep.id} className="neo-card p-4 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold ">#{rep.id}</span>
              <div className="flex items-center gap-1.5">
                <DeliverToggle
                  delivered={rep.status === 'DELIVERED'}
                  onDeliver={() => handleStatusUpdate(rep.id, 'DELIVERED')}
                  onUndo={() => handleStatusUpdate(rep.id, 'RECEIVED')}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{rep.customer_name}</div>
                <div className="text-[10px] text-dim">{rep.phone_number}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-brand">{rep.brand} {rep.model}</div>
                {rep.imei && <div className="text-[10px] text-dim">IMEI: {rep.imei}</div>}
              </div>
            </div>
            <div className="flex justify-between text-muted">
              <span>Tech: {rep.assigned_technician?.name || 'Unassigned'}</span>
              <span className="font-bold text-danger">${rep.balance.toFixed(2)}</span>
            </div>
            <div className="text-muted truncate">{rep.desperfecto}</div>
            {rep.security_type && (
              <div className="text-[10px] border-t border-brand/10 pt-2 mt-1 text-muted">
                <span className="font-semibold text-brand">Security: </span>
                {rep.security_type === 'PIN' ? (
                  <span className="font-mono">{rep.security_value}</span>
                ) : (
                  <span>{rep.security_value}</span>
                )}
              </div>
            )}
            <div className="flex gap-2 mt-1">
              <button onClick={() => handlePrint(rep.id)} className="neo-btn flex-1 py-2 text-xs font-semibold text-success">Print</button>
              <button onClick={() => api.sharePdfOnWhatsApp(api.getWorkOrderPdfUrl(rep.id), `Work Order #${rep.id}`)} className="neo-btn flex-1 py-2 text-xs font-semibold text-green-600">WhatsApp</button>
              <button onClick={() => { setSelectedRepair(rep); setTransferTechId(rep.assigned_technician_id || undefined); setShowTransfer(true); }}
                className="neo-btn flex-1 py-2 text-xs font-semibold text-brand">Transfer</button>
            </div>
          </div>
        ))}
        {!isLoading && !repairsData?.items.length && (
          <div className="text-center text-xs text-dim py-12">No work orders found.</div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block neo-card p-6 overflow-x-auto">
        {isLoading ? <TableSkeleton rows={5} /> : (
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#D2D6DC] dark:border-[#1F1E2E] text-muted">
                <th className="py-3">ID</th>
                <th className="py-3">Client</th>
                <th className="py-3">Device</th>
                <th className="py-3">Tech</th>
                <th className="py-3">Defect</th>
                <th className="py-3 text-right">Balance</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {repairsData?.items.map(rep => (
                <tr key={rep.id} className="border-b border-[#E5E7EB] dark:border-black/5 hover:bg-black/5">
                  <td className="py-3.5 font-bold ">#{rep.id}</td>
                  <td className="py-3.5">
                    <div className="font-semibold">{rep.customer_name}</div>
                    <div className="text-[9px] text-dim">{rep.phone_number}</div>
                  </td>
                  <td className="py-3.5">
                    <div className="font-bold text-brand">{rep.brand} {rep.model}</div>
                    {rep.imei && <div className="text-[9px] text-dim">IMEI: {rep.imei}</div>}
                  </td>
                  <td className="py-3.5 text-muted dark:text-dim">{rep.assigned_technician?.name || 'Unassigned'}</td>
                  <td className="py-3.5 truncate max-w-[120px]">{rep.desperfecto}</td>
                  <td className="py-3.5 text-right font-bold text-danger">${rep.balance.toFixed(2)}</td>
                  <td className="py-3.5">
                    <DeliverToggle
                      delivered={rep.status === 'DELIVERED'}
                      onDeliver={() => { setPartCost(0); setDeliverTarget(rep); }}
                      onUndo={() => handleStatusUpdate(rep.id, 'RECEIVED')}
                    />
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handlePrint(rep.id)} className="neo-btn p-1 h-7 w-7 rounded-md text-success" title="Print"><Printer className="h-3.5 w-3.5" /></button>
                      <button onClick={() => api.sharePdfOnWhatsApp(api.getWorkOrderPdfUrl(rep.id), `Work Order #${rep.id}`)} className="neo-btn p-1 h-7 w-7 rounded-md text-green-600" title="Share via WhatsApp"><MessageCircle className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { setSelectedRepair(rep); setTransferTechId(rep.assigned_technician_id || undefined); setShowTransfer(true); }}
                        className="neo-btn py-1 px-2 text-[9px] font-semibold text-brand">Transfer</button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!repairsData?.items.length) && (
                <tr><td colSpan={8} className="py-8 text-center text-xs text-dim">No work orders found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="neo-card max-w-lg w-full p-5 relative max-h-[90vh] flex flex-col">
            <button onClick={() => { setShowCreate(false); resetForm(); }} className="absolute top-3 right-3 neo-btn h-7 w-7 rounded-full"><X className="h-3.5 w-3.5" /></button>
            <h3 className="font-extrabold text-sm border-b pb-2 border-brand/10 dark:border-[#1F1E2E] mb-3 shrink-0">Receive Repair Order</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3 text-xs overflow-y-auto pr-1">
              <div className="col-span-2 md:col-span-1">
                <label className="font-semibold">Customer Name *</label>
                <input required value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className="neo-input mt-1 w-full" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="font-semibold">Phone *</label>
                <input required value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} className="neo-input mt-1 w-full" />
              </div>
              <div>
                <label className="font-semibold">Brand *</label>
                <input required value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} className="neo-input mt-1 w-full" />
              </div>
              <div>
                <label className="font-semibold">Model *</label>
                <input required value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="neo-input mt-1 w-full" />
              </div>
              <div>
                <label className="font-semibold">IMEI</label>
                <input value={form.imei} onChange={e => setForm(f => ({ ...f, imei: e.target.value }))} className="neo-input mt-1 w-full" />
              </div>
              {(user?.role === 'SUPERADMIN' || user?.role === 'ADMIN') && (
                <div>
                  <label className="font-semibold">Assign Tech</label>
                  <select value={form.assigned_technician_id || ''} onChange={e => setForm(f => ({ ...f, assigned_technician_id: e.target.value ? Number(e.target.value) : undefined }))} className="neo-input mt-1 w-full">
                    <option value="">Unassigned</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="font-semibold">Defect Description *</label>
                <textarea required rows={2} value={form.desperfecto} onChange={e => setForm(f => ({ ...f, desperfecto: e.target.value }))} className="neo-input mt-1 w-full resize-none" />
              </div>

              {/* Security section — not printed on PDF */}
              <div ref={securityRef} className="col-span-2 border-t border-brand/10 pt-3 mt-1">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-3 w-3 text-brand" />
                  <span className="font-semibold text-[10px] text-brand">Device Security</span>
                </div>
                <div className="flex gap-3 mb-2 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="sec_type" value="PIN" checked={form.security_type === 'PIN'}
                      onChange={e => setForm(f => ({ ...f, security_type: 'PIN', security_value: '' }))} className="accent-brand" />
                    <span className="text-[11px]">PIN / Password</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="sec_type" value="PATTERN" checked={form.security_type === 'PATTERN'}
                      onChange={e => { setForm(f => ({ ...f, security_type: 'PATTERN', security_value: '' })); setTimeout(() => securityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); }} className="accent-brand" />
                    <span className="text-[11px]">Pattern</span>
                  </label>
                  {form.security_type && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, security_type: '', security_value: '' }))}
                      className="text-[10px] text-muted hover:text-danger transition-colors ml-auto">Remove</button>
                  )}
                </div>
                {form.security_type === 'PIN' && (
                  <input type="text" placeholder="Enter PIN or password" value={form.security_value}
                    onChange={e => setForm(f => ({ ...f, security_value: e.target.value }))}
                    className="w-full border-0 border-b-2 border-brand/30 bg-transparent focus:border-brand outline-none py-1.5 text-sm placeholder:text-muted/50" />
                )}
                {form.security_type === 'PATTERN' && (
                  <div className="flex justify-center py-1">
                    <PatternLock value={form.security_value}
                      onChange={v => setForm(f => ({ ...f, security_value: v }))} />
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold">Total Cost</label>
                <input type="number" value={form.total_cost || ''} onChange={e => setForm(f => ({ ...f, total_cost: Number(e.target.value) }))} className="neo-input mt-1 w-full" />
              </div>
              <div>
                <label className="font-semibold">Amount Paid</label>
                <input type="number" value={form.amount_paid || ''} onChange={e => setForm(f => ({ ...f, amount_paid: Number(e.target.value) }))} className="neo-input mt-1 w-full" />
              </div>
              <div className="col-span-2">
                <div className="font-bold text-danger text-[11px]">Balance: ${(form.total_cost - form.amount_paid).toFixed(2)}</div>
              </div>
              <div className="flex gap-3 col-span-2 mt-1">
                <button type="button" onClick={() => { setShowCreate(false); resetForm(); }} className="neo-btn flex-1 py-2.5 text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={createOrder.isPending} className="neo-btn flex-1 py-2.5 text-xs font-semibold bg-brand text-white disabled:opacity-40">
                  {createOrder.isPending ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransfer && selectedRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="neo-card max-w-md w-full p-6 relative">
            <button onClick={() => { setShowTransfer(false); setSelectedRepair(null); }} className="absolute top-4 right-4 neo-btn h-8 w-8 rounded-full"><X className="h-4 w-4" /></button>
            <h3 className="font-extrabold text-base border-b pb-2 border-brand/10 dark:border-[#1F1E2E] mb-4">Transfer #{selectedRepair.id}</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold">Recipient Technician</label>
                <select value={transferTechId || ''} onChange={e => setTransferTechId(e.target.value ? Number(e.target.value) : undefined)} className="neo-input mt-1 w-full">
                  <option value="">Select...</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold">Reason</label>
                <textarea rows={3} value={transferReason} onChange={e => setTransferReason(e.target.value)} className="neo-input mt-1 w-full resize-none" />
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button onClick={() => { setShowTransfer(false); setSelectedRepair(null); }} className="neo-btn flex-1 py-3 text-xs font-semibold">Cancel</button>
              <button onClick={handleTransfer} disabled={transferOrder.isPending || !transferTechId} className="neo-btn flex-1 py-3 text-xs font-semibold bg-brand text-white disabled:opacity-40">
                {transferOrder.isPending ? 'Transferring...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deliverTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="neo-card max-w-sm w-full p-6 relative">
            <button onClick={() => { setDeliverTarget(null); setPartCost(0); }} className="absolute top-4 right-4 neo-btn h-8 w-8 rounded-full"><X className="h-4 w-4" /></button>
            <h3 className="font-extrabold text-base border-b pb-2 border-brand/10 dark:border-[#1F1E2E] mb-4">Deliver #{deliverTarget.id}</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[#E5E7EB] dark:border-black/5">
                <span className="text-muted">Customer</span>
                <span className="font-semibold">{deliverTarget.customer_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#E5E7EB] dark:border-black/5">
                <span className="text-muted">Device</span>
                <span className="font-semibold">{deliverTarget.brand} {deliverTarget.model}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#E5E7EB] dark:border-black/5">
                <span className="text-muted">Total Cost</span>
                <span className="font-bold text-brand">${deliverTarget.total_cost.toFixed(2)}</span>
              </div>
              <div>
                <label className="font-semibold">Part Cost</label>
                <input type="number" step="0.01" min="0" value={partCost}
                  onChange={e => setPartCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="neo-input mt-1 w-full" />
              </div>
              <div className="flex justify-between py-2 bg-success/5 rounded px-2 -mx-2">
                <span className="font-bold text-sm">Net Revenue (dashboard)</span>
                <span className="font-bold text-sm text-success">
                  ${Math.max(0, deliverTarget.total_cost - partCost).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button onClick={() => { setDeliverTarget(null); setPartCost(0); }} className="neo-btn flex-1 py-3 text-xs font-semibold">Cancel</button>
              <button onClick={handleDeliverConfirm} disabled={updateOrder.isPending} className="neo-btn flex-1 py-3 text-xs font-semibold bg-success text-white disabled:opacity-40">
                {updateOrder.isPending ? 'Delivering...' : `✓ Deliver ($${Math.max(0, deliverTarget.total_cost - partCost).toFixed(2)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {lastWorkOrder && (
        <div className="fixed bottom-6 right-6 z-50 neo-card p-4 flex items-center gap-4 shadow-lg animate-in slide-in-from-bottom-4">
          <div>
            <div className="font-bold text-sm text-success">Work Order #{lastWorkOrder.id} created</div>
            <div className="text-xs text-muted">{lastWorkOrder.customer_name} — {lastWorkOrder.brand} {lastWorkOrder.model}</div>
          </div>
          <button onClick={() => handlePrint(lastWorkOrder.id)} className="neo-btn py-2 px-3 text-xs font-semibold text-brand flex items-center gap-1">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button onClick={() => api.sharePdfOnWhatsApp(api.getWorkOrderPdfUrl(lastWorkOrder.id), `Work Order #${lastWorkOrder.id}`)} className="neo-btn py-2 px-3 text-xs font-semibold text-green-600 flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </button>
          <button onClick={() => setLastWorkOrder(null)} className="neo-btn h-7 w-7 rounded-full text-dim"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </div>
  );
}
