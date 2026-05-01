import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { toast } from 'react-native-sonner';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import apiClient from '../api/client';

interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  getMe: () => Promise<void>;
  setTokens: (accessToken: string | null) => Promise<void>;
  setUser: (user: User | null) => void;
  updateProfile: (data: { name: string; password?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setTokens: async (accessToken: string | null) => {
    if (accessToken) {
      await SecureStore.setItemAsync('accessToken', accessToken);
    } else {
      await SecureStore.deleteItemAsync('accessToken');
    }
    
    set({ accessToken });
  },

  setUser: (user: User | null) => {
    set({ user });
  },

  login: async (credentials: any) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.post('/auth/login', credentials);
      const { access_token } = response.data;
      await get().setTokens(access_token);
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
      await get().setTokens(access_token);
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
      await get().getMe(); 
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
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API failed', e);
    }

    try {
      const hasPreviousSignIn = await GoogleSignin.hasPreviousSignIn();
      if (hasPreviousSignIn) {
        await GoogleSignin.signOut();
        await GoogleSignin.revokeAccess();
      }
    } catch (googleError) {
      console.warn('Google SignOut error', googleError);
    }

    try {
      const { queryClient } = require('../api/queryClient');
      queryClient.clear();
    } catch (queryError) {
      console.warn('QueryClient clear error', queryError);
    }

    await get().setTokens(null);
    set({ user: null, isLoading: false });
  },

  getMe: async () => {
    try {
      set({ isLoading: true });
      const storedAccessToken = await SecureStore.getItemAsync('accessToken');
      
      if (storedAccessToken) {
        set({ accessToken: storedAccessToken });
      }
      
      const response = await apiClient.get('/auth/profile');
      set({ user: response.data, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
      await get().setTokens(null);
    }
  },
}));
