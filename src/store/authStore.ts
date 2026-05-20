import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
}

const storedUser = (() => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
})();

export const useAuthStore = create<AuthState>((set) => {
  // 다른 탭에서 로그인/로그아웃 시 현재 탭의 상태도 동기화
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            const user = JSON.parse(e.newValue) as User;
            set({ user, isAuthenticated: true });
          } catch {
            // ignore
          }
        } else {
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      }
    });
  }

  return {
    user: storedUser,
    accessToken: null,
    isAuthenticated: !!storedUser,
    setAuth: (user, accessToken) => {
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, accessToken, isAuthenticated: true });
    },
    clearAuth: () => {
      localStorage.removeItem('user');
      set({ user: null, accessToken: null, isAuthenticated: false });
    },
  };
});
