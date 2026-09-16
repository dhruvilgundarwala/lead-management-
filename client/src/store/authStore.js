import { create } from 'zustand';
import { getMe } from '../api/auth';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (user, token) => {
    if (token) localStorage.setItem('token', token);
    set({ user, isAuthenticated: true, isLoading: false });
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  checkAuth: async () => {
    try {
      if (!localStorage.getItem('token')) {
        set({ isLoading: false });
        return;
      }
      const res = await getMe();
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));

export default useAuthStore;
