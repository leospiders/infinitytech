import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import type { UserStatus } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface EmployeeProfile {
  id: number;
  uuid: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TECH_IT' | 'TECH_COM' | 'PENDING';
  phone?: string;
  is_active: boolean;
  status: UserStatus;
  rejection_reason?: string;
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: EmployeeProfile | null;
  loading: boolean;
  error: string | null;
  isPendingApproval: boolean;
  userStatus: UserStatus | null;
  rejectionReason: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, confirmPassword: string) => Promise<{ message: string } | void>;
  resetPassword: (email: string) => Promise<void>;
  setToken: (token: string) => void;
  setUser: (user: EmployeeProfile | null) => void;
  logout: () => void;
  clearError: () => void;
  fetchProfile: () => Promise<void>;
}

const GENERIC_ERRORS: Record<number, string> = {
  400: 'Invalid request data',
  401: 'Session expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'Resource not found',
  500: 'Server error. Please try again later.',
};

export class ApiError extends Error {
  status: number;
  detail: string | null;
  constructor(status: number, detail?: string | null) {
    super(GENERIC_ERRORS[status] || `Request failed (${status})`);
    this.status = status;
    this.detail = detail ?? null;
  }
}

async function backendFetch(endpoint: string, token: string) {
  const baseUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${baseUrl}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (body.detail) console.warn('[API]', endpoint, body.detail);
    throw new ApiError(res.status, body.detail);
  }
  return res.json();
}

async function apiPost(endpoint: string, body: unknown) {
  const baseUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Request failed (${res.status})`);
  }
  return data;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('auth_token'),
  user: null,
  loading: false,
  error: null,
  isPendingApproval: false,
  userStatus: null,
  rejectionReason: null,

  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
    set({ token });
  },

  setUser: (user) => set({ user, userStatus: user?.status ?? null, rejectionReason: user?.rejection_reason ?? null }),

  logout: () => {
    supabase.auth.signOut();
    localStorage.removeItem('auth_token');
    set({
      token: null,
      user: null,
      error: null,
      isPendingApproval: false,
      userStatus: null,
      rejectionReason: null,
    });
  },

  clearError: () => set({ error: null }),

  fetchProfile: async () => {
    const { token } = get();
    if (!token) return;
    set({ loading: true, error: null, isPendingApproval: false, userStatus: null, rejectionReason: null });
    try {
      const profile: EmployeeProfile = await backendFetch('/employees/me', token);
      set({ user: profile, loading: false, userStatus: profile.status ?? null, rejectionReason: profile.rejection_reason ?? null });
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          const detail = err.detail ?? '';
          let userStatus: UserStatus | null = null;
          let rejectionReason: string | null = null;
          let isPendingApproval = false;

          if (detail === 'PENDING_APPROVAL') {
            userStatus = 'PENDING';
            isPendingApproval = true;
          } else if (detail.startsWith('REJECTED')) {
            userStatus = 'REJECTED';
            // detail format: "REJECTED" or "REJECTED:reason text"
            const colonIdx = detail.indexOf(':');
            rejectionReason = colonIdx >= 0 ? detail.slice(colonIdx + 1) : null;
          } else if (detail === 'SUSPENDED') {
            userStatus = 'SUSPENDED';
          }

          set({
            isPendingApproval,
            userStatus,
            rejectionReason,
            error: err.message,
            loading: false,
            user: null,
          });
        } else {
          // 401 (DELETED etc.) — clear auth
          localStorage.removeItem('auth_token');
          set({ token: null, user: null, error: err.message, loading: false, userStatus: null, rejectionReason: null, isPendingApproval: false });
        }
      } else {
        localStorage.removeItem('auth_token');
        set({ token: null, user: null, error: err.message, loading: false, userStatus: null, rejectionReason: null, isPendingApproval: false });
      }
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null, isPendingApproval: false, userStatus: null, rejectionReason: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  loginWithEmail: async (email: string, password: string) => {
    set({ loading: true, error: null, isPendingApproval: false, userStatus: null, rejectionReason: null });
    try {
      const data = await apiPost('/auth/login', { email, password });
      get().setToken(data.access_token);
      await get().fetchProfile();
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  signup: async (username: string, email: string, password: string, confirmPassword: string) => {
    set({ loading: true, error: null, isPendingApproval: false, userStatus: null, rejectionReason: null });
    try {
      await apiPost('/auth/signup', { username, email, password, confirm_password: confirmPassword });

      // Auto-login so the user goes straight to the pending approval screen
      const loginData = await apiPost('/auth/login', { email, password });
      get().setToken(loginData.access_token);
      set({ loading: false, isPendingApproval: true, userStatus: 'PENDING' });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null, isPendingApproval: false, userStatus: null, rejectionReason: null });
    try {
      await apiPost('/auth/reset-password', { email });
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
