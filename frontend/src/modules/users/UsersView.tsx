import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEmployees, usePendingEmployees, useApprovePendingEmployee, useRejectPendingEmployee, useDeleteEmployee } from '../../hooks/useApiQueries';
import { useAuthStore } from '../../stores/authStore';
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

/* ─── Available roles ────────────────────────────── */
const ROLES = [
  { value: 'ADMIN', label: 'ADMIN', color: '#FFC107', bg: 'var(--c-warning-12)' },
  { value: 'TECH_IT', label: 'TÉCNICO', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  { value: 'TECH_COM', label: 'TECH_COM (repuestos)', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
] as const;

/* ─── Role badge color ──────────────────────────── */
function roleBadgeStyle(role: string) {
  switch (role) {
    case 'ADMIN': return { color: '#FFC107', bg: 'var(--c-warning-12)' };
    case 'TECH_COM': return { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' };
    case 'TECH_IT': return { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' };
    default: return { color: '#22C55E', bg: 'var(--c-success-12)' };
  }
}

/* ─── Confirm Modal (delete) ──────────────────────── */
function ConfirmModal({
  open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="rounded-xl p-5 max-w-sm w-full flex flex-col gap-4"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--c-danger-18)' }}
          >
            <MaterialIcon icon="warning" size={18} wght={400} style={{ color: C.danger }} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold" style={{ color: C.text }}>{title}</span>
            <span className="text-xs" style={{ color: C.textSec }}>{message}</span>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-150"
            style={{ backgroundColor: C.hover, color: C.textSec, border: `1px solid ${C.border}` }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.border; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-xs font-bold transition-all duration-150 disabled:opacity-60 flex items-center gap-1.5"
            style={{ backgroundColor: C.danger, color: C.text }}
          >
            {loading ? t('users.deleting') : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Reject Modal (with reason textarea) ────────────── */
function RejectModal({
  open, name, loading, onReject, onCancel,
}: {
  open: boolean;
  name: string;
  loading: boolean;
  onReject: (reason: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="rounded-xl p-5 max-w-sm w-full flex flex-col gap-4"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--c-danger-18)' }}
          >
            <MaterialIcon icon="cancel" size={18} wght={400} style={{ color: C.danger }} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold" style={{ color: C.text }}>
              {t('users.rejectUser', 'Rechazar usuario')}
            </span>
            <span className="text-xs" style={{ color: C.textSec }}>
              {t('users.rejectHint', '¿Rechazar a {name}?', { name })}
            </span>
          </div>
        </div>

        {/* Reason textarea */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textSec }}>
            {t('users.rejectionReason', 'Motivo (opcional)')}
          </span>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={t('users.rejectionPlaceholder', 'Ej: Documentación incompleta...')}
            rows={3}
            className="w-full rounded-lg py-2 px-3 text-xs outline-none transition-all duration-150 resize-none"
            style={{
              backgroundColor: C.hover,
              border: '1px solid var(--c-border-input)',
              color: C.text,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.boxShadow = '0 0 0 3px var(--c-danger-12)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-150"
            style={{ backgroundColor: C.hover, color: C.textSec, border: `1px solid ${C.border}` }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.border; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => onReject(reason)}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-xs font-bold transition-all duration-150 disabled:opacity-60 flex items-center gap-1.5"
            style={{ backgroundColor: C.danger, color: C.text }}
          >
            {loading ? (
              <>
                <MaterialIcon icon="hourglass_top" size={13} wght={400} />
                {t('users.rejecting', 'Rechazando...')}
              </>
            ) : (
              <>
                <MaterialIcon icon="cancel" size={13} wght={400} />
                {t('users.reject')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Approve Modal (with role picker) ─────────────── */
function ApproveModal({
  open, name, loading, onApprove, onCancel,
}: {
  open: boolean;
  name: string;
  loading: boolean;
  onApprove: (role: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [role, setRole] = useState('TECH_IT');
  if (!open) return null;

  const selected = ROLES.find(r => r.value === role)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="rounded-xl p-5 max-w-sm w-full flex flex-col gap-4"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--c-primary-soft)' }}
          >
            <MaterialIcon icon="how_to_reg" size={18} wght={400} style={{ color: C.primary }} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold" style={{ color: C.text }}>
              {t('users.approveUser', 'Aprobar usuario')}
            </span>
            <span className="text-xs" style={{ color: C.textSec }}>
              {t('users.approveRoleHint', 'Elegí el rol para {name}', { name })}
            </span>
          </div>
        </div>

        {/* Role picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textSec }}>
            {t('users.role', 'Rol')}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className="rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-150"
                style={{
                  backgroundColor: role === r.value ? r.bg : C.hover,
                  color: role === r.value ? r.color : C.textSec,
                  border: `1px solid ${role === r.value ? r.color + '40' : C.border}`,
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-150"
            style={{ backgroundColor: C.hover, color: C.textSec, border: `1px solid ${C.border}` }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.border; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.hover; }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => onApprove(role)}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-xs font-bold transition-all duration-150 disabled:opacity-60 flex items-center gap-1.5"
            style={{
              backgroundColor: selected.color,
              color: role === 'ADMIN' ? '#1F2937' : '#FFFFFF',
            }}
          >
            {loading ? (
              <>
                <MaterialIcon icon="hourglass_top" size={13} wght={400} />
                {t('users.approving', 'Aprobando...')}
              </>
            ) : (
              <>
                <MaterialIcon icon="check_circle" size={13} wght={400} />
                {t('users.approve')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════ */
export function UsersView({ showToast }: { showToast: (type: 'success' | 'error', message: string) => void }) {
  const { user: currentUser } = useAuthStore();
  const { data: employees, isLoading: empLoading } = useEmployees(false);
  const { data: pendingProfiles, isLoading: pendingLoading } = usePendingEmployees();

  const [search, setSearch] = useState('');
  const [filterPending, setFilterPending] = useState(false);
  const [approveTarget, setApproveTarget] = useState<{ uuid: string; name: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ uuid: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; email: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const approvePending = useApprovePendingEmployee();
  const rejectPending = useRejectPendingEmployee();
  const deleteEmployee = useDeleteEmployee();
  const { t } = useTranslation();

  /* ── Keyboard shortcut ── */
  const isModalOpen = !!deleteTarget || !!approveTarget || !!rejectTarget;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isModalOpen) return;
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isModalOpen]);

  /* ── Handlers ── */
  const handleApprove = async (role: string) => {
    if (!approveTarget) return;
    try {
      await approvePending.mutateAsync({ uuid: approveTarget.uuid, role });
      showToast('success', t('users.approved', { name: approveTarget.name }));
      setApproveTarget(null);
    } catch {
      showToast('error', t('users.approveFailed'));
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await rejectPending.mutateAsync({ uuid: rejectTarget.uuid, reason: reason || undefined });
      showToast('success', t('users.rejected', { name: rejectTarget.name }));
      setRejectTarget(null);
    } catch { showToast('error', t('users.rejectFailed')); }
  };

  const handleDelete = async (id: number) => {
    if (!deleteTarget) return;
    try {
      await deleteEmployee.mutateAsync(id);
      showToast('success', t('users.deleted', { name: deleteTarget.name }));
      setDeleteTarget(null);
    } catch { showToast('error', t('users.deleteFailed')); }
  };

  /* ── Merge employees + pending ── */
  const allUsers = useMemo(() => {
    const empList = employees ?? [];
    const pendingList = pendingProfiles ?? [];
    const active = empList.filter(e => e.is_active);
    const pendingFromEmp = empList.filter(e => !e.is_active);
    const pendingFromSupabase = pendingList
      .filter((p: PendingProfile) => !empList.some(e => e.email === p.email))
      .map((p: PendingProfile) => ({
        ...p,
        is_active: false,
        role: 'PENDING' as const,
      }));
    return [...active, ...pendingFromEmp, ...pendingFromSupabase];
  }, [employees, pendingProfiles]);

  const filteredRows = useMemo(() => {
    let rows = allUsers;
    if (filterPending) {
      const terminal = new Set(['REJECTED', 'SUSPENDED', 'DELETED']);
      rows = rows.filter(e => !e.is_active && !terminal.has((e as any).status));
    }
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(e =>
        e.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.role?.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [allUsers, filterPending, search]);

  const isLoading = empLoading || pendingLoading;
  const currentRole = currentUser?.role || '';
  const canManage = currentRole === 'ADMIN' || currentRole === 'TECH_IT';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <MaterialIcon icon="shield" size={20} wght={400} style={{ color: C.primary }} />
            <h1 className="text-lg font-bold" style={{ color: C.text }}>{t('users.title')}</h1>
          </div>
          <p className="text-xs" style={{ color: C.textSec }}>{t('users.subtitle')}</p>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <MaterialIcon icon="search" size={15} wght={400} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textSec }} />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('users.searchPlaceholder')}
            style={{
              backgroundColor: C.surface,
              border: '1px solid var(--c-border-input)',
              color: C.text,
              paddingLeft: 34,
            }}
            className="w-full rounded-lg py-2 text-xs outline-none transition-all duration-150"
            onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = '0 0 0 3px var(--c-primary-12)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Filter pills */}
        <button
          onClick={() => setFilterPending(false)}
          className="rounded-lg px-3 py-[7px] text-xs font-medium transition-all duration-150"
          style={{
            backgroundColor: !filterPending ? 'var(--c-primary-soft)' : C.hover,
            border: `1px solid ${!filterPending ? 'var(--c-primary-40)' : C.border}`,
            color: !filterPending ? C.primary : C.textSec,
          }}
        >
          {t('users.allUsers')}
        </button>
        <button
          onClick={() => setFilterPending(true)}
          className="rounded-lg px-3 py-[7px] text-xs font-medium transition-all duration-150"
          style={{
            backgroundColor: filterPending ? 'var(--c-primary-soft)' : C.hover,
            border: `1px solid ${filterPending ? 'var(--c-primary-40)' : C.border}`,
            color: filterPending ? C.primary : C.textSec,
          }}
        >
          {t('users.pending', { count: pendingProfiles?.length || 0 })}
        </button>
        <div className="flex-1" />
        {filterPending && (pendingProfiles?.length || 0) > 0 && (
          <span className="text-[10px] font-semibold" style={{ color: C.warning }}>
            {pendingProfiles?.length || 0} {t('users.pendingRequests', 'pending requests')}
          </span>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ backgroundColor: 'var(--c-surface-alt)' }}>
                  {['user', 'contact', 'role', 'status', 'actions'].map(col => (
                    <th
                      key={col}
                      className="text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{
                        color: C.textSec,
                        padding: '10px 16px',
                        textAlign: col === 'actions' ? 'right' : 'left',
                      }}
                    >
                      {col === 'user' ? t('users.name') : col === 'contact' ? t('users.contact') : col === 'role' ? t('users.role') : col === 'status' ? t('users.status') : t('users.actions')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {filteredRows.map((emp, idx) => {
                  const roleRgb = roleBadgeStyle(emp.role);
                  const isNewSignup = !!(emp as any).uuid && !emp.id && !emp.is_active;
                  const isSelf = currentUser?.email === emp.email;
                  const pendingUuid = (emp as any).uuid || (emp as any).id;
                  return (
                    <tr
                      key={emp.id || (emp as any).uuid || idx}
                      className="group transition-colors duration-150"
                      style={{ borderTop: idx > 0 ? '1px solid var(--c-divider)' : 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-table-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* Name + Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{
                              backgroundColor: isNewSignup ? 'var(--c-primary-soft)' : roleRgb.bg,
                              color: isNewSignup ? C.primary : roleRgb.color,
                            }}
                          >
                            {emp.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold truncate" style={{ color: C.text }}>
                              {emp.name || emp.email?.split('@')[0] || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 text-xs" style={{ color: C.textSec }}>
                          <div className="flex items-center gap-1.5">
                            <MaterialIcon icon="mail" size={13} wght={400} style={{ color: 'var(--c-muted)' }} />
                            <span>{emp.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MaterialIcon icon="call" size={13} wght={400} style={{ color: 'var(--c-muted)' }} />
                            <span>{emp.phone || '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {emp.role === 'PENDING' ? (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
                            style={{ backgroundColor: C.hover, color: C.textSec }}
                          >
                            —
                          </span>
                        ) : (
                          <span
                            className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
                            style={{ backgroundColor: roleRgb.bg, color: roleRgb.color }}
                          >
                            {emp.role}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isNewSignup ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{ backgroundColor: 'var(--c-success-soft)', color: C.success }}
                          >
                            <MaterialIcon icon="person_add" size={12} wght={400} />
                            Sin login
                          </span>
                        ) : (emp as any).status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{ backgroundColor: 'var(--c-danger-soft)', color: C.danger }}
                          >
                            <MaterialIcon icon="cancel" size={12} wght={400} />
                            Rechazado
                          </span>
                        ) : (emp as any).status === 'SUSPENDED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{ backgroundColor: 'var(--c-warning-soft)', color: C.warning }}
                          >
                            <MaterialIcon icon="block" size={12} wght={400} />
                            Suspendido
                          </span>
                        ) : (emp as any).status === 'DELETED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{ backgroundColor: 'var(--c-surface-alt)', color: C.textSec }}
                          >
                            <MaterialIcon icon="delete" size={12} wght={400} />
                            Eliminado
                          </span>
                        ) : emp.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{ backgroundColor: 'var(--c-success-soft)', color: C.success }}
                          >
                            <MaterialIcon icon="check_circle" size={12} wght={400} />
                            {t('users.active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold animate-pulse"
                            style={{ backgroundColor: 'var(--c-warning-soft)', color: C.warning }}
                          >
                            <MaterialIcon icon="schedule" size={12} wght={400} />
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Actions — hover */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-60 hover:opacity-100 transition-opacity duration-150">
                          {(emp.role === 'PENDING' || (emp as any).uuid) && canManage && !emp.is_active && (emp as any).status !== 'REJECTED' && (emp as any).status !== 'SUSPENDED' && (emp as any).status !== 'DELETED' && (
                            <>
                              <button
                                onClick={() => setApproveTarget({ uuid: pendingUuid, name: emp.name || emp.email })}
                                className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold transition-all duration-150"
                                style={{ color: C.success }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-success-soft)'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <MaterialIcon icon="check_circle" size={12} wght={400} />
                                {t('users.approve')}
                              </button>
                              <button
                                onClick={() => setRejectTarget({ uuid: pendingUuid, name: emp.name || emp.email })}
                                className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold transition-all duration-150"
                                style={{ color: C.danger }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-danger-soft)'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <MaterialIcon icon="cancel" size={12} wght={400} />
                                {t('users.reject')}
                              </button>
                            </>
                          )}
                          {!isNewSignup && emp.is_active && !isSelf && canManage && (
                            <button
                              onClick={() => setDeleteTarget({ id: emp.id as number, name: emp.name || emp.email, email: emp.email })}
                              className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold transition-all duration-150"
                              style={{ color: C.textSec }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-danger-soft)'; e.currentTarget.style.color = C.danger; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textSec; }}
                            >
                              <MaterialIcon icon="delete" size={12} wght={400} />
                              {t('users.delete')}
                            </button>
                          )}
                          {!isNewSignup && !emp.is_active && ['REJECTED', 'SUSPENDED', 'DELETED'].includes((emp as any).status) && !isSelf && canManage && (
                            <button
                              onClick={() => setDeleteTarget({ id: emp.id as number, name: emp.name || emp.email, email: emp.email })}
                              className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold transition-all duration-150"
                              style={{ color: C.textSec }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-danger-soft)'; e.currentTarget.style.color = C.danger; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textSec; }}
                            >
                              <MaterialIcon icon="delete" size={12} wght={400} />
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!filteredRows.length && (
            <div className="py-12 text-center flex flex-col items-center gap-2" style={{ color: C.textSec }}>
              <MaterialIcon icon="shield" size={36} wght={300} style={{ color: 'var(--c-primary-20)' }} />
              <span className="text-xs">{t('users.noUsers')}</span>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ApproveModal
        open={!!approveTarget}
        name={approveTarget?.name || ''}
        loading={approvePending.isPending}
        onApprove={handleApprove}
        onCancel={() => setApproveTarget(null)}
      />

      <RejectModal
        open={!!rejectTarget}
        name={rejectTarget?.name || ''}
        loading={rejectPending.isPending}
        onReject={handleReject}
        onCancel={() => setRejectTarget(null)}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title={t('users.deleteTitle', { defaultValue: 'Eliminar usuario' })}
        message={t('users.deleteMessage', { defaultValue: '¿Estás seguro de eliminar a {name}?', name: deleteTarget?.name || '' })}
        confirmLabel={t('users.delete')}
        loading={deleteEmployee.isPending}
        onConfirm={() => handleDelete(deleteTarget!.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/* ─── Types ────────────────────────────────────────── */
interface PendingProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  uuid: string;
}
