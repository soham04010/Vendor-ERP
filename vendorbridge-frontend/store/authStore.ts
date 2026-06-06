import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

export type UserRole = 'admin' | 'officer' | 'vendor' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  vendor_id?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        Cookies.set('auth-token', token, { expires: 1 });
        Cookies.set('auth-role', user.role, { expires: 1 });
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        Cookies.remove('auth-token');
        Cookies.remove('auth-role');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage', // unique name for local storage key
    }
  )
);
