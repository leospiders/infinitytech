import { useState, useEffect } from 'react';
import { useDashboardMetrics, usePartialReport, useReportPeriods, useReport, useEmployees } from '../../hooks/useApiQueries';
import { useAuthStore } from '../../stores/authStore';
import { CardSkeleton, TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';

/* ─── Color palette — via CSS vars (light/dark aware) ── */
const COLORS = {
  bg: 'var(--c-bg)',
  surface: 'var(--c-surface)',
  surfaceHover: 'var(--c-hover)',
  primary: 'var(--c-primary)',
  success: 'var(--c-success)',
  warning: 'var(--c-warning)',
  textPrimary: 'var(--c-text)',
  textSecondary: 'var(--c-text-sec)',
  border: 'var(--c-border)',
} as const;

/* ─── Helpers ─────────────────────────────────────────── */

function getWeekNumber(d: Date): number {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
}

function Greeting({ lang }: { lang: string }) {
  const hour = new Date().getHours();
  const isMorning = hour < 12;
  const isAfternoon = hour < 18;

  if (lang === 'es') {
    return <>{isMorning ? 'Buenos días' : isAfternoon ? 'Buenas tardes' : 'Buenas noches'}</>;
  }
  return <>{isMorning ? 'Good morning' : isAfternoon ? 'Good afternoon' : 'Good evening'}</>;
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initial = name?.charAt(0).toUpperCase() || '?';
  const colorIndex = name ? name.charCodeAt(0) % 3 : 0;
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: `var(--c-avatar-bg-${colorIndex})`,
        color: `var(--c-avatar-text-${colorIndex})`,
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(Math.min(value, 100)), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--c-divider)' }}>
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${width}%`,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}40`,
        }}
      />
    </div>
  );
}

/* ─── KPI Card ──────────────────────────────────────── */

function KpiCard({
  icon,
  title,
  value,
  subtitle,
  progress,
  progressColor,
}: {
  icon: string;
  title: string;
  value: string;
  subtitle?: string;
  progress: number;
  progressColor: string;
}) {
  return (
    <div
      className="group relative rounded-xl p-5 flex flex-col overflow-hidden transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: COLORS.surface,
        border: '1px solid var(--c-border)',
        borderLeft: 'var(--c-kpi-border)',
        boxShadow: 'var(--c-kpi-shadow)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--c-primary-40)';
        e.currentTarget.style.boxShadow = '0 8px 30px var(--c-primary-15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Icon background */}
      <div className="absolute top-3 right-3 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-200">
        <MaterialIcon icon={icon} wght={300} size={56} />
      </div>

      <span className="text-xs font-medium mb-2" style={{ color: COLORS.textSecondary }}>
        {title}
      </span>

      <span className="text-[28px] font-bold tracking-tight" style={{ color: COLORS.textPrimary, fontFamily: '"Space Grotesk", sans-serif' }}>
        {value}
      </span>

      {subtitle && (
        <span className="text-xs mt-1 mb-4" style={{ color: COLORS.textSecondary }}>
          {subtitle}
        </span>
      )}

      {!subtitle && <div className="mt-auto mb-3" />}

      <ProgressBar value={progress} color={progressColor} />
    </div>
  );
}

/* ─── Quick Action Button ───────────────────────────── */

function QuickAction({
  icon,
  title,
  description,
  primary,
  onClick,
  disabled,
}: {
  icon: string;
  title: string;
  description: string;
  primary?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex items-center justify-between w-full rounded-xl p-4 transition-all duration-200 disabled:opacity-50"
      style={{
        backgroundColor: primary ? 'var(--c-primary)' : 'var(--c-surface)',
        border: primary ? '1px solid var(--c-primary)' : '1px solid var(--c-border)',
      }}
      onMouseEnter={(e) => {
        if (!primary) {
          e.currentTarget.style.borderColor = 'var(--c-primary-40)';
          e.currentTarget.style.backgroundColor = 'var(--c-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!primary) {
          e.currentTarget.style.borderColor = COLORS.border;
          e.currentTarget.style.backgroundColor = COLORS.surface;
        }
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <MaterialIcon
          icon={icon}
          wght={primary ? 400 : 300}
          size={20}
          style={{ color: primary ? '#0F1115' : COLORS.textSecondary }}
        />
        <div className="flex flex-col items-start min-w-0">
          <span
            className="text-sm font-semibold truncate w-full text-left"
            style={{ color: primary ? '#0F1115' : COLORS.textPrimary }}
          >
            {title}
          </span>
          <span
            className="text-[11px] mt-0.5 truncate w-full text-left"
            style={{ color: primary ? 'rgba(15,17,21,0.6)' : 'var(--c-text-sec)' }}
          >
            {description}
          </span>
        </div>
      </div>

      <MaterialIcon
        icon="chevron_right"
        wght={primary ? 400 : 300}
        size={18}
        className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
        style={{ color: primary ? 'var(--c-text-sec)' : 'var(--c-muted)' }}
      />
    </button>
  );
}

/* ════════════════════════════════════════════════════════
   DASHBOARD VIEW
   ════════════════════════════════════════════════════════ */

export function DashboardView() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isTech = user?.role === 'TECH_IT' || user?.role === 'TECH_COM';
  const { t } = useTranslation();

  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Language state
  const [currentLang, setCurrentLang] = useState(() => {
    const saved = localStorage.getItem('i18nextLng');
    if (saved) return saved;
    const browserLang = navigator.language.split('-')[0];
    return ['es', 'en'].includes(browserLang) ? browserLang : 'es';
  });

  const handleLanguageChange = () => {
    const newLang = currentLang === 'es' ? 'en' : 'es';
    void i18n.changeLanguage(newLang);
    setCurrentLang(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  // Admin: optional technician filter
  const [techFilter, setTechFilter] = useState<number | undefined>(undefined);
  const { data: employees } = useEmployees(true);

  const { data: metrics, isLoading, refetch } = useDashboardMetrics(
    isAdmin ? techFilter : undefined,
  );

  const reportMutation = usePartialReport();
  const { data: periods } = useReportPeriods();
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const { data: selectedReport } = useReport(selectedPeriod);

  // Default to most recent period; auto-select new top period when list changes
  useEffect(() => {
    if (periods && periods.length > 0) {
      if (!selectedPeriod) {
        setSelectedPeriod(periods[0].label);
      } else if (periods[0].label !== selectedPeriod && periods.some(p => p.label === selectedPeriod)) {
        /* keep existing selection if it's still in the list */
      } else {
        // current selection no longer exists — pick the newest
        setSelectedPeriod(periods[0].label);
      }
    }
  }, [periods]);

  const handlePartialReport = async () => {
    if (!window.confirm(t('dashboard.confirmPartial', '¿Guardar reporte parcial? No reinicia el período.'))) return;
    try {
      await reportMutation.mutateAsync();
    } catch {
      /* empty */
    }
  };

  const roleLabel = isAdmin ? 'Admin' : isTech ? 'Technician' : 'Operator';

  /* ─── Loading state ─── */
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  /* ─── Computed metrics for progress bars ─── */
  const maxRevenue = Math.max(metrics?.revenue_today ?? 1, 1);
  const revenuePct = metrics ? Math.min((metrics.revenue_today / maxRevenue) * 100, 100) : 0;
  const repairsPct = metrics ? Math.min((metrics.repairs_revenue_today / maxRevenue) * 100, 100) : 0;
  const salesPct = metrics ? Math.min((metrics.sales_today / maxRevenue) * 100, 100) : 0;

  /* ─── Render ── */
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* ════════════════ HEADER ════════════════ */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left */}
        <div>
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase mb-2"
            style={{
              backgroundColor: 'var(--c-primary-8)',
              color: COLORS.primary,
            }}
          >
            <MaterialIcon icon="verified" wght={400} size={12} />
            {roleLabel} Portal v4.2.0
          </div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: COLORS.textPrimary, fontFamily: '"Space Grotesk", sans-serif' }}
          >
            <Greeting lang={currentLang} />, {user?.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: COLORS.textSecondary }}>
            {t(isTech ? 'dashboard.subtitleTech' : 'dashboard.subtitleAdmin', { name: user?.name })}
          </p>
        </div>

        {/* Right: actions bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Current Date & Time */}
          <div
            className="flex items-center gap-2 px-3 py-[9px] rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: 'var(--c-primary-8)',
              border: '1px solid var(--c-primary-30)',
              color: COLORS.primary,
              boxShadow: '0 0 10px var(--c-primary-8)',
            }}
          >
            <MaterialIcon icon="schedule" wght={500} size={14} className="animate-pulse" />
            <span style={{ fontFamily: '"Space Grotesk", sans-serif', letterSpacing: '0.02em' }}>
              {(() => {
                const weekNum = getWeekNumber(currentDateTime);
                const hours = String(currentDateTime.getHours()).padStart(2, '0');
                const minutes = String(currentDateTime.getMinutes()).padStart(2, '0');
                const label = currentLang === 'es' ? 'Semana' : 'Week';
                return `${label} ${weekNum} • ${hours}:${minutes}`;
              })()}
            </span>
          </div>

          {/* System Status */}
          <div
            className="flex items-center gap-2 px-3 py-[9px] rounded-lg text-xs font-medium"
            style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--c-success)', boxShadow: '0 0 6px var(--c-success-60)' }}
            />
            <span style={{ color: COLORS.textSecondary }}>Online</span>
          </div>

          {/* Tech filter */}
          {isAdmin && (
            <select
              value={techFilter ?? ''}
              onChange={(e) => setTechFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="rounded-lg px-3 py-[9px] text-xs font-medium outline-none cursor-pointer"
              style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textPrimary,
              }}
            >
              <option value="" style={{ backgroundColor: COLORS.surface }}>{t('dashboard.allTechnicians')}</option>
              {employees
                ?.filter((e) => e.role === 'TECH_IT' || e.role === 'TECH_COM')
                .map((emp) => (
                  <option key={emp.id} value={emp.id} style={{ backgroundColor: COLORS.surface }}>
                    {emp.name}
                  </option>
                ))}
            </select>
          )}

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-[9px] text-xs font-medium transition-all duration-200"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textSecondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--c-primary-40)';
              e.currentTarget.style.color = 'var(--c-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.color = COLORS.textSecondary;
            }}
          >
            <MaterialIcon icon="refresh" wght={400} size={14} />
            {t('dashboard.refresh')}
          </button>

          {/* Language */}
          <button
            onClick={handleLanguageChange}
            className="flex items-center gap-1.5 rounded-lg px-3 py-[9px] text-xs font-medium transition-all duration-200 uppercase"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textSecondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--c-primary-40)';
              e.currentTarget.style.color = 'var(--c-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.color = COLORS.textSecondary;
            }}
            title={currentLang === 'es' ? 'English' : 'Español'}
          >
            <MaterialIcon icon="language" wght={400} size={14} />
            {currentLang}
          </button>
        </div>
      </header>

      {/* ════════════════ KPI CARDS ════════════════ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <KpiCard
          icon="account_balance_wallet"
          title={t(isTech ? 'dashboard.myRevenue' : 'dashboard.combinedRevenue')}
          value={`$${metrics?.revenue_today.toFixed(2)}`}
          progress={revenuePct}
          progressColor={COLORS.primary}
        />

        <KpiCard
          icon="build"
          title={t(isTech ? 'dashboard.myRepairs' : 'dashboard.completedRepairs')}
          value={`$${metrics?.repairs_revenue_today.toFixed(2)}`}
          subtitle={t('dashboard.repairs', { count: metrics?.repairs_today ?? 0 })}
          progress={repairsPct}
          progressColor={COLORS.success}
        />

        <KpiCard
          icon="shopping_cart"
          title={t(isTech ? 'dashboard.mySales' : 'dashboard.salesRevenue')}
          value={`$${metrics?.sales_today.toFixed(2)}`}
          subtitle={t('dashboard.itemsSold', { count: metrics?.sales_items_count ?? 0 })}
          progress={salesPct}
          progressColor={COLORS.warning}
        />
      </section>

      {/* ════════════════ BOTTOM SECTION ════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ─── Quick Actions ─── */}
        <aside className="lg:col-span-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--c-text-section)' }}>
            {t('dashboard.quickActions', 'Acciones rápidas')}
          </h3>

          <QuickAction
            icon="add_shopping_cart"
            title={t('dashboard.newWholesale', 'Nuevo Pedido Mayorista')}
            description={t('dashboard.wholesaleDesc', 'Crear una orden para distribuidor')}
            primary
          />

          {isAdmin && (
            <QuickAction
              icon="assessment"
              title={reportMutation.isPending ? t('dashboard.saving') : t('dashboard.partialReport', 'Reporte Parcial')}
              description={t('dashboard.partialDesc', 'Guardar reporte sin reiniciar el período')}
              onClick={handlePartialReport}
              disabled={reportMutation.isPending}
            />
          )}

          {/* Tech: Top Products as inline card */}
          {!isAdmin && metrics?.top_sold_products && metrics.top_sold_products.length > 0 && (
            <div
              className="rounded-xl p-4 mt-1 flex flex-col gap-2"
              style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <span className="text-xs font-semibold" style={{ color: COLORS.textSecondary }}>
                {t(isTech ? 'dashboard.myTopProducts' : 'dashboard.topProducts')}
              </span>
              {metrics.top_sold_products.slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs truncate" style={{ color: COLORS.textPrimary }}>
                    {p.name}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ml-2"
                    style={{ backgroundColor: 'var(--c-primary-18)', color: 'var(--c-primary)' }}
                  >
                    {p.quantity} vendidos
                  </span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ─── Recent Activity ─── */}
        <section className="lg:col-span-8 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--c-text-section)' }}>
            {t('dashboard.recentActivity', 'Actividad Reciente')}
          </h3>

          {/* Admin: Employee Performance table */}
          {isAdmin && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ backgroundColor: 'var(--c-surface-alt)' }}>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: COLORS.textSecondary }}>
                      {t('dashboard.employee')}
                    </th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: COLORS.textSecondary }}>
                      {t('dashboard.role')}
                    </th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: COLORS.textSecondary }}>
                      {t('dashboard.weeklySales')}
                    </th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: COLORS.textSecondary }}>
                      {t('dashboard.repairsRevenue')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.employee_activity?.map((emp, i) => (
                    <tr
                      key={i}
                      className="transition-colors duration-150"
                      style={{
                        borderTop: '1px solid var(--c-divider)',
                        backgroundColor: i % 2 !== 0 ? 'var(--c-table-stripe)' : 'transparent',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--c-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = i % 2 !== 0 ? 'var(--c-table-stripe)' : 'transparent'; }}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={emp.name} />
                          <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                            {emp.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs" style={{ color: COLORS.textSecondary }}>
                        {emp.role}
                      </td>
                      <td className="py-3.5 px-4 text-right text-sm font-medium tabular-nums" style={{ color: COLORS.success }}>
                        ${emp.sales_total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-sm font-medium tabular-nums" style={{ color: COLORS.primary }}>
                        ${emp.repairs_revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!metrics?.employee_activity || metrics.employee_activity.length === 0) && (
                <div className="py-8 text-center text-xs" style={{ color: COLORS.textSecondary }}>
                  {t('dashboard.noEmployeeActivity')}
                </div>
              )}
            </div>
          )}

          {/* Tech: Top products list */}
          {!isAdmin && metrics?.top_sold_products && metrics.top_sold_products.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <div className="py-3.5 px-4 text-xs font-semibold" style={{ color: COLORS.textSecondary }}>
                {t(isTech ? 'dashboard.myTopProducts' : 'dashboard.topProducts')}
              </div>
              <div className="divide-y" style={{ borderTop: '1px solid var(--c-divider)' }}>
                {metrics.top_sold_products.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-3 px-4 transition-colors duration-150"
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--c-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate" style={{ color: COLORS.textPrimary }}>
                        {p.name}
                      </span>
                      <span className="text-[10px]" style={{ color: COLORS.textSecondary }}>
                        {p.sku}
                      </span>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded shrink-0 ml-2"
                      style={{ backgroundColor: 'var(--c-primary-18)', color: 'var(--c-primary)' }}
                    >
                      {t('dashboard.sold', { count: p.quantity })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tech: empty state */}
          {!isAdmin && (!metrics?.top_sold_products || metrics.top_sold_products.length === 0) && (
            <div
              className="rounded-xl py-12 text-center flex flex-col items-center gap-3"
              style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <MaterialIcon icon="history" wght={300} size={40} style={{ color: 'var(--c-border)' }} />
              <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                {t('dashboard.noSaleItems')}
              </span>
            </div>
          )}
        </section>
      </div>

      {/* ════════════════ REPORT VIEWER (admin) ════════════════ */}
      {isAdmin && (
        <section
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        >
          <div className="py-3.5 px-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textSecondary }}>
              {t('dashboard.reportViewer', 'Visor de Reportes')}
            </span>
            <select
              value={selectedPeriod ?? ''}
              onChange={(e) => setSelectedPeriod(e.target.value || null)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--c-bg)',
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textPrimary,
              }}
            >
              {(periods ?? []).map((p) => (
                <option key={p.label} value={p.label} style={{ backgroundColor: 'var(--c-bg)' }}>
                  {p.label} {p.is_definitive ? '✓' : '(parcial)'}
                </option>
              ))}
            </select>
          </div>

          {selectedReport && (
            <div className="px-4 pb-1 flex gap-4 text-xs" style={{ color: COLORS.textSecondary }}>
              <span>{t('dashboard.totalSales', 'Total Ventas')}: <b style={{ color: COLORS.success }}>${selectedReport.total_sales.toFixed(2)}</b></span>
              <span>{t('dashboard.totalRepairs', 'Total Reparaciones')}: <b style={{ color: COLORS.primary }}>{selectedReport.total_repairs}</b></span>
            </div>
          )}

          <div className="overflow-x-auto max-h-72 overflow-y-auto" style={{ borderTop: '1px solid var(--c-divider)' }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ backgroundColor: 'var(--c-surface-alt)' }}>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: COLORS.textSecondary }}>
                    {t('dashboard.employee')}
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: COLORS.textSecondary }}>
                    {t('dashboard.role')}
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: COLORS.textSecondary }}>
                    {t('dashboard.sales')}
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: COLORS.textSecondary }}>
                    {t('dashboard.repairs')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedReport?.employees.map((s) => (
                  <tr
                    key={s.id}
                    className="transition-colors duration-150"
                    style={{ borderTop: '1px solid var(--c-divider)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--c-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.employee.name} size={28} />
                        <span className="text-sm" style={{ color: COLORS.textPrimary }}>
                          {s.employee.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs" style={{ color: COLORS.textSecondary }}>
                      {s.employee.role}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium tabular-nums" style={{ color: COLORS.success }}>
                      ${s.total_sales.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium tabular-nums" style={{ color: COLORS.primary }}>
                      {s.completed_repairs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!selectedReport || selectedReport.employees.length === 0) && (
              <div className="py-8 text-center text-xs" style={{ color: COLORS.textSecondary }}>
                {periods && periods.length > 0 ? t('dashboard.noReportData', 'Seleccioná un período') : t('dashboard.noReportsYet', 'No hay reportes aún')}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
