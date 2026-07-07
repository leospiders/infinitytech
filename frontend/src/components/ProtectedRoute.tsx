import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';
import { WaitingApprovalPage } from '../modules/auth/WaitingApprovalPage';
import { RejectedPage } from '../modules/auth/RejectedPage';
import { SuspendedPage } from '../modules/auth/SuspendedPage';
import { MaterialIcon } from './ui/MaterialIcon';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const {
    user, loading, userStatus,
    fetchProfile, token,
  } = useAuthStore();

  // Re-validate profile when token exists but we haven't resolved status yet
  // userStatus starts as null; after fetchProfile (even 403) it gets set to a value
  useEffect(() => {
    if (token && !user && userStatus === null) {
      fetchProfile();
    }
  }, [token, user, userStatus, fetchProfile]);

  // Show loading while validating — never flash children before profile check
  if (loading || (token && !user && userStatus === null)) {
    return (
      <div className="flex h-screen items-center justify-center transition-colors">
        <div className="neo-card p-8 flex flex-col items-center gap-4">
          <MaterialIcon icon="sync" wght={300} className="text-cyan-accent animate-spin" size={40} />
          <span className="font-semibold text-sm">Infinity Technology está cargando...</span>
        </div>
      </div>
    );
  }

  // Not authenticated — let App.tsx handle landing + login
  if (!token) {
    return <>{children}</>;
  }

  // Status-based gating — check userStatus from failed fetchProfile (403 handled)
  if (userStatus === 'PENDING') {
    return <WaitingApprovalPage />;
  }

  if (userStatus === 'REJECTED') {
    return <RejectedPage />;
  }

  if (userStatus === 'SUSPENDED') {
    return <SuspendedPage />;
  }

  // DELETED: the store already clears auth on 401, so this shouldn't normally render
  // If somehow userStatus is DELETED, force landing
  if (userStatus === 'DELETED') {
    useAuthStore.getState().logout();
    return null;
  }

  // Authenticated + active — render children (dashboard etc.)
  return <>{children}</>;
}
