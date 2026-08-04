import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set EXPO_PUBLIC_API_URL for device builds, e.g. http://192.168.1.185:5000/api
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.usefixam.com/api';
export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Reduced from 30s to 15s for snappier failure handling
});

let lastActiveWriteTime = 0;

api.interceptors.request.use(config => {
  if (__DEV__) console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
  
  const now = Date.now();
  if (now - lastActiveWriteTime > 60000) {
    lastActiveWriteTime = now;
    AsyncStorage.setItem('last_active_time', now.toString()).catch(() => {});
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

let onUnauthorizedCallback = null;

export const registerUnauthorizedListener = (callback) => {
  onUnauthorizedCallback = callback;
};

api.interceptors.response.use(response => {
  if (__DEV__) console.log(`[API Response] ${response.status} from ${response.config.url}`);
  return response;
}, error => {
  if (__DEV__) console.log(`[API Error] ${error.response?.status} from ${error.config?.url}:`, error.response?.data || error.message);
  
  if (error.response?.status === 401) {
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    AsyncStorage.removeItem('authToken').catch(() => {});
    AsyncStorage.removeItem('authUser').catch(() => {});
    AsyncStorage.removeItem('last_active_time').catch(() => {});
  }
  
  return Promise.reject(error);
});

export const SOCKET_URL = API_ORIGIN;

export const getMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  if (value.startsWith('file:') || value.startsWith('content:') || value.startsWith('data:') || /^(https?:)?\/\//i.test(value)) {
    return value;
  }
  return `${API_ORIGIN}${value.startsWith('/') ? '' : '/'}${value}`;
};

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
