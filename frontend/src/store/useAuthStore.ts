import { create } from 'zustand';
import api from '../services/api.js';
import type { User } from '../types/index.js';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (bio: string, interests: string[]) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('alias_token'),
  isAuthenticated: !!localStorage.getItem('alias_token'),
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response.data.data;
      
      localStorage.setItem('alias_token', token);
      set({
        token,
        user: {
          id: user.id,
          username: user.username,
          bio: user.bio || '',
          interests: user.interests || [],
          isOnline: user.isOnline || false,
          lastSeen: user.lastSeen || new Date().toISOString()
        },
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Login failed'
      });
      throw err;
    }
  },

  register: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { username, password });
      const { token, user } = response.data.data;

      localStorage.setItem('alias_token', token);
      set({
        token,
        user: {
          id: user.id,
          username: user.username,
          bio: user.bio || '',
          interests: user.interests || [],
          isOnline: user.isOnline || false,
          lastSeen: user.lastSeen || new Date().toISOString()
        },
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Registration failed'
      });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('alias_token');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null
    });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/auth/me');
      const { user } = response.data.data;
      
      set({
        user: {
          id: user.id,
          username: user.username,
          bio: user.bio || '',
          interests: user.interests || [],
          isOnline: user.isOnline || false,
          lastSeen: user.lastSeen || new Date().toISOString()
        },
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err: any) {
      localStorage.removeItem('alias_token');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  updateProfile: async (bio, interests) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/users/profile', { bio, interests });
      const { user } = response.data.data;

      set({
        user: {
          id: user._id || user.id, // Handle backend mongoose return fields
          username: user.username,
          bio: user.bio,
          interests: user.interests,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen
        },
        isLoading: false
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Profile update failed'
      });
      throw err;
    }
  }
}));
