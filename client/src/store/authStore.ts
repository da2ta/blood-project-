import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { api } from '../lib/axios';
import type { User } from '../types';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        try {
          const { data } = await api.get('/api/auth/me');
          if (data.success) {
            set({
              user: data.data,
              session,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ user: null, session: null, isAuthenticated: false, isLoading: false });
          }
        } catch {
          set({ user: null, session: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_IN' && newSession) {
          try {
            const { data } = await api.get('/api/auth/me');
            if (data.success) {
              set({
                user: data.data,
                session: newSession,
                isAuthenticated: true,
              });
            }
          } catch {
            // User exists in Supabase but not in our DB yet (registration in progress)
            set({ session: newSession });
          }
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          set({ session: newSession });
        }
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      session: null,
      isAuthenticated: false,
    });
  },
}));
