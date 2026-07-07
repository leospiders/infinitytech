import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, supabase } from './stores/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar, type TabKey } from './layouts/Sidebar';
import { DashboardView } from './modules/dashboard/DashboardView';
import { POSView } from './modules/pos/POSView';
import { RepairsView } from './modules/repairs/RepairsView';
import { InventoryView } from './modules/inventory/InventoryView';
import { HistoryView } from './modules/history/HistoryView';
import { UsersView } from './modules/users/UsersView';
import { ProfileView } from './modules/profile/ProfileView';
import { LandingView } from './modules/landing/LandingView';
import { StockView } from './modules/stock/StockView';
import { MyOrdersView } from './modules/stock/MyOrdersView';
import { LoginModal } from './components/ui/LoginModal';
import { Toast, type ToastData } from './components/ui/Toast';
import { MaterialIcon } from './components/ui/MaterialIcon';

export function App() {
  const {
    user, loading, token,
    isPendingApproval, clearError, setToken, fetchProfile,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [toast, setToast] = useState<ToastData | null>(null);
  const [repairCreateTrigger, setRepairCreateTrigger] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [showLogin, setShowLogin] = useState(false);

  const { t } = useTranslation();

  // Restore Supabase session on mount (Google OAuth redirect / page refresh)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setToken(session.access_token);
        fetchProfile();
      }
    });
  }, []);

  // Theme synchronization
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    document.documentElement.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Set initial tab based on role when user changes
  useEffect(() => {
    if (user?.role === 'TECH_COM') {
      setActiveTab('my-orders');
    } else {
      setActiveTab('dashboard');
    }
  }, [user?.role]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
    clearError();
  };

  // Initial loading: session restore in progress (no token yet, not from a failed fetch)
  if (loading && !token && !user && !isPendingApproval) {
    return (
      <div className="flex h-screen items-center justify-center transition-colors">
        <div className="neo-card p-8 flex flex-col items-center gap-4">
          <MaterialIcon icon="sync" wght={300} className="text-cyan-accent animate-spin" size={40} />
          <span className="font-semibold text-sm">{t('app.loading')}</span>
        </div>
      </div>
    );
  }

  // LANDING PAGE (unauthenticated) + optional login modal
  if (!token) {
    return (
      <>
        <LandingView onRequestLogin={() => setShowLogin(true)} />
        {showLogin && <LoginModal onClose={handleCloseLogin} />}
      </>
    );
  }

  // DASHBOARD (authenticated) — wrapped in ProtectedRoute for status gating
  return (
    <ProtectedRoute>
      <div className="flex h-dvh overflow-hidden transition-colors duration-300">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          onNewRepairOrder={() => { setActiveTab('repairs'); setRepairCreateTrigger(n => n + 1); }}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 pt-16 lg:pt-8 relative">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'pos' && <POSView showToast={showToast} />}
          {activeTab === 'repairs' && <RepairsView showToast={showToast} createTrigger={repairCreateTrigger} onConsumeTrigger={() => setRepairCreateTrigger(0)} />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'users' && (user?.role === 'ADMIN') && <UsersView showToast={showToast} />}
          {activeTab === 'profile' && <ProfileView showToast={showToast} />}
          {activeTab === 'stock' && <StockView />}
          {activeTab === 'my-orders' && <MyOrdersView />}
        </main>
      </div>
    </ProtectedRoute>
  );
}
