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
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh') {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        try {
          // Use base axios to avoid infinite loops
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token } = data;

          await SecureStore.setItemAsync('accessToken', access_token);
          await SecureStore.setItemAsync('refreshToken', refresh_token);

          apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`;
          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          processQueue(null, access_token);
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
