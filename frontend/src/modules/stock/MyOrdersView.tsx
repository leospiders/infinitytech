import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMyWorkOrders } from '../../hooks/useApiQueries';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';

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
} as const;

const STATUS_OPTIONS = ['', 'progreso', 'listo', 'entregado'];

/* ─── Status badge colors ──────────────────────────── */
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  progreso: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  listo: { color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  entregado: { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
};

/* ════════════════════════════════════════════════════ */

export function MyOrdersView() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useMyWorkOrders(search, status, page);
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <MaterialIcon icon="assignment" size={20} wght={400} style={{ color: C.primary }} />
            <h1 className="text-lg font-bold tracking-tight" style={{ color: C.text }}>{t('myOrders.title')}</h1>
          </div>
          <p className="text-xs" style={{ color: C.textSec }}>{t('myOrders.subtitle')}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
          style={{ backgroundColor: C.hover, color: C.textSec, border: `1px solid ${C.border}` }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.border; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
        >
          <MaterialIcon icon="refresh" size={14} wght={300} />
          {t('stock.refresh')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <MaterialIcon icon="search" size={16} wght={300} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textSec }} />
          <input
            type="text"
            placeholder={t('myOrders.searchPlaceholder')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
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
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{
            backgroundColor: C.surface,
            border: `1px solid var(--c-border-input)`,
            color: C.textSec,
          }}
          className="rounded-lg px-3 py-2.5 text-xs outline-none transition-all duration-150 w-full sm:w-44"
          onFocus={e => { e.currentTarget.style.borderColor = C.primary; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; }}
        >
          <option value="">{t('myOrders.allStatus')}</option>
          {STATUS_OPTIONS.filter(Boolean).map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['#', t('myOrders.customer'), t('myOrders.device'), t('myOrders.status'), t('myOrders.date')].map((h, i) => (
                    <th key={i} className="px-4 py-3 font-medium" style={{ color: C.textSec, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.items.map(wo => {
                  const sc = STATUS_COLORS[wo.status] || { color: C.textSec, bg: C.hover };
                  return (
                    <tr
                      key={wo.id}
                      className="transition-colors duration-150"
                      style={{ borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.hover; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-mono font-semibold tabular-nums"
                          style={{ backgroundColor: C.hover, color: C.text }}>
                          #{wo.id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-sm font-semibold" style={{ color: C.text }}>{wo.customer_name}</div>
                        <div className="text-xs mt-0.5" style={{ color: C.textSec }}>{wo.phone_number}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-sm font-semibold" style={{ color: C.primary }}>{wo.brand} {wo.model}</div>
                        {wo.imei && <div className="text-xs mt-0.5 font-mono" style={{ color: C.textSec }}>IMEI: {wo.imei}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: sc.bg, color: sc.color }}
                        >
                          {wo.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs" style={{ color: C.textSec }}>
                        {new Date(wo.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!data?.items.length && (
            <div className="flex flex-col items-center gap-2 py-12" style={{ color: C.textSec }}>
              <MaterialIcon icon="build" size={40} wght={300} style={{ color: C.primary, opacity: 0.3 }} />
              <span className="text-sm">{t('myOrders.empty')}</span>
            </div>
          )}
          {data && data.total > 20 && (
            <div className="flex justify-center gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-40"
                style={{ backgroundColor: C.hover, color: C.textSec, border: `1px solid ${C.border}` }}
                onMouseEnter={e => { if (page > 1) e.currentTarget.style.backgroundColor = C.border; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
              >
                <MaterialIcon icon="chevron_left" size={14} wght={300} />
              </button>
              <span className="flex items-center text-xs font-semibold" style={{ color: C.textSec }}>
                {page} / {Math.ceil(data.total / 20)}
              </span>
              <button
                disabled={page >= Math.ceil(data.total / 20)}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-40"
                style={{ backgroundColor: C.hover, color: C.textSec, border: `1px solid ${C.border}` }}
                onMouseEnter={e => { if (page < Math.ceil(data.total / 20)) e.currentTarget.style.backgroundColor = C.border; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
              >
                <MaterialIcon icon="chevron_right" size={14} wght={300} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
