import { create } from 'zustand';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  org_id: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setAuth: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with true so ProtectedRoute waits for fetchUser

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      console.log('🔑 Attempting login for:', email);
      const { data } = await authAPI.login(email, password);
      console.log('✅ Login successful, storing token');
      localStorage.setItem('access_token', data.access_token);
      console.log('💾 Token stored in localStorage');
      
      // Fetch user details
      console.log('👤 Fetching user details...');
      const { data: userData } = await authAPI.getMe();
      console.log('✅ User data retrieved:', userData.email);
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('❌ Login failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    const token = localStorage.getItem('access_token');
    console.log('🔐 Checking for stored token:', token ? 'Found' : 'Not found');
    
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      console.log('👤 Fetching user data with token...');
      const { data } = await authAPI.getMe();
      console.log('✅ User authenticated:', data.email);
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      localStorage.removeItem('access_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setAuth: async (token: string) => {
    localStorage.setItem('access_token', token);
    set({ isLoading: true });
    try {
      const { data } = await authAPI.getMe();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('access_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  },
}));
