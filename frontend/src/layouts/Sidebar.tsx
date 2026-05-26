import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Wrench, Package, History,
  Sun, Moon, LogOut, Menu, X, Users,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useEmployees } from '../hooks/useApiQueries';

export type TabKey = 'dashboard' | 'pos' | 'repairs' | 'inventory' | 'history' | 'users';

export function Sidebar({
  activeTab, onTabChange, darkMode, onToggleTheme, onNewRepairOrder,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  onNewRepairOrder?: () => void;
}) {
  const { user, token, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const showUserManagement = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';

  const tabs: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'pos', label: 'POS Checkout', icon: ShoppingCart },
    { key: 'repairs', label: 'Technical Service', icon: Wrench },
    { key: 'inventory', label: 'Inventory', icon: Package },
    { key: 'history', label: 'History Log', icon: History },
    ...(showUserManagement ? [{ key: 'users' as TabKey, label: 'User Management', icon: Users }] : []),
  ];

  const nav = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand/25 shrink-0">
            ∞
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold tracking-wide leading-none truncate text-brand-deep">INFINITY</h2>
            <span className="text-[10px] font-semibold text-brand-secondary">TECHNOLOGY</span>
          </div>
        </div>
        <button onClick={onToggleTheme} className="neo-btn h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ml-2">
          {darkMode ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-brand" />}
        </button>
      </div>

      <div className="neo-card p-4 flex flex-col gap-1 border-l-4 border-l-brand mb-6">
        <span className="text-xs font-bold truncate">{user?.name}</span>
        <span className="text-[9px] text-muted tracking-widest">{user?.role}</span>
      </div>

      <nav className="flex flex-col gap-3 flex-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          key === 'repairs' ? (
            <div key={key} className="flex gap-1">
              <button
                onClick={() => { onTabChange(key); setMobileOpen(false); }}
                className={`neo-btn py-3 px-4 flex items-center gap-3 text-sm justify-start flex-1 min-w-0 ${activeTab === key ? 'neo-toggle-active' : ''}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
              <button
                onClick={() => { onTabChange('repairs'); onNewRepairOrder?.(); setMobileOpen(false); }}
                className="neo-btn h-[44px] w-[44px] flex items-center justify-center text-lg font-bold text-brand shrink-0"
                title="New Repair Order"
              >+</button>
            </div>
          ) : (
            <button
              key={key}
              onClick={() => { onTabChange(key); setMobileOpen(false); }}
              className={`neo-btn py-3 px-4 flex items-center gap-3 text-sm justify-start ${activeTab === key ? 'neo-toggle-active' : ''}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          )
        ))}
      </nav>

      {/* Dev-only: mock role switcher */}
      {token?.startsWith('mock-') && <MockRoleSwitcher userId={user?.id} userRole={user?.role} />}

      <div className="flex flex-col gap-4 mt-3">
        <button
          onClick={logout}
          className="neo-btn neo-btn-danger py-3 px-4 flex items-center justify-center gap-3 text-sm text-danger"
        >
          <LogOut className="h-4 w-4" /> Log Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 p-6 flex-col border-r">
        {nav}
      </aside>

      {/* Mobile header + drawer */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-panel px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileOpen(true)} className="neo-btn p-2">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-xs">∞</div>
          <span className="font-bold text-xs">INFINITY</span>
        </div>
        <button onClick={onToggleTheme} className="neo-btn h-8 w-8 rounded-lg flex items-center justify-center">
          {darkMode ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-brand" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 p-6 shadow-2xl overflow-y-auto">
            <button onClick={() => setMobileOpen(false)} className="neo-btn p-2 mb-4">
              <X className="h-5 w-5" />
            </button>
            {nav}
          </div>
        </div>
      )}
    </>
  );
}

/** Dev-only: mock profile switcher — dropdown with admin + each technician */
function MockRoleSwitcher({ userId, userRole }: { userId?: number; userRole?: string }) {
  const { loginMock, loginMockUser } = useAuthStore();
  const { data: employees } = useEmployees(true);
  const techs = employees?.filter(e => e.role === 'TECHNICIAN') ?? [];

  const currentValue = userRole === 'SUPERADMIN' ? 'superadmin' : userRole === 'ADMIN' ? 'admin' : String(userId ?? '');

  const handleSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'superadmin') loginMock('superadmin');
    else if (val === 'admin') loginMock('admin');
    else if (val) loginMockUser(Number(val));
  };

  return (
    <div className="neo-card p-2 flex flex-col gap-1 border-l-4 border-l-amber-500">
      <span className="text-[8px] font-bold text-muted uppercase tracking-widest px-1">Mock Profile</span>
      <select
        value={currentValue}
        onChange={handleSwitch}
        className="neo-input w-full text-[10px] font-semibold"
      >
        <option value="superadmin">⚡ Superadmin</option>
        <option value="admin">👑 Admin</option>
        {techs.map(tech => (
          <option key={tech.id} value={tech.id}>🔧 {tech.name}</option>
        ))}
      </select>
    </div>
  );
}
