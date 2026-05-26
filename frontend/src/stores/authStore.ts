import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface EmployeeProfile {
  id: number;
  uuid: string;
  email: string;
  name: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'TECHNICIAN';
  phone?: string;
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: EmployeeProfile | null;
  loading: boolean;
  error: string | null;
  needsRegistration: boolean;
  isPendingApproval: boolean;
  registrationToken: string | null;
  loginMock: (role: 'superadmin' | 'admin' | 'tech') => Promise<void>;
  loginMockUser: (employeeId: number) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerEmployee: (name: string, phone: string) => Promise<void>;
  setToken: (token: string) => void;
  setUser: (user: EmployeeProfile | null) => void;
  logout: () => void;
  clearError: () => void;
  fetchProfile: () => Promise<void>;
}

export class ApiError extends Error {
  status: number;
  detail: any;
  constructor(message: string, status: number, detail: any) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function backendFetch(endpoint: string, token: string) {
  const baseUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${baseUrl}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail;
    const msg = detail && typeof detail === 'object' ? detail.message : (detail || `Request failed (${res.status})`);
    throw new ApiError(msg, res.status, detail);
  }
  return res.json();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('auth_token'),
  user: null,
  loading: false,
  error: null,
  needsRegistration: false,
  isPendingApproval: false,
  registrationToken: null,

  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
    set({ token });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    supabase.auth.signOut();
    localStorage.removeItem('auth_token');
    set({
      token: null,
      user: null,
      error: null,
      needsRegistration: false,
      isPendingApproval: false,
      registrationToken: null
    });
  },

  clearError: () => set({ error: null }),

  fetchProfile: async () => {
    const { token } = get();
    if (!token) return;
    set({ loading: true, error: null, needsRegistration: false, isPendingApproval: false });
    try {
      const profile: EmployeeProfile = await backendFetch('/employees/me', token);
      set({ user: profile, loading: false });
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          set({ needsRegistration: true, loading: false });
        } else if (err.status === 403) {
          const approvalToken = err.detail && typeof err.detail === 'object' ? err.detail.approval_token : null;
          set({
            isPendingApproval: true,
            registrationToken: approvalToken,
            error: err.message,
            loading: false
          });
        } else {
          localStorage.removeItem('auth_token');
          set({ token: null, user: null, error: err.message, loading: false });
        }
      } else {
        localStorage.removeItem('auth_token');
        set({ token: null, user: null, error: err.message, loading: false });
      }
    }
  },

  registerEmployee: async (name: string, phone: string) => {
    const { token } = get();
    if (!token) return;
    set({ loading: true, error: null });
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${baseUrl}/employees/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Registration failed');
      }
      const data = await res.json();
      set({
        needsRegistration: false,
        isPendingApproval: true,
        registrationToken: data.approval_token,
        loading: false
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  loginMock: async (role) => {
    set({ loading: true, error: null, needsRegistration: false, isPendingApproval: false });
    const mockToken = `mock-${role}`;
    try {
      const profile: EmployeeProfile = await backendFetch('/employees/me', mockToken);
      localStorage.setItem('auth_token', mockToken);
      set({ token: mockToken, user: profile, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  loginMockUser: async (employeeId) => {
    set({ loading: true, error: null, needsRegistration: false, isPendingApproval: false });
    const mockToken = `mock-user:${employeeId}`;
    try {
      const profile: EmployeeProfile = await backendFetch('/employees/me', mockToken);
      localStorage.setItem('auth_token', mockToken);
      set({ token: mockToken, user: profile, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null, needsRegistration: false, isPendingApproval: false });
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
}));
