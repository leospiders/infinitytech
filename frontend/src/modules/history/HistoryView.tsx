import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from '../../hooks/useApiQueries';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { formatDate } from '../../utils/formatDate';
import type { Sale, WorkOrder, HistoryItem } from '../../types';

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

/* ─── Status badge helper ──────────────────────────── */
function statusStyle(status: string) {
  if (status === 'entregado' || status === 'PAID' || status === 'listo') {
    return { color: C.success, bg: 'var(--c-success-soft)' };
  }
  if (status === 'CANCELLED') {
    return { color: C.danger, bg: 'var(--c-danger-soft)' };
  }
  return { color: C.textSec, bg: 'var(--c-hover)' };
}

/* ════════════════════════════════════════════════════ */

export function HistoryView() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, refetch } = useHistory(debouncedSearch, typeFilter, page);
  const { t } = useTranslation();

  const handlePrint = (item: HistoryItem) => {
    api.printPdf(item.type === 'sale' ? 'sale' : 'work-order', item.id);
  };

  const toggleExpand = (key: string) => {
    setExpandedId(expandedId === key ? null : key);
  };

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <MaterialIcon icon="history" size={20} wght={400} style={{ color: C.primary }} />
            <h1 className="text-lg font-bold tracking-tight" style={{ color: C.text }}>
              {t('history.title')}
            </h1>
          </div>
          <p className="text-xs" style={{ color: C.textSec }}>{t('history.subtitle')}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
          style={{ backgroundColor: C.hover, color: C.textSec, border: `1px solid ${C.border}` }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.border; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
        >
          <MaterialIcon icon="refresh" size={14} wght={400} />
          {t('history.refresh')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <MaterialIcon icon="search" size={16} wght={400} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textSec }} />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('history.searchPlaceholder')}
            style={{
              backgroundColor: C.surface,
              border: `1px solid var(--c-border-input)`,
              color: C.text,
              paddingLeft: 36,
            }}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-150"
            onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = '0 0 0 3px var(--c-primary-12)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          style={{
            backgroundColor: C.surface,
            border: `1px solid var(--c-border-input)`,
            color: C.textSec,
          }}
          className="rounded-lg px-3 py-2.5 text-xs outline-none transition-all duration-150 w-full md:w-44"
          onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
        >
          <option value="">{t('history.allTypes')}</option>
          <option value="sale">{t('history.salesOnly')}</option>
          <option value="repair">{t('history.repairsOnly')}</option>
        </select>
      </div>

      {/* History items */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : data?.items.map(item => {
          const key = `${item.type}-${item.id}`;
          const isExpanded = expandedId === key;
          const st = statusStyle(item.status);
          return (
            <div
              key={key}
              onClick={() => toggleExpand(key)}
              className="rounded-xl transition-all duration-150 cursor-pointer"
              style={{
                backgroundColor: C.surface,
                border: `1px solid ${C.border}`,
              }}
              onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.borderColor = C.primary + '40'; }}
              onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.borderColor = C.border; }}
            >
              {/* Collapsed row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Type badge */}
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap"
                    style={{
                      backgroundColor: item.type === 'sale' ? 'var(--c-success-soft)' : 'var(--c-primary-soft)',
                      color: item.type === 'sale' ? C.success : C.primary,
                    }}
                  >
                    <MaterialIcon icon={item.type === 'sale' ? 'receipt' : 'build'} size={12} wght={400} />
                    {item.type === 'sale' ? t('history.sale') : t('history.repair')}
                  </span>
                  {/* ID + Customer */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold" style={{ color: C.text }}>#{item.id}</span>
                    <span className="text-xs truncate" style={{ color: C.textSec }}>{item.customer_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Amount */}
                  <span className="text-sm font-bold tabular-nums" style={{ color: C.primary }}>
                    ${item.total.toFixed(2)}
                  </span>
                  {/* Status badge */}
                  <span
                    className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap"
                    style={{ backgroundColor: st.bg, color: st.color }}
                  >
                    {item.status}
                  </span>
                  {/* Expand icon */}
                  <MaterialIcon
                    icon={isExpanded ? 'expand_less' : 'expand_more'}
                    size={16} wght={300}
                    style={{ color: C.textSec }}
                  />
                </div>
              </div>

              {/* Date + payment on collapsed */}
              {!isExpanded && (
                <div className="flex items-center gap-3 px-4 pb-3 text-[11px]" style={{ color: C.textSec }}>
                  <span className="flex items-center gap-1">
                    <MaterialIcon icon="calendar_today" size={12} wght={300} />
                    {formatDate(item.created_at)}
                  </span>
                  {item.payment_method && (
                    <span className="flex items-center gap-1">
                      <MaterialIcon icon="credit_card" size={12} wght={300} />
                      {t('history.payment', { method: item.payment_method })}
                    </span>
                  )}
                </div>
              )}

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${C.divider}` }}>
                  {/* Date + payment in expanded */}
                  <div className="flex items-center gap-3 px-4 py-2.5 text-[11px]" style={{ color: C.textSec }}>
                    <span className="flex items-center gap-1">
                      <MaterialIcon icon="calendar_today" size={12} wght={300} />
                      {formatDate(item.created_at)}
                    </span>
                    {item.payment_method && (
                      <span className="flex items-center gap-1">
                        <MaterialIcon icon="credit_card" size={12} wght={300} />
                        {t('history.payment', { method: item.payment_method })}
                      </span>
                    )}
                  </div>

                  <div className="px-4 pb-4 flex flex-col gap-3 text-xs">
                    {item.type === 'sale' ? (
                      <>
                        {/* Sale items */}
                        <div>
                          <span className="text-[11px] font-semibold" style={{ color: C.textSec }}>
                            {t('history.items')}
                          </span>
                          <div className="flex flex-col gap-1 mt-1.5">
                            {(item.data as Sale).items.map(si => (
                              <div
                                key={si.id}
                                className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                                style={{ borderBottom: `1px solid ${C.divider}` }}
                              >
                                <span style={{ color: C.text }}>
                                  {(si as any).product?.name || `Product #${si.product_id}`}
                                  <span className="ml-1" style={{ color: C.textSec }}>×{si.quantity}</span>
                                </span>
                                <span className="font-semibold" style={{ color: C.text }}>
                                  ${si.subtotal.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Discount */}
                        {(item.data as Sale).discount > 0 && (
                          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--c-danger-soft)' }}>
                            <MaterialIcon icon="local_offer" size={13} wght={400} style={{ color: C.danger }} />
                            <span className="text-xs font-semibold" style={{ color: C.danger }}>
                              {t('history.discount', { amount: (item.data as Sale).discount.toFixed(2) })}
                            </span>
                          </div>
                        )}

                        {/* Sale actions */}
                        <div className="flex gap-2 mt-1">
                          <ActionButton
                            icon="print"
                            label={t('history.reprintPdf')}
                            onClick={(e) => { e.stopPropagation(); handlePrint(item); }}
                            color={C.primary}
                          />
                          <ActionButton
                            icon="chat"
                            label={t('history.whatsapp')}
                            onClick={(e) => { e.stopPropagation(); api.sharePdfOnWhatsApp('sale', item.id, `Sale #${item.id} - Receipt`); }}
                            color={C.success}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Work order details */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <Field label={t('history.device')} value={[(item.data as WorkOrder).brand, (item.data as WorkOrder).model].filter(Boolean).join(' ')} />
                          <Field label={t('history.defect')} value={(item.data as WorkOrder).desperfecto} />
                          {(item.data as WorkOrder).diagnostico && (
                            <div className="col-span-2">
                              <Field label={t('history.diagnosis')} value={(item.data as WorkOrder).diagnostico} />
                            </div>
                          )}
                        </div>

                        {/* Financial summary */}
                        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--c-hover)' }}>
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textSec }}>
                              {t('history.total')}
                            </span>
                            <div className="text-sm font-bold mt-0.5" style={{ color: C.text }}>
                              ${(item.data as WorkOrder).total_cost.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textSec }}>
                              {t('history.paid')}
                            </span>
                            <div className="text-sm font-bold mt-0.5" style={{ color: C.success }}>
                              ${(item.data as WorkOrder).amount_paid.toFixed(2)}
                            </div>
                          </div>
                          <div className="col-span-2 pt-2" style={{ borderTop: `1px solid ${C.divider}` }}>
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textSec }}>
                              {t('history.balanceLabel')}
                            </span>
                            <div className="text-sm font-bold mt-0.5" style={{ color: C.danger }}>
                              ${((item.data as WorkOrder).total_cost - (item.data as WorkOrder).amount_paid).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Security info */}
                        {(item.data as WorkOrder).security_type && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: 'var(--c-primary-soft)' }}>
                            <MaterialIcon icon="lock" size={14} wght={400} style={{ color: C.primary }} />
                            <span className="text-xs font-semibold" style={{ color: C.primary }}>
                              {t('history.deviceSecurity')}:
                            </span>
                            <span className="text-xs font-mono" style={{ color: C.text }}>
                              {(item.data as WorkOrder).security_value}
                            </span>
                          </div>
                        )}

                        {/* Transfer history */}
                        {(item.data as WorkOrder).assignments?.length > 0 && (
                          <div>
                            <span className="text-[11px] font-semibold" style={{ color: C.textSec }}>
                              {t('history.transferHistory')}
                            </span>
                            <div className="flex flex-col gap-1 mt-1.5">
                              {(item.data as WorkOrder).assignments.map(a => (
                                <div
                                  key={a.id}
                                  className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px]"
                                  style={{ backgroundColor: 'var(--c-hover)' }}
                                >
                                  <MaterialIcon icon="swap_horiz" size={13} wght={300} style={{ color: C.textSec }} />
                                  <span style={{ color: C.text }}>
                                    {a.from_employee?.name || 'Intake'}
                                  </span>
                                  <MaterialIcon icon="arrow_forward" size={12} wght={300} style={{ color: C.textSec }} />
                                  <span style={{ color: C.text }}>{a.to_employee.name}</span>
                                  {a.reason && (
                                    <span className="italic" style={{ color: C.textSec }}>: "{a.reason}"</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Work order actions */}
                        <div className="flex gap-2 mt-1">
                          <ActionButton
                            icon="print"
                            label={t('history.printWorkOrder')}
                            onClick={(e) => { e.stopPropagation(); handlePrint(item); }}
                            color={C.primary}
                          />
                          <ActionButton
                            icon="chat"
                            label={t('history.whatsapp')}
                            onClick={(e) => { e.stopPropagation(); api.sharePdfOnWhatsApp('work-order', item.id, `Work Order #${item.id}`); }}
                            color={C.success}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {!isLoading && !data?.items.length && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <MaterialIcon icon="history" size={40} wght={200} style={{ color: 'var(--c-muted)' }} />
            <span className="text-sm" style={{ color: C.textSec }}>{t('history.noRecords')}</span>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > data.limit && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-30"
            style={{
              backgroundColor: C.surface,
              border: `1px solid ${C.border}`,
              color: C.textSec,
            }}
            onMouseEnter={e => { if (page > 1) e.currentTarget.style.backgroundColor = C.hover; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.surface; }}
          >
            <MaterialIcon icon="chevron_left" size={14} wght={400} />
            {t('history.previous')}
          </button>
          <span className="text-xs" style={{ color: C.textSec }}>
            {t('history.page', { page: data.page, total: Math.ceil(data.total / data.limit) })}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(data.total / data.limit)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-30"
            style={{
              backgroundColor: C.surface,
              border: `1px solid ${C.border}`,
              color: C.textSec,
            }}
            onMouseEnter={e => { if (page < Math.ceil(data.total / data.limit)) e.currentTarget.style.backgroundColor = C.hover; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.surface; }}
          >
            {t('history.next')}
            <MaterialIcon icon="chevron_right" size={14} wght={400} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────── */

function Field({ label, value }: { label: string; value: string | undefined }) {
  const C_local = {
    text: 'var(--c-text)',
    textSec: 'var(--c-text-sec)',
  };
  return (
    <div>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C_local.textSec }}>
        {label}
      </span>
      <div className="text-sm mt-0.5" style={{ color: C_local.text }}>{value}</div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, color }: { icon: string; label: string; onClick: (e: React.MouseEvent) => void; color: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg text-[10px] font-semibold transition-all duration-150"
      style={{
        backgroundColor: hovered ? color + '18' : 'var(--c-hover)',
        color: hovered ? color : 'var(--c-text-sec)',
        border: '1px solid transparent',
        borderColor: hovered ? color + '30' : 'var(--c-border)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MaterialIcon icon={icon} size={14} wght={400} />
      {label}
    </button>
  );
}
