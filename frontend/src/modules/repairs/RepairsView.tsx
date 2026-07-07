import { useState, useEffect, useRef } from 'react';
import { useWorkOrders, useEmployees, useCreateWorkOrder, useUpdateWorkOrder, useTransferWorkOrder } from '../../hooks/useApiQueries';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useDebounce } from '../../hooks/useDebounce';
import { useTranslation } from 'react-i18next';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { PatternLock } from '../../components/PatternLock';
import { StatusSegmentedControl } from '../../components/StatusSegmentedControl';
import type { WorkOrder, WorkOrderStatus } from '../../types';

/* ─── Color palette — via CSS vars (light/dark aware) ── */
const C = {
  bg: 'var(--c-bg)',
  surface: 'var(--c-surface)',
  hover: 'var(--c-hover)',
  primary: 'var(--c-primary)',
  success: 'var(--c-success)',
  warning: 'var(--c-warning)',
  danger: 'var(--c-danger)',
  text: 'var(--c-text)',
  textSec: 'var(--c-text-sec)',
  border: 'var(--c-border)',
  divider: 'var(--c-divider)',
} as const;

const STATUSES: WorkOrderStatus[] = ['progreso', 'listo', 'entregado'];

/* ─── Status badge colors ─────────────────────────── */
const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  progreso: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', label: '🔧 Recibido / En progreso' },
  listo: { color: '#34D399', bg: 'rgba(52,211,153,0.12)', label: '✅ Listo' },
  entregado: { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', label: '📦 Entregado' },
};

/* ─── Sub-components ──────────────────────────────── */
function TechAvatar({ name }: { name: string | null }) {
  if (!name) {
    return <span className="text-sm" style={{ color: C.textSec, fontStyle: 'italic' }}>— Sin asignar</span>;
  }
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
        style={{
          width: 32, height: 32,
          backgroundColor: 'var(--c-primary-10)',
          color: C.primary,
        }}
      >
        {initial}
      </div>
      <span className="text-sm truncate" style={{ color: C.text }}>{name}</span>
    </div>
  );
}

function ActionIcon({ icon, onClick, color = 'var(--c-text-sec)', tooltip }: { icon: string; onClick: () => void; color?: string; tooltip: string }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className="flex items-center justify-center transition-all duration-150"
      style={{
        width: 32, height: 32,
        borderRadius: 8,
        backgroundColor: 'transparent',
        border: '1px solid transparent',
        color: color,
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-hover)'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = 'var(--c-text)'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = color; }}
    >
      <MaterialIcon icon={icon} size={16} wght={300} />
    </button>
  );
}

function StatusBadge({ status, onClick }: { status: string, onClick?: () => void }) {
  const sc = STATUS_COLORS[status] || { color: 'var(--c-text-sec)', bg: 'var(--c-hover)', label: status };
  return (
    <span
      onClick={onClick}
      className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      style={{ backgroundColor: sc.bg, color: sc.color }}
    >
      {sc.label}
    </span>
  );
}

/* ════════════════════════════════════════════════════ */

export function RepairsView({ showToast: _showToast, createTrigger, onConsumeTrigger }: { showToast?: (type: 'success' | 'error', msg: string) => void; createTrigger?: number; onConsumeTrigger?: () => void }) {
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
  const { data: repairsData, isLoading } = useWorkOrders(debouncedSearch, statusFilter, user?.role === 'TECH_IT' || user?.role === 'TECH_COM' ? user.id : undefined, page);
  const { data: employees } = useEmployees(true);
  const createOrder = useCreateWorkOrder();
  const updateOrder = useUpdateWorkOrder();
  const transferOrder = useTransferWorkOrder();
  const technicians = employees?.filter(e => e.role === 'TECH_IT' || e.role === 'TECH_COM') || [];
  const { t } = useTranslation();

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      setShowCreate(true);
      onConsumeTrigger?.();
    }
  }, [createTrigger]);

  interface AdditionalItem {
    brand: string; model: string; imei: string;
    desperfecto: string; diagnostico: string; motivo: string;
    total_cost: number; security_type: string; security_value: string;
  }

  const [form, setForm] = useState({
    customer_name: '', phone_number: '', imei: '', brand: '', model: '',
    desperfecto: '', diagnostico: '', motivo: '', total_cost: 0,
    amount_paid: 0, payment_method: 'CASH',
    assigned_technician_id: undefined as number | undefined,
    warranty_info: '', security_type: '', security_value: '',
    additionalItems: [] as AdditionalItem[],
  });
  const [transferTechId, setTransferTechId] = useState<number | undefined>(undefined);
  const [transferReason, setTransferReason] = useState('');
  const [deliverTarget, setDeliverTarget] = useState<WorkOrder | null>(null);
  const [statusModalTarget, setStatusModalTarget] = useState<WorkOrder | null>(null);
  const [partCost, setPartCost] = useState(0);

  const emptyItem = (): AdditionalItem => ({
    brand: '', model: '', imei: '', desperfecto: '', diagnostico: '', motivo: '',
    total_cost: 0, security_type: '', security_value: '',
  });

  const resetForm = () => setForm({
    customer_name: '', phone_number: '', imei: '', brand: '', model: '',
    desperfecto: '', diagnostico: '', motivo: '', total_cost: 0,
    amount_paid: 0, payment_method: 'CASH', assigned_technician_id: undefined,
    warranty_info: '', security_type: '', security_value: '',
    additionalItems: [],
  });
  const securityRef = useRef<HTMLDivElement>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const allItems = [
        {
          brand: form.brand, model: form.model, imei: form.imei || undefined,
          desperfecto: form.desperfecto, diagnostico: form.diagnostico || undefined,
          motivo: form.motivo || undefined, total_cost: form.total_cost,
          security_type: form.security_type || undefined,
          security_value: form.security_value || undefined,
        },
        ...form.additionalItems.map(it => ({
          brand: it.brand, model: it.model, imei: it.imei || undefined,
          desperfecto: it.desperfecto, diagnostico: it.diagnostico || undefined,
          motivo: it.motivo || undefined, total_cost: it.total_cost,
          security_type: it.security_type || undefined,
          security_value: it.security_value || undefined,
        })),
      ];
      const totalCost = allItems.reduce((sum, it) => sum + it.total_cost, 0);

      const payload = {
        customer_name: form.customer_name,
        phone_number: form.phone_number,
        amount_paid: form.amount_paid,
        payment_method: form.payment_method,
        warranty_info: form.warranty_info,
        assigned_technician_id: form.assigned_technician_id ?? (user?.role === 'TECH_IT' || user?.role === 'TECH_COM' ? user.id : undefined),
        total_cost: totalCost,
        items: allItems,
      };
      const wo = await createOrder.mutateAsync(payload);
      setLastWorkOrder(wo);
      setShowCreate(false);
      resetForm();
    } catch {}
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      if (status === 'entregado') {
        // If they just switch to entregado, we can either ask for payment or auto-set.
        // The modal handles payment, so if they change it directly we just set it.
        const target = repairsData?.items.find(r => r.id === id);
        const amount_paid = target ? target.total_cost : 0;
        await updateOrder.mutateAsync({ id, data: { status, amount_paid } });
      } else {
        await updateOrder.mutateAsync({ id, data: { status } });
      }
    } catch {}
  };

  const handleDeliverConfirm = async () => {
    if (!deliverTarget) return;
    const amountPaid = Math.max(0, deliverTarget.total_cost - partCost);
    try {
      await updateOrder.mutateAsync({ id: deliverTarget.id, data: { status: 'entregado', amount_paid: amountPaid } });
      setDeliverTarget(null);
      setPartCost(0);
    } catch {}
  };

  const handlePrint = (id: number) => {
    api.printPdf('work-order', id);
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
    <div className="flex flex-col gap-6" style={{ maxWidth: 960 }}>
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pb-4" style={{ borderBottom: `1px solid ${C.divider}` }}>
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <MaterialIcon icon="build" size={20} wght={400} style={{ color: C.primary }} />
            <h1 className="text-lg font-bold tracking-tight" style={{ color: C.text }}>{t('repairs.title')}</h1>
          </div>
          <p className="text-xs" style={{ color: C.textSec }}>{t('repairs.subtitleAdmin')}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200"
          style={{ backgroundColor: C.primary, color: '#fff' }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
        >
          <MaterialIcon icon="add" size={16} wght={400} />
          {t('repairs.newOrder')}
        </button>
      </div>

      {/* ── Search + Filters ──────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative w-full">
          <MaterialIcon icon="search" size={18} wght={300} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.textSec, opacity: 0.6 }} />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por cliente, IMEI, modelo o número de orden..."
            style={{
              backgroundColor: 'var(--c-bg-alt)',
              border: `1px solid var(--c-border-input)`,
              color: C.text,
              paddingLeft: 40,
            }}
            className="w-full rounded-xl py-2.5 pr-3 text-sm outline-none transition-all duration-200"
            onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = '0 0 0 3px var(--c-primary-12)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <div className="relative w-full md:w-48">
          <MaterialIcon icon="filter_list" size={16} wght={300} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textSec, opacity: 0.6 }} />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              backgroundColor: 'var(--c-bg-alt)',
              border: `1px solid var(--c-border-input)`,
              color: C.text,
              paddingLeft: 36,
            }}
            className="w-full rounded-xl py-2.5 pr-8 text-sm outline-none transition-all duration-200 appearance-none"
            onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = '0 0 0 3px var(--c-primary-12)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <option value="">{t('repairs.allStatuses')}</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s]?.label || s}</option>)}
          </select>
          <MaterialIcon icon="expand_more" size={16} wght={300} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textSec, opacity: 0.4 }} />
        </div>
      </div>

      {/* ── Mobile cards ────────────────────────────── */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading ? <TableSkeleton rows={5} /> : repairsData?.items.map(rep => (
          <div
            key={rep.id}
            className="rounded-xl p-4 flex flex-col gap-3 text-sm transition-all duration-200"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-primary-20)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
          >
            <div className="flex items-center justify-between">
              <span
                className="inline-flex px-2 py-0.5 rounded text-xs font-mono font-semibold tabular-nums"
                style={{ backgroundColor: C.hover, color: C.text }}
              >
                #{String(rep.id).padStart(4, '0')}
              </span>
              <StatusBadge status={rep.status} onClick={() => setStatusModalTarget(rep)} />
            </div>
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold" style={{ color: C.text }}>{rep.customer_name}</div>
                <div className="text-xs mt-0.5" style={{ color: C.textSec }}>{rep.phone_number}</div>
                <div className="flex items-center gap-2 mt-2">
                  <TechAvatar name={rep.assigned_technician?.name || null} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold" style={{ color: C.primary }}>{rep.brand} {rep.model}</div>
                {rep.imei && <div className="text-xs mt-0.5 font-mono" style={{ color: C.textSec }}>IMEI: {rep.imei}</div>}
                <div className="text-base font-bold tabular-nums mt-2" style={{ color: C.text }}>${rep.balance.toFixed(2)}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span
                className="inline-flex px-2 py-1 rounded text-xs"
                style={{ backgroundColor: C.hover, color: C.textSec }}
              >
                {rep.desperfecto}
              </span>
            </div>
            {rep.security_type && (
              <div className="flex items-center gap-1.5 pt-2.5 mt-0.5 text-xs" style={{ borderTop: `1px solid ${C.divider}`, color: C.textSec }}>
                <MaterialIcon icon="lock" size={12} wght={300} style={{ color: C.primary }} />
                <span className="font-semibold" style={{ color: C.primary, fontSize: 10 }}>{t('repairs.deviceSecurity')}: </span>
                {rep.security_type === 'PIN' ? (
                  <span className="font-mono text-xs">{rep.security_value}</span>
                ) : (
                  <span className="text-xs">{rep.security_value}</span>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-1" style={{ borderTop: `1px solid ${C.divider}` }}>
              <ActionIcon icon="print" onClick={() => handlePrint(rep.id)} tooltip={t('repairs.print')} />
              <ActionIcon icon="chat" onClick={() => api.sharePdfOnWhatsApp('work-order', rep.id, `Work Order #${rep.id}`)} tooltip="WhatsApp" />
              <ActionIcon icon="swap_horiz" onClick={() => { setSelectedRepair(rep); setTransferTechId(rep.assigned_technician_id || undefined); setShowTransfer(true); }} color="var(--c-primary)" tooltip={t('repairs.transfer')} />
            </div>
          </div>
        ))}
        {!isLoading && !repairsData?.items.length && (
          <div className="text-center py-12 text-xs" style={{ color: C.textSec }}>{t('repairs.noOrders')}</div>
        )}
      </div>

      {/* ── Desktop table — card grid layout ─────────── */}
      <div className="hidden md:block">
        {isLoading ? <TableSkeleton rows={5} /> : (
          <div className="flex flex-col gap-2">
            {/* Header row */}
            <div className="grid grid-cols-[80px_minmax(160px,1.5fr)_minmax(140px,1.5fr)_minmax(120px,1.2fr)_1fr_100px_110px_120px] gap-3 px-5 py-2 text-xs font-medium uppercase tracking-wider" style={{ color: C.textSec, opacity: 0.6 }}>
              <span>{t('repairs.id')}</span>
              <span>{t('repairs.client')}</span>
              <span>{t('repairs.device')}</span>
              <span>{t('repairs.tech')}</span>
              <span>{t('repairs.defect')}</span>
              <span className="text-right">{t('repairs.balance')}</span>
              <span>{t('repairs.status')}</span>
              <span className="text-right">{t('repairs.actions')}</span>
            </div>

            {/* Data rows */}
            {repairsData?.items.map(rep => (
              <div
                key={rep.id}
                className="grid grid-cols-[80px_minmax(160px,1.5fr)_minmax(140px,1.5fr)_minmax(120px,1.2fr)_1fr_100px_110px_120px] gap-3 items-center px-5 py-4 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: C.surface,
                  border: `1px solid transparent`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* ID */}
                <span
                  className="inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-mono font-semibold tabular-nums w-fit"
                  style={{ backgroundColor: C.hover, color: C.text }}
                >
                  #{String(rep.id).padStart(4, '0')}
                </span>

                {/* Client */}
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight" style={{ color: C.text }}>{rep.customer_name}</div>
                  <div className="text-xs mt-1 truncate" style={{ color: C.textSec }}>{rep.phone_number}</div>
                </div>

                {/* Device */}
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: C.primary }}>{rep.brand} {rep.model}</div>
                  {rep.imei && <div className="text-xs mt-0.5 font-mono truncate" style={{ color: C.textSec }}>IMEI: {rep.imei}</div>}
                </div>

                {/* Technician */}
                <div className="min-w-0">
                  <TechAvatar name={rep.assigned_technician?.name || null} />
                </div>

                {/* Defect */}
                <div className="min-w-0">
                  <span
                    className="inline-flex px-2.5 py-1 rounded text-xs font-medium truncate max-w-full"
                    style={{ backgroundColor: C.hover, color: C.textSec }}
                  >
                    {rep.desperfecto}
                  </span>
                </div>

                {/* Balance */}
                <div className="text-right">
                  <div className="text-sm font-bold tabular-nums" style={{ color: C.text }}>${rep.balance.toFixed(2)}</div>
                  {rep.balance > 0 && <div className="text-xs font-medium mt-0.5" style={{ color: C.danger, opacity: 0.7 }}>ADEUDA</div>}
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={rep.status} onClick={() => setStatusModalTarget(rep)} />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <ActionIcon icon="print" onClick={() => handlePrint(rep.id)} tooltip={t('repairs.print')} />
                  <ActionIcon icon="chat" onClick={() => api.sharePdfOnWhatsApp('work-order', rep.id, `Work Order #${rep.id}`)} tooltip="WhatsApp" />
                  <ActionIcon icon="visibility" onClick={() => {}} tooltip="Ver detalle" />
                  <ActionIcon icon="swap_horiz" onClick={() => { setSelectedRepair(rep); setTransferTechId(rep.assigned_technician_id || undefined); setShowTransfer(true); }} color="var(--c-primary)" tooltip={t('repairs.transfer')} />
                </div>
              </div>
            ))}

            {(!repairsData?.items.length) && (
              <div className="py-12 text-center text-xs" style={{ color: C.textSec }}>{t('repairs.noOrders')}</div>
            )}
          </div>
        )}
      </div>

      {/* ── Create Modal ─────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-xl max-w-lg w-full p-5 relative max-h-[90vh] flex flex-col" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <button onClick={() => { setShowCreate(false); resetForm(); }} className="absolute top-3 right-3 flex items-center justify-center rounded-full transition-all duration-150"
              style={{ width: 28, height: 28, backgroundColor: C.hover, color: C.textSec, border: `1px solid ${C.border}` }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.border; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
            >
              <MaterialIcon icon="close" size={14} wght={300} />
            </button>
            <h3 className="font-extrabold text-sm pb-2 mb-3 shrink-0" style={{ color: C.text, borderBottom: `1px solid ${C.divider}` }}>{t('repairs.receiveOrder')}</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3 text-xs overflow-y-auto pr-1">
              <div className="col-span-2 md:col-span-1">
                <label className="font-semibold" style={{ color: C.text }}>{t('repairs.customerName')}</label>
                <input required value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                  className="mt-1 w-full text-sm outline-none transition-all duration-150"
                  onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = '0 0 0 3px var(--c-primary-12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="font-semibold" style={{ color: C.text }}>{t('repairs.phone')}</label>
                <input required value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                  style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                  className="mt-1 w-full text-sm outline-none transition-all duration-150"
                  onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = '0 0 0 3px var(--c-primary-12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label className="font-semibold" style={{ color: C.text }}>{t('repairs.brand')}</label>
                <input required value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                  style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                  className="mt-1 w-full text-sm outline-none transition-all duration-150"
                  onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = '0 0 0 3px var(--c-primary-12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label className="font-semibold" style={{ color: C.text }}>{t('repairs.model')}</label>
                <input required value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                  style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                  className="mt-1 w-full text-sm outline-none transition-all duration-150"
                  onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = '0 0 0 3px var(--c-primary-12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label className="font-semibold" style={{ color: C.text }}>{t('repairs.imei')}</label>
                <input value={form.imei} onChange={e => setForm(f => ({ ...f, imei: e.target.value }))}
                  style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                  className="mt-1 w-full text-sm outline-none transition-all duration-150"
                  onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = '0 0 0 3px var(--c-primary-12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              {(user?.role === 'ADMIN') && (
                <div>
                  <label className="font-semibold" style={{ color: C.text }}>{t('repairs.assignTech')}</label>
                  <select value={form.assigned_technician_id || ''} onChange={e => setForm(f => ({ ...f, assigned_technician_id: e.target.value ? Number(e.target.value) : undefined }))}
                    style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                    className="mt-1 w-full text-sm outline-none transition-all duration-150"
                    onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                  >
                    <option value="">{t('repairs.unassigned')}</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="font-semibold" style={{ color: C.text }}>{t('repairs.defectDescription')}</label>
                <textarea required rows={2} value={form.desperfecto} onChange={e => setForm(f => ({ ...f, desperfecto: e.target.value }))}
                  style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                  className="mt-1 w-full text-sm outline-none transition-all duration-150 resize-none"
                  onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = '0 0 0 3px var(--c-primary-12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div ref={securityRef} className="col-span-2 pt-3 mt-1" style={{ borderTop: `1px solid ${C.divider}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <MaterialIcon icon="lock" size={12} wght={300} style={{ color: C.primary }} />
                  <span className="font-semibold text-xs" style={{ color: C.primary }}>{t('repairs.deviceSecurity')}</span>
                </div>
                <div className="flex gap-3 mb-2 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: C.text }}>
                    <input type="radio" name="sec_type" value="PIN" checked={form.security_type === 'PIN'}
                      onChange={_e => setForm(f => ({ ...f, security_type: 'PIN', security_value: '' }))} className="accent-brand" />
                    <span>{t('repairs.pinPassword')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: C.text }}>
                    <input type="radio" name="sec_type" value="PATTERN" checked={form.security_type === 'PATTERN'}
                      onChange={_e => { setForm(f => ({ ...f, security_type: 'PATTERN', security_value: '' })); setTimeout(() => securityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); }} className="accent-brand" />
                    <span>{t('repairs.pattern')}</span>
                  </label>
                  {form.security_type && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, security_type: '', security_value: '' }))}
                      className="text-xs ml-auto transition-colors" style={{ color: C.textSec }}
                      onMouseEnter={e => { e.currentTarget.style.color = C.danger; }}
                      onMouseLeave={e => { e.currentTarget.style.color = C.textSec; }}
                    >{t('repairs.remove')}</button>
                  )}
                </div>
                {form.security_type === 'PIN' && (
                  <input type="text" placeholder={t('repairs.enterPin')} value={form.security_value}
                    onChange={e => setForm(f => ({ ...f, security_value: e.target.value }))}
                    style={{ border: 'none', borderBottom: '2px solid var(--c-primary-30)', backgroundColor: 'transparent', color: C.text }}
                    className="w-full outline-none py-1.5 text-sm placeholder:text-on-surface-variant/50" />
                )}
                {form.security_type === 'PATTERN' && (
                  <div className="flex justify-center py-1">
                    <PatternLock value={form.security_value}
                      onChange={v => setForm(f => ({ ...f, security_value: v }))} />
                  </div>
                )}
              </div>

              <div className="col-span-2 pt-3 mt-2" style={{ borderTop: `1px solid ${C.divider}` }}>
                {form.additionalItems.map((item, idx) => (
                  <div key={idx} className="mb-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--c-bg-alt)', border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs" style={{ color: C.text }}>{t('repairs.itemNumber', { n: idx + 2 })}</span>
                      <button type="button" onClick={() => setForm(f => ({ ...f, additionalItems: f.additionalItems.filter((_, i) => i !== idx) }))}
                        className="text-xs font-semibold transition-colors" style={{ color: C.danger }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#b91c1c'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = C.danger; }}
                      >{t('repairs.removeItem')}</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="font-semibold" style={{ color: C.text }}>{t('repairs.brand')}</label>
                        <input required value={item.brand} onChange={e => {
                          const val = e.target.value;
                          setForm(f => ({ ...f, additionalItems: f.additionalItems.map((it, i) => i === idx ? { ...it, brand: val } : it) }));
                        }}
                          style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                          className="mt-1 w-full text-sm outline-none transition-all duration-150"
                          onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                        />
                      </div>
                      <div>
                        <label className="font-semibold" style={{ color: C.text }}>{t('repairs.model')}</label>
                        <input required value={item.model} onChange={e => {
                          const val = e.target.value;
                          setForm(f => ({ ...f, additionalItems: f.additionalItems.map((it, i) => i === idx ? { ...it, model: val } : it) }));
                        }}
                          style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                          className="mt-1 w-full text-sm outline-none transition-all duration-150"
                          onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                        />
                      </div>
                      <div>
                        <label className="font-semibold" style={{ color: C.text }}>{t('repairs.imei')}</label>
                        <input value={item.imei} onChange={e => {
                          const val = e.target.value;
                          setForm(f => ({ ...f, additionalItems: f.additionalItems.map((it, i) => i === idx ? { ...it, imei: val } : it) }));
                        }}
                          style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                          className="mt-1 w-full text-sm outline-none transition-all duration-150"
                          onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                        />
                      </div>
                      <div>
                        <label className="font-semibold" style={{ color: C.text }}>{t('repairs.costPerItem')}</label>
                        <input type="number" value={item.total_cost || ''} onChange={e => {
                          const val = Number(e.target.value);
                          setForm(f => ({ ...f, additionalItems: f.additionalItems.map((it, i) => i === idx ? { ...it, total_cost: val } : it) }));
                        }}
                          style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                          className="mt-1 w-full text-sm outline-none transition-all duration-150"
                          onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="font-semibold" style={{ color: C.text }}>{t('repairs.defectDescription')}</label>
                        <textarea required rows={2} value={item.desperfecto} onChange={e => {
                          const val = e.target.value;
                          setForm(f => ({ ...f, additionalItems: f.additionalItems.map((it, i) => i === idx ? { ...it, desperfecto: val } : it) }));
                        }}
                          style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                          className="mt-1 w-full text-sm outline-none transition-all duration-150 resize-none"
                          onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                        />
                      </div>
                      <div>
                        <label className="font-semibold" style={{ color: C.text }}>{t('repairs.pinPassword')}</label>
                        <input value={item.security_value} onChange={e => {
                          const val = e.target.value;
                          setForm(f => ({ ...f, additionalItems: f.additionalItems.map((it, i) => i === idx ? { ...it, security_value: val } : it) }));
                        }}
                          style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                          className="mt-1 w-full text-sm outline-none transition-all duration-150"
                          onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setForm(f => ({ ...f, additionalItems: [...f.additionalItems, emptyItem()] }))}
                  className="w-full py-2 text-xs font-semibold flex items-center justify-center gap-1 mb-2 transition-all duration-150 rounded-xl"
                  style={{ backgroundColor: 'transparent', color: C.primary, border: `1px solid ${C.border}` }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-primary-8)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  + {t('repairs.addItem')}
                </button>
              </div>

              <div>
                <label className="font-semibold" style={{ color: C.text }}>{t('repairs.totalCost')}</label>
                <input type="number" value={form.total_cost || ''} onChange={e => setForm(f => ({ ...f, total_cost: Number(e.target.value) }))}
                  style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                  className="mt-1 w-full text-sm outline-none transition-all duration-150"
                  onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                />
              </div>
              <div>
                <label className="font-semibold" style={{ color: C.text }}>{t('repairs.amountPaid')}</label>
                <input type="number" value={form.amount_paid || ''} onChange={e => setForm(f => ({ ...f, amount_paid: Number(e.target.value) }))}
                  style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                  className="mt-1 w-full text-sm outline-none transition-all duration-150"
                  onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                />
              </div>
              <div className="col-span-2">
                <div className="font-bold text-xs" style={{ color: C.danger }}>{t('repairs.balance')}: ${((form.total_cost + form.additionalItems.reduce((s, it) => s + it.total_cost, 0)) - form.amount_paid).toFixed(2)}</div>
              </div>
              <div className="flex gap-3 col-span-2 mt-1">
                <button type="button" onClick={() => { setShowCreate(false); resetForm(); }}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150"
                  style={{ backgroundColor: C.hover, color: C.text, border: `1px solid ${C.border}` }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.border; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
                >{t('repairs.cancel')}</button>
                <button type="submit" disabled={createOrder.isPending}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 disabled:opacity-40"
                  style={{ backgroundColor: C.primary, color: '#fff' }}
                  onMouseEnter={e => { if (!createOrder.isPending) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
                >
                  {createOrder.isPending ? t('repairs.creating') : t('repairs.createOrder')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Transfer Modal ───────────────────────────── */}
      {showTransfer && selectedRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-xl max-w-md w-full p-6 relative" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <button onClick={() => { setShowTransfer(false); setSelectedRepair(null); }} className="absolute top-4 right-4 flex items-center justify-center rounded-full transition-all duration-150"
              style={{ width: 28, height: 28, backgroundColor: C.hover, color: C.textSec, border: `1px solid ${C.border}` }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.border; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
            >
              <MaterialIcon icon="close" size={14} wght={300} />
            </button>
            <h3 className="font-extrabold text-base pb-2 mb-4" style={{ color: C.text, borderBottom: `1px solid ${C.divider}` }}>{t('repairs.transferTitle', { id: selectedRepair.id })}</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold" style={{ color: C.text }}>{t('repairs.recipientTech')}</label>
                <select value={transferTechId || ''} onChange={e => setTransferTechId(e.target.value ? Number(e.target.value) : undefined)}
                  style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                  className="mt-1 w-full text-sm outline-none transition-all duration-150"
                  onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                >
                  <option value="">{t('repairs.select')}</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold" style={{ color: C.text }}>{t('repairs.reason')}</label>
                <textarea rows={3} value={transferReason} onChange={e => setTransferReason(e.target.value)}
                  style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                  className="mt-1 w-full text-sm outline-none transition-all duration-150 resize-none"
                  onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button onClick={() => { setShowTransfer(false); setSelectedRepair(null); }}
                className="flex-1 py-3 text-xs font-semibold rounded-xl transition-all duration-150"
                style={{ backgroundColor: C.hover, color: C.text, border: `1px solid ${C.border}` }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.border; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
              >{t('repairs.cancel')}</button>
              <button onClick={handleTransfer} disabled={transferOrder.isPending || !transferTechId}
                className="flex-1 py-3 text-xs font-semibold rounded-xl transition-all duration-150 disabled:opacity-40"
                style={{ backgroundColor: C.primary, color: '#fff' }}
                onMouseEnter={e => { if (!transferOrder.isPending && transferTechId) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
              >
                {transferOrder.isPending ? t('repairs.transferring') : t('repairs.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Modal ────────────────────────────── */}
      {statusModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-xl max-w-sm w-full p-6 relative" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <button onClick={() => setStatusModalTarget(null)} className="absolute top-4 right-4 flex items-center justify-center rounded-full transition-all duration-150"
              style={{ width: 28, height: 28, backgroundColor: C.hover, color: C.textSec, border: `1px solid ${C.border}` }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.border; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
            >
              <MaterialIcon icon="close" size={14} wght={300} />
            </button>
            <h3 className="font-extrabold text-base pb-2 mb-4" style={{ color: C.text, borderBottom: `1px solid ${C.divider}` }}>Actualizar Estado</h3>
            <div className="flex flex-col gap-4 text-xs">
              <div className="flex justify-between py-1">
                <span style={{ color: C.textSec }}>{t('repairs.device')}</span>
                <span className="font-semibold" style={{ color: C.text }}>{statusModalTarget.brand} {statusModalTarget.model}</span>
              </div>
              <div className="flex justify-center py-2">
                <StatusSegmentedControl
                  options={[
                    { value: 'progreso', label: 'En progreso', icon: 'build' },
                    { value: 'listo', label: 'Listo', icon: 'check_circle' },
                    { value: 'entregado', label: 'Entregado', icon: 'inventory_2' }
                  ]}
                  value={statusModalTarget.status}
                  onChange={async (newStatus) => {
                    if (newStatus === 'entregado') {
                      // Redirect to deliver target flow instead
                      setDeliverTarget(statusModalTarget);
                      setStatusModalTarget(null);
                    } else {
                      await handleStatusUpdate(statusModalTarget.id, newStatus);
                      setStatusModalTarget(null);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Deliver Modal ────────────────────────────── */}
      {deliverTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-xl max-w-sm w-full p-6 relative" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <button onClick={() => { setDeliverTarget(null); setPartCost(0); }} className="absolute top-4 right-4 flex items-center justify-center rounded-full transition-all duration-150"
              style={{ width: 28, height: 28, backgroundColor: C.hover, color: C.textSec, border: `1px solid ${C.border}` }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.border; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
            >
              <MaterialIcon icon="close" size={14} wght={300} />
            </button>
            <h3 className="font-extrabold text-base pb-2 mb-4" style={{ color: C.text, borderBottom: `1px solid ${C.divider}` }}>{t('repairs.deliverTitle', { id: deliverTarget.id })}</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${C.divider}` }}>
                <span style={{ color: C.textSec }}>{t('repairs.customer')}</span>
                <span className="font-semibold" style={{ color: C.text }}>{deliverTarget.customer_name}</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${C.divider}` }}>
                <span style={{ color: C.textSec }}>{t('repairs.device')}</span>
                <span className="font-semibold" style={{ color: C.text }}>{deliverTarget.brand} {deliverTarget.model}</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${C.divider}` }}>
                <span style={{ color: C.textSec }}>{t('repairs.totalCost')}</span>
                <span className="font-bold" style={{ color: C.primary }}>${deliverTarget.total_cost.toFixed(2)}</span>
              </div>
              <div>
                <label className="font-semibold" style={{ color: C.text }}>{t('repairs.partCost')}</label>
                <input type="number" step="0.01" min="0" value={partCost}
                  onChange={e => setPartCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  style={{ backgroundColor: C.bg, border: `1px solid var(--c-border-input)`, color: C.text, borderRadius: 10, padding: '10px 14px' }}
                  className="mt-1 w-full text-sm outline-none transition-all duration-150"
                  onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
                />
              </div>
              <div className="flex justify-between py-2 rounded-lg px-2 -mx-2" style={{ backgroundColor: 'var(--c-success-12)' }}>
                <span className="font-bold text-sm" style={{ color: C.text }}>{t('repairs.netRevenue')}</span>
                <span className="font-bold text-sm" style={{ color: C.success }}>
                  ${Math.max(0, deliverTarget.total_cost - partCost).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button onClick={() => { setDeliverTarget(null); setPartCost(0); }}
                className="flex-1 py-3 text-xs font-semibold rounded-xl transition-all duration-150"
                style={{ backgroundColor: C.hover, color: C.text, border: `1px solid ${C.border}` }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.border; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
              >{t('repairs.cancel')}</button>
              <button onClick={handleDeliverConfirm} disabled={updateOrder.isPending}
                className="flex-1 py-3 text-xs font-semibold rounded-xl transition-all duration-150 disabled:opacity-40"
                style={{ backgroundColor: C.success, color: '#fff' }}
                onMouseEnter={e => { if (!updateOrder.isPending) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
              >
                {updateOrder.isPending ? t('repairs.delivering') : t('repairs.deliverWithAmount', { amount: Math.max(0, deliverTarget.total_cost - partCost).toFixed(2) })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notification ───────────────────────── */}
      {lastWorkOrder && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl p-4 flex flex-col gap-3 shadow-lg min-w-[200px] animate-in slide-in-from-bottom-4"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-sm" style={{ color: C.success }}>{t('repairs.orderCreated', { id: lastWorkOrder.id })}</div>
              <div className="text-xs" style={{ color: C.textSec }}>{t('repairs.orderCreatedDetail', { customer: lastWorkOrder.customer_name, brand: lastWorkOrder.brand, model: lastWorkOrder.model })}</div>
            </div>
            <button onClick={() => setLastWorkOrder(null)}
              className="flex items-center justify-center rounded-full shrink-0 transition-all duration-150"
              style={{ width: 28, height: 28, backgroundColor: C.hover, color: C.textSec, border: `1px solid ${C.border}` }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.border; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
            >
              <MaterialIcon icon="close" size={14} wght={300} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => handlePrint(lastWorkOrder.id)}
              className="w-full py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1 rounded-lg transition-all duration-150"
              style={{ backgroundColor: C.hover, color: C.primary, border: `1px solid ${C.border}` }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-primary-8)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
            >
              <MaterialIcon icon="print" size={14} wght={300} /> {t('repairs.print')}
            </button>
            <button onClick={() => api.sharePdfOnWhatsApp('work-order', lastWorkOrder.id, `Work Order #${lastWorkOrder.id}`)}
              className="w-full py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1 rounded-lg transition-all duration-150"
              style={{ backgroundColor: C.hover, color: C.success, border: `1px solid ${C.border}` }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-success-12)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
            >
              <MaterialIcon icon="chat" size={14} wght={300} /> {t('repairs.whatsapp')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
