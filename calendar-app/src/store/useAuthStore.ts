import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { toast } from 'react-native-sonner';
import apiClient from '../api/client';

interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  getMe: () => Promise<void>;
  setToken: (token: string | null) => Promise<void>;
  setUser: (user: User | null) => void;
  updateProfile: (data: { name: string; password?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  setToken: async (token: string | null) => {
    if (token) {
      await SecureStore.setItemAsync('userToken', token);
    } else {
      await SecureStore.deleteItemAsync('userToken');
    }
    set({ token });
  },

  setUser: (user: User | null) => {
    set({ user });
  },

  login: async (credentials: any) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.post('/auth/login', credentials);
      const { access_token } = response.data;
      await get().setToken(access_token);
      await get().getMe();
      toast.success('Đăng nhập thành công');
    } catch (error: any) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      toast.error(message);
      throw error;
    }
  },

  register: async (data: any) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.post('/auth/register', data);
      const { access_token } = response.data;
      await get().setToken(access_token);
      await get().getMe();
      toast.success('Đăng ký tài khoản thành công');
    } catch (error: any) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Đăng ký thất bại';
      toast.error(message);
      throw error;
    }
  },

  updateProfile: async (data: { name: string; password?: string }) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.patch('/users/profile', data);
      await get().getMe(); // Fetch fresh user data to ensure sync
      set({ isLoading: false });
      toast.success('Cập nhật thông tin thành công');
    } catch (error: any) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Không thể cập nhật thông tin';
      toast.error(message);
      throw error;
    }
  },

  logout: async () => {
    await get().setToken(null);
    set({ user: null, isLoading: false });
  },

  getMe: async () => {
    try {
      set({ isLoading: true });
      const storedToken = await SecureStore.getItemAsync('userToken');
      if (storedToken) {
        set({ token: storedToken });
      }
      const response = await apiClient.get('/auth/profile');
      set({ user: response.data, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
      await get().setToken(null);
    }
  },
}));
