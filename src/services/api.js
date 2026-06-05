import axios from 'axios';

// Set EXPO_PUBLIC_API_URL for device builds, e.g. http://192.168.1.185:5000/api
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://fixam-backend-production.up.railway.app/api';
export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Increased from 10s to 30s for slow networks
});

api.interceptors.request.use(config => {
  if (__DEV__) console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
  return config;
}, error => {
  return Promise.reject(error);
});

api.interceptors.response.use(response => {
  if (__DEV__) console.log(`[API Response] ${response.status} from ${response.config.url}`);
  return response;
}, error => {
  if (__DEV__) console.log(`[API Error] ${error.response?.status} from ${error.config?.url}:`, error.response?.data || error.message);
  return Promise.reject(error);
});

export const SOCKET_URL = API_ORIGIN;

export const getMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  if (value.startsWith('file:')) return null;
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) {
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
