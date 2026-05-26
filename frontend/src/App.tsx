import { useState, useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { Sidebar, type TabKey } from './layouts/Sidebar';
import { DashboardView } from './modules/dashboard/DashboardView';
import { POSView } from './modules/pos/POSView';
import { RepairsView } from './modules/repairs/RepairsView';
import { InventoryView } from './modules/inventory/InventoryView';
import { HistoryView } from './modules/history/HistoryView';
import { UsersView } from './modules/users/UsersView';
import { RegistrationActionView } from './modules/users/RegistrationActionView';
import { Toast, type ToastData } from './components/ui/Toast';
import { supabase } from './stores/authStore';
import { RefreshCw, Lock, Clipboard, Check, AlertCircle, Sparkles } from 'lucide-react';

export function App() {
  const {
    user, loading, loginMock, loginWithGoogle, logout,
    error, needsRegistration, isPendingApproval, registrationToken, registerEmployee
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [toast, setToast] = useState<ToastData | null>(null);
  const [repairCreateTrigger, setRepairCreateTrigger] = useState(0);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored ? stored === 'dark' : true;
  });

  // Prefill registration details from Google session
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, []);

  useEffect(() => {
    if (needsRegistration) {
      supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
        if (sbUser) {
          setRegEmail(sbUser.email || '');
          setRegName(sbUser.user_metadata?.full_name || '');
        }
      });
    }
  }, [needsRegistration]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.body.classList.toggle('dark-mode', next);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const copyApprovalLink = () => {
    if (!registrationToken) return;
    const link = `${window.location.origin}/?token=${encodeURIComponent(registrationToken)}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    showToast('success', 'Approval link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // If temporary approval token is present in URL, route directly to the action view
  const params = new URLSearchParams(window.location.search);
  const regToken = params.get('token');

  if (regToken) {
    return <RegistrationActionView token={regToken} />;
  }

  if (loading && !user) {
    return (
      <div className="flex h-screen items-center justify-center transition-colors">
        <div className="neo-card p-8 flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-brand" />
          <span className="font-semibold text-sm">Infinity Technology is loading...</span>
        </div>
      </div>
    );
  }

  // ONBOARDING FLOW: Complete registration details (Name, Email, Cell Phone)
  if (needsRegistration) {
    return (
      <div className="flex h-screen items-center justify-center p-4 transition-colors">
        <div className="neo-card max-w-md w-full p-8 flex flex-col gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand to-brand-secondary" />
          
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="h-12 w-12 rounded-2xl bg-brand flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand/25 mb-1">
              ∞
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">COMPLETE REGISTRATION</h1>
            <p className="text-xs text-muted dark:text-dim">Just a final step to submit your request.</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              registerEmployee(regName, regPhone);
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="text-xs font-bold text-muted dark:text-dim uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={regEmail}
                disabled
                className="neo-input mt-1.5 w-full bg-[#f1f3f9] dark:bg-black/20 opacity-70 cursor-not-allowed font-semibold text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted dark:text-dim uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="neo-input mt-1.5 w-full font-semibold text-xs"
                placeholder="Enter your first and last name"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted dark:text-dim uppercase tracking-wider">Cell Phone Number *</label>
              <input
                type="tel"
                required
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="neo-input mt-1.5 w-full font-semibold text-xs"
                placeholder="e.g. +54 9 11 1234 5678"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger text-center">
                {error}
              </div>
            )}

            <button type="submit" className="neo-btn w-full py-3 text-sm font-bold mt-2 bg-brand text-white border-brand/20 shadow-md shadow-brand/10 hover:shadow-lg hover:shadow-brand/25">
              Submit Access Request
            </button>
          </form>

          <button onClick={logout} className="text-xs text-dim hover:text-danger transition-colors text-center font-semibold">
            Cancel & Sign Out
          </button>
        </div>
      </div>
    );
  }

  // PENDING APPROVAL SCREEN: Shows copyable temporary link
  if (isPendingApproval) {
    const link = `${window.location.origin}/?token=${encodeURIComponent(registrationToken || '')}`;
    return (
      <div className="flex h-screen items-center justify-center p-4 transition-colors">
        <div className="neo-card max-w-md w-full p-8 flex flex-col gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-success to-emerald-500 animate-pulse" />
          
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center text-success mb-1 shadow-inner">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">REGISTRATION SUBMITTED</h1>
            <p className="text-xs text-muted dark:text-dim px-2">
              Your technician request is pending activation. Share the link below with your Superadmin or Admin to approve your account.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-600 dark:text-amber-400">
            <div className="flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>How to approve:</strong> Copy the temporary approval link below and send it to your supervisor (via WhatsApp/SMS/Email). Once they click it, your account will be activated immediately.
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-muted dark:text-dim uppercase tracking-wider">Temporary Approval Link (Expires in 24h)</span>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={link}
                className="neo-input flex-1 font-mono text-[10px] bg-[#f1f3f9] dark:bg-black/20 select-all py-2"
              />
              <button
                onClick={copyApprovalLink}
                className="neo-btn px-3 flex items-center justify-center text-brand border-brand/20"
                title="Copy Link"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Clipboard className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button onClick={logout} className="neo-btn w-full py-3 text-sm font-bold text-danger border-danger/30 hover:bg-danger/5">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center p-4 transition-colors">
        <div className="neo-card max-w-md w-full p-8 flex flex-col items-center gap-6 relative shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand to-brand-secondary" />

          <div className="flex flex-col items-center gap-2 text-center">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand to-brand-secondary flex items-center justify-center shadow-lg shadow-brand/25 text-white font-bold text-xl">
              ∞
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">INFINITY TECHNOLOGY</h1>
            <p className="text-xs text-muted">POS & Technical Service Platform</p>
          </div>

          {error && (
            <div className="w-full p-4 rounded-xl bg-danger/10 border border-danger/25 text-xs text-danger flex gap-2.5 items-start">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold">Authentication Error</span>
                <span className="mt-1 leading-normal">{error}</span>
              </div>
            </div>
          )}

          <button
            onClick={loginWithGoogle}
            className="neo-btn w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div className="w-full border-t pt-4">
            <div className="text-center font-semibold text-xs mb-3 text-muted">Dev Access</div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button onClick={() => loginMock('superadmin')} className="neo-btn flex-1 py-2 text-xs font-semibold text-amber-500">Mock Superadmin</button>
                <button onClick={() => loginMock('admin')} className="neo-btn flex-1 py-2 text-xs font-semibold text-brand">Mock Admin</button>
              </div>
              <button onClick={() => loginMock('tech')} className="neo-btn py-2 text-xs font-semibold text-success">Mock Technician</button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-dim pt-2">
            <Lock className="h-3 w-3" /> Secure platform
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-300">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        onNewRepairOrder={() => { setActiveTab('repairs'); setRepairCreateTrigger(n => n + 1); }}
      />

      <main className="flex-1 overflow-y-auto p-4 lg:p-8 pt-16 lg:pt-8 relative">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'pos' && <POSView showToast={showToast} />}
        {activeTab === 'repairs' && <RepairsView showToast={showToast} createTrigger={repairCreateTrigger} onConsumeTrigger={() => setRepairCreateTrigger(0)} />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'users' && (user?.role === 'SUPERADMIN' || user?.role === 'ADMIN') && <UsersView showToast={showToast} />}
      </main>
    </div>
  );
}
