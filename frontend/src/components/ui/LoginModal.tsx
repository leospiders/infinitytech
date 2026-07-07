import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { MaterialIcon } from './MaterialIcon';

interface Props {
  onClose: () => void;
}

export function LoginModal({ onClose }: Props) {
  const { t } = useTranslation();
  const {
    loginWithEmail, loginWithGoogle, signup, resetPassword,
    error, loading, clearError,
  } = useAuthStore();

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupShowPw, setSignupShowPw] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const inputClass = "w-full px-3.5 py-2.5 text-sm bg-surface-container border border-outline-variant rounded-[4px] focus:outline-none focus:border-accent-cyan focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 transition-all font-sans";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    await loginWithEmail(loginEmail, loginPassword);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    if (signupPassword !== signupConfirm) {
      useAuthStore.setState({ error: 'Passwords do not match.' });
      return;
    }
    const result = await signup(signupUsername, signupEmail, signupPassword, signupConfirm);
    if (result) {
      setSuccessMsg(t('app.signupSuccess'));
      setAuthMode('login');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    await resetPassword(resetEmail);
    if (!useAuthStore.getState().error) {
      setSuccessMsg(t('app.resetSent'));
    }
  };

  const switchMode = (mode: 'login' | 'signup' | 'reset') => {
    setAuthMode(mode);
    setSuccessMsg('');
    clearError();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-colors overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="max-w-md w-full p-8 flex flex-col items-center gap-6 relative z-10 rounded-[4px] bg-surface-container-low border border-outline-variant max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent-cyan" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 neo-btn p-2 rounded-[4px] cursor-pointer"
        >
          <MaterialIcon icon="close" wght={300} className="text-on-surface-variant" size={16} />
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center font-display-md">
          <div className="h-10 w-10 rounded-lg bg-cyan-accent flex items-center justify-center text-[#0A0A0A] font-bold text-xl">
            ∞
          </div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface uppercase mt-2 font-display-md">{t('app.title')}</h1>
          <p className="text-xs text-on-surface-variant font-sans">{t('app.subtitle')}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="w-full p-4 rounded-[2px] bg-error/10 border border-error/20 text-xs text-error flex gap-2.5 items-start">
            <div className="flex flex-col">
              <span className="font-bold">{t('app.authError')}</span>
              <span className="mt-1 leading-normal">{error}</span>
            </div>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="w-full p-4 rounded-[2px] bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 text-center font-medium">
            {successMsg}
          </div>
        )}

        {/* Tab selector */}
        <div className="flex w-full rounded-[4px] bg-surface-container p-1 gap-1 border border-outline-variant">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-[2px] transition-all cursor-pointer ${authMode === 'login' ? 'bg-surface-container-high text-accent-cyan' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            {t('app.loginTab')}
          </button>
          <button
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-[2px] transition-all cursor-pointer ${authMode === 'signup' ? 'bg-surface-container-high text-accent-cyan' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            {t('app.signupTab')}
          </button>
        </div>

        {/* Login Form */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
            <input
              type="email"
              placeholder={t('app.emailLabel')}
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              required
              className={inputClass}
              autoComplete="email"
            />
            <div className="relative">
              <input
                type={loginShowPw ? 'text' : 'password'}
                placeholder={t('app.passwordLabel')}
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                className={`${inputClass} pr-10`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setLoginShowPw(!loginShowPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <MaterialIcon icon={loginShowPw ? 'visibility_off' : 'visibility'} wght={300} className="text-on-surface-variant" size={16} />
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="neo-btn btn-primary w-full py-3 text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              {loading ? t('app.loading') : t('app.loginButton')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('reset')}
              className="text-xs text-accent-cyan hover:underline text-center font-medium cursor-pointer"
            >
              {t('app.forgotPassword')}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignup} className="w-full flex flex-col gap-3">
            <input
              type="text"
              placeholder={t('app.usernameLabel')}
              value={signupUsername}
              onChange={e => setSignupUsername(e.target.value)}
              required
              className={inputClass}
              autoComplete="name"
            />
            <input
              type="email"
              placeholder={t('app.emailLabel')}
              value={signupEmail}
              onChange={e => setSignupEmail(e.target.value)}
              required
              className={inputClass}
              autoComplete="email"
            />
            <div className="relative">
              <input
                type={signupShowPw ? 'text' : 'password'}
                placeholder={t('app.passwordLabel')}
                value={signupPassword}
                onChange={e => setSignupPassword(e.target.value)}
                required
                className={`${inputClass} pr-10`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setSignupShowPw(!signupShowPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <MaterialIcon icon={signupShowPw ? 'visibility_off' : 'visibility'} wght={300} className="text-on-surface-variant" size={16} />
              </button>
            </div>
            <input
              type="password"
              placeholder={t('app.confirmPasswordLabel')}
              value={signupConfirm}
              onChange={e => setSignupConfirm(e.target.value)}
              required
              className={inputClass}
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={loading}
              className="neo-btn btn-primary w-full py-3 text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              {loading ? t('app.loading') : t('app.signupButton')}
            </button>
          </form>
        )}

        {/* Reset Password Form */}
        {authMode === 'reset' && (
          <form onSubmit={handleReset} className="w-full flex flex-col gap-3">
            <p className="text-xs text-on-surface-variant text-center mb-1">{t('app.resetPasswordTitle')}</p>
            <div className="relative">
              <input
                type="email"
                placeholder={t('app.emailLabel')}
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                required
                className={`${inputClass} pl-10`}
                autoComplete="email"
              />
              <MaterialIcon icon="mail" wght={300} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="neo-btn btn-primary w-full py-3 text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              {loading ? t('app.loading') : t('app.resetPasswordButton')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-xs text-accent-cyan hover:underline text-center font-medium cursor-pointer"
            >
              {t('app.backToLogin')}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 w-full my-1">
          <div className="flex-1 h-px bg-outline-variant" />
          <span className="text-xs text-on-surface-variant font-medium font-sans">{t('app.orContinueWith')}</span>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        {/* Google OAuth */}
        <button
          onClick={loginWithGoogle}
          className="neo-btn w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 rounded-[4px] cursor-pointer"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t('app.googleLogin')}
        </button>

        <div className="flex items-center gap-2 text-xs text-on-surface-variant pt-2 font-mono">
          <MaterialIcon icon="lock" wght={300} className="text-cyan-accent" size={12} /> {t('app.securePlatform')}
        </div>

        {/* Mock Login — dev only */}
        {import.meta.env.DEV && (
          <>
            <div className="flex items-center gap-3 w-full my-1">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="text-xs text-amber-400 font-bold font-mono tracking-wider">MOCK DEV</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>
            <div className="flex gap-2 w-full">
              {(['admin', 'tech', 'tech_com'] as const).map(role => (
                <button
                  key={role}
                  onClick={async () => {
                    const token = role === 'admin' ? 'mock-admin-token' : role === 'tech' ? 'mock-tech-token' : 'mock-tech_com-token';
                    useAuthStore.getState().setToken(token);
                    await useAuthStore.getState().fetchProfile();
                  }}
                  className="flex-1 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider cursor-pointer transition-all hover:brightness-125"
                  style={{
                    backgroundColor: role === 'admin' ? '#FFC10722' : role === 'tech' ? '#60A5FA22' : '#A78BFA22',
                    color: role === 'admin' ? '#FFC107' : role === 'tech' ? '#60A5FA' : '#A78BFA',
                    border: `1px solid ${role === 'admin' ? '#FFC10744' : role === 'tech' ? '#60A5FA44' : '#A78BFA44'}`,
                  }}
                >
                  {role === 'admin' ? 'ADMIN' : role === 'tech' ? 'TÉCNICO' : 'TECH_COM'}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

