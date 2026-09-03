import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set EXPO_PUBLIC_API_URL for device builds, e.g. http://192.168.1.185:5000/api
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.usefixam.com/api';
export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

let lowDataModeEnabled = false;
AsyncStorage.getItem('data_saver_enabled')
  .then((value) => {
    lowDataModeEnabled = value === 'true';
  })
  .catch(() => {});

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 35000, // 35s timeout to support slow 2G/3G/4G connections
  validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
});

let lastActiveWriteTime = 0;

const inFlightGetRequests = new Map();

api.interceptors.request.use(config => {
  if (__DEV__) console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
  
  const now = Date.now();
  if (now - lastActiveWriteTime > 60000) {
    lastActiveWriteTime = now;
    AsyncStorage.setItem('last_active_time', now.toString()).catch(() => {});
  }
  
  // Ensure lightweight gzip encoding is preferred
  config.headers = config.headers || {};
  if (!config.headers['Accept-Encoding']) {
    config.headers['Accept-Encoding'] = 'gzip, deflate';
  }

  return config;
}, error => {
  return Promise.reject(error);
});

let onUnauthorizedCallback = null;

export const registerUnauthorizedListener = (callback) => {
  onUnauthorizedCallback = callback;
};

// Automatic retry with exponential backoff for idempotent GET requests on slow/dropped connections
api.interceptors.response.use(response => {
  if (__DEV__) console.log(`[API Response] ${response.status} from ${response.config.url}`);
  return response;
}, async error => {
  const config = error.config;
  
  // If request failed due to network timeout/disconnect and hasn't exceeded 2 retries (for safe GET requests)
  if (config && config.method === 'get') {
    config._retryCount = config._retryCount || 0;
    if (config._retryCount < 2 && (error.code === 'ECONNABORTED' || !error.response || error.message?.includes('Network Error'))) {
      config._retryCount += 1;
      const delayMs = config._retryCount * 1500;
      if (__DEV__) console.log(`[API Retry ${config._retryCount}/2] Retrying slow request in ${delayMs}ms: ${config.url}`);
      await new Promise(res => setTimeout(res, delayMs));
      return api(config);
    }
  }

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
  if (!value) return null;
  if (typeof value === 'object' && value?.uri) value = value.uri;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Handle local device URIs from mobile camera / file picker
  if (trimmed.startsWith('file:') || trimmed.startsWith('content:')) {
    return trimmed;
  }

  // Normalize /uploads/ paths so they dynamically point to active API_ORIGIN
  if (trimmed.includes('/uploads/')) {
    const relativePath = '/uploads/' + trimmed.split('/uploads/')[1];
    return `${API_ORIGIN}${relativePath}`;
  }

  // Handles relative paths
  if (trimmed.startsWith('/') || trimmed.startsWith('uploads/')) {
    return `${API_ORIGIN}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  }

  const maybeLowDataUrl = (url) => {
    if (!lowDataModeEnabled) return url;
    if (!/\/storage\/v1\/object\/public\//i.test(url)) return url;
    if (!/\.(jpe?g|png|webp|gif)(\?|#|$)/i.test(url)) return url;

    const separator = url.includes('?') ? '&' : '?';
    if (/[?&](width|quality)=/i.test(url)) return url;
    return `${url}${separator}width=720&quality=55`;
  };

  // Handle standard http/https/data URLs
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    if (trimmed.startsWith('//')) return maybeLowDataUrl(`https:${trimmed}`);
    return maybeLowDataUrl(trimmed);
  }

  return `${API_ORIGIN}/${trimmed.startsWith('/') ? trimmed.substring(1) : trimmed}`;
};

export const setLowDataModePreference = (enabled) => {
  lowDataModeEnabled = Boolean(enabled);
};

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
