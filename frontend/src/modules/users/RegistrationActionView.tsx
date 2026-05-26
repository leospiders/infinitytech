import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, User, Phone, Mail, Shield, AlertTriangle } from 'lucide-react';

interface RegistrationDetails {
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
}

export function RegistrationActionView({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<RegistrationDetails | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${baseUrl}/employees/verify-registration-token?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Invalid or expired approval token');
        }
        const data = await res.json();
        setDetails(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    verifyToken();
  }, [token]);

  const handleAction = async (action: 'approve' | 'deny') => {
    if (!window.confirm(`Are you sure you want to ${action} this registration request?`)) return;
    setActionLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${baseUrl}/employees/execute-registration-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, action })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to ${action} registration`);
      }
      const data = await res.json();
      setActionSuccess(data.message || `Request successfully processed!`);
      if (details) {
        setDetails({ ...details, is_active: action === 'approve' });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBackToLogin = () => {
    // Clear token query parameter and reload page to go back to login
    window.location.href = window.location.origin;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#EBF0F6] dark:bg-[#080616] transition-colors p-4">
        <div className="neo-card p-8 flex flex-col items-center gap-4 max-w-sm w-full">
          <RefreshCw className="h-10 w-10 animate-spin text-brand" />
          <span className="font-semibold text-sm">Verifying Registration Token...</span>
        </div>
      </div>
    );
  }

  if (error && !details) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#EBF0F6] dark:bg-[#080616] transition-colors p-4">
        <div className="neo-card p-8 flex flex-col items-center gap-4 max-w-md w-full text-center">
          <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-danger">Verification Failed</h2>
          <p className="text-xs text-muted dark:text-dim">{error}</p>
          <button onClick={handleBackToLogin} className="neo-btn w-full py-2.5 mt-2 font-semibold">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (actionSuccess) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#EBF0F6] dark:bg-[#080616] transition-colors p-4">
        <div className="neo-card p-8 flex flex-col items-center gap-5 max-w-md w-full text-center">
          <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center text-success shadow-lg shadow-success/15">
            <CheckCircle className="h-8 w-8 animate-bounce" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-success">Action Processed Successfully</h2>
            <p className="text-xs text-muted dark:text-dim mt-2">{actionSuccess}</p>
          </div>
          <button onClick={handleBackToLogin} className="neo-btn w-full py-3 text-sm font-semibold">
            Go to Platform
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#EBF0F6] dark:bg-[#080616] transition-colors p-4">
      <div className="neo-card p-8 flex flex-col gap-6 max-w-md w-full shadow-xl relative overflow-hidden">
        {/* Decorative corner tag */}
        <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-brand to-brand-secondary transform rotate-45 translate-x-8 -translate-y-8 shadow" />

        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-2xl bg-brand flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand/25 mb-1">
            ∞
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-brand-deep">EMPLOYEE REGISTRATION REQUEST</h1>
          <p className="text-[10px] uppercase font-bold text-brand tracking-widest">Administrator Action Portal</p>
        </div>

        {details && (
          <div className="flex flex-col gap-4 p-5 rounded-2xl bg-[#F8FAFC]/50 dark:bg-black/15 border border-[#E2E8F0]/30">
            {/* Name */}
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted dark:text-dim leading-none">FullName</span>
                <span className="text-sm font-bold truncate mt-1">{details.name}</span>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted dark:text-dim leading-none">Email Address</span>
                <span className="text-xs font-bold truncate mt-1">{details.email}</span>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted dark:text-dim leading-none">Cell Phone</span>
                <span className="text-xs font-bold truncate mt-1">{details.phone || 'No phone number provided'}</span>
              </div>
            </div>

            {/* Requested Role */}
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted dark:text-dim leading-none">Default Role Assigned</span>
                <span className="text-xs font-bold text-brand mt-1 uppercase tracking-wider">{details.role}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 text-xs text-danger rounded-xl bg-danger/10 border border-danger/25 text-center">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => handleAction('deny')}
            disabled={actionLoading}
            className="neo-btn neo-btn-danger flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2"
          >
            <XCircle className="h-4 w-4" /> Deny Request
          </button>
          <button
            onClick={() => handleAction('approve')}
            disabled={actionLoading}
            className="neo-btn flex-1 py-3 text-xs font-bold text-success border-success/30 hover:bg-success/5 flex items-center justify-center gap-2 bg-gradient-to-r from-success/5 to-transparent"
          >
            <CheckCircle className="h-4 w-4" /> Approve & Activate
          </button>
        </div>

        <button onClick={handleBackToLogin} className="text-[10px] text-dim hover:text-brand transition-colors text-center">
          Go back to Login screen
        </button>
      </div>
    </div>
  );
}
