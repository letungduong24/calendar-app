import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Simplified response interceptor (no refresh logic)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If we get a 401, it means the token has truly expired or is invalid.
    // We should probably redirect to login or clear state here, 
    // but we'll leave it to the store/components to handle the error.
    return Promise.reject(error);
  }
);

export default apiClient;
