import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  setToken: async (token) => {
    await AsyncStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token });
  },

  clearToken: async () => {
    await AsyncStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    set({ token: null, user: null });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.requireOTP) {
        set({ isLoading: false });
        return { requireOTP: true, tempToken: res.data.tempToken };
      }
      await get().setToken(res.data.token);
      set({ user: res.data.user, isLoading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Erreur de connexion';
      set({ error, isLoading: false });
      return { error };
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { username, email, password });
      await get().setToken(res.data.token);
      set({ user: res.data.user, isLoading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Erreur lors de l\'inscription';
      set({ error, isLoading: false });
      return { error };
    }
  },

  logout: async () => {
    await get().clearToken();
  },

  setupOTP: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/setup-otp');
      set({ isLoading: false });
      return { success: true, data: res.data };
    } catch (err) {
      const error = err.response?.data?.error || 'Erreur lors de la configuration OTP';
      set({ error, isLoading: false });
      return { error };
    }
  },

  verifyOTP: async (token, tempToken) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/verify-otp', { token }, {
        headers: { Authorization: `Bearer ${tempToken}` }
      });
      await get().setToken(res.data.token);
      set({ user: res.data.user, isLoading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Code OTP invalide';
      set({ error, isLoading: false });
      return { error };
    }
  },

  confirmOTP: async (token) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/confirm-otp', { token });
      set(state => ({ user: { ...state.user, otp_enabled: true }, isLoading: false }));
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Erreur lors de la confirmation OTP';
      set({ error, isLoading: false });
      return { error };
    }
  },

  disableOTP: async (token) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/disable-otp', { token });
      set(state => ({ user: { ...state.user, otp_enabled: false }, isLoading: false }));
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Erreur lors de la désactivation OTP';
      set({ error, isLoading: false });
      return { error };
    }
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/user/profile');
      set({ user: res.data.user });
    } catch (err) {
      const error = err.response?.data?.error || 'Erreur lors de la récupération du profil';
      set({ error });
    }
  }
}));

export default useAuthStore;
