import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import api, { getMediaUrl, setAuthToken } from '../services/api';
import { requestStartupPermissions } from '../services/permissions';

const AuthContext = createContext();

export const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in ms

// Simple fallback storage for when AsyncStorage fails
const fallbackStorage = {};

const storeToken = async (key, value) => {
  try {
    if (value) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (key === 'authToken') {
        await SecureStore.setItemAsync(key, stringValue);
      } else {
        await AsyncStorage.setItem(key, stringValue);
      }
    } else {
      if (key === 'authToken') {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    }
  } catch (error) {
    // Fallback to memory storage
    if (value) {
      fallbackStorage[key] = typeof value === 'string' ? value : JSON.stringify(value);
    } else {
      delete fallbackStorage[key];
    }
  }
};

const getStoredToken = async (key) => {
  try {
    if (key === 'authToken') {
      return await SecureStore.getItemAsync(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  } catch (error) {
    return fallbackStorage[key] || null;
  }
};

const normalizeUser = (value) => {
  if (!value) return value;
  return {
    ...value,
    avatar: getMediaUrl(value.avatar),
    providerProfile: value.providerProfile ? {
      ...value.providerProfile,
      avatar: getMediaUrl(value.providerProfile.avatar),
    } : value.providerProfile,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoggedOut, setHasLoggedOut] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Restore token from AsyncStorage on app startup
  useEffect(() => {
    const restoreToken = async () => {
      try {
        const storedToken = await getStoredToken('authToken');
        const storedUserStr = await getStoredToken('authUser');
        
        if (storedToken && storedUserStr) {
          // Check for inactivity timeout
          const lastActiveStr = await AsyncStorage.getItem('last_active_time');
          const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : Date.now();
          
          if (Date.now() - lastActive > INACTIVITY_TIMEOUT) {
            // Session expired due to inactivity
            if (__DEV__) console.log('Session expired on startup due to inactivity');
            await storeToken('authToken', null);
            await storeToken('authUser', null);
            await AsyncStorage.removeItem('last_active_time');
            setHasLoggedOut(true);
          } else {
            const storedUser = JSON.parse(storedUserStr);
            setToken(storedToken);
            setUser(normalizeUser(storedUser));
            setAuthToken(storedToken);
            // Update last active time to current time
            await AsyncStorage.setItem('last_active_time', Date.now().toString());
            
            api.get('/users/me')
              .then((res) => {
                const freshUser = normalizeUser(res.data.data || res.data.user);
                if (freshUser) setUser(freshUser);
              })
              .catch(() => {});
          }
        }
      } catch (error) {
        if (__DEV__) console.log('Error restoring token:', error);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreToken();
  }, []);

  // Persist token to AsyncStorage when it changes
  useEffect(() => {
    if (token && user) {
      storeToken('authToken', token);
      storeToken('authUser', user);
      setAuthToken(token);
      AsyncStorage.setItem('last_active_time', Date.now().toString()).catch(() => {});
      requestStartupPermissions()
        .catch((error) => {
          if (__DEV__) console.log('Startup permissions skipped:', error.message);
        });
    } else if (!token && !user && !isRestoring) {
      storeToken('authToken', null);
      storeToken('authUser', null);
      AsyncStorage.removeItem('last_active_time').catch(() => {});
    }
  }, [token, user, isRestoring]);

  const loginWithOTP = async (email, phone, otp) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, phone, otp });
      setUser(normalizeUser(res.data.user));
      setToken(res.data.token);
      setHasLoggedOut(false);
      return res.data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDirect = (userData, userToken, newUser = false) => {
    setAuthToken(userToken);
    setUser(normalizeUser(userData));
    setToken(userToken);
    setHasLoggedOut(false);
    setIsNewUser(newUser);
  };

  const clearNewUser = () => setIsNewUser(false);

  const logout = () => {
    setUser(null);
    setToken(null);
    setHasLoggedOut(true);
  };

  const updateProfile = async (updates) => {
    try {
      const res = await api.put('/users/profile', updates);
      setUser(normalizeUser(res.data.data));
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    const res = await api.get('/users/me');
    const freshUser = normalizeUser(res.data.data || res.data.user);
    if (freshUser) setUser(freshUser);
    return freshUser;
  };

  const uploadFile = async (formData, endpoint = '/upload') => {
    try {
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  const verifyEmailRegistration = async (email, otp) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-email-otp', { email, otp });
      loginDirect(res.data.user, res.data.token, true);
      return res.data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading,
      isRestoring,
      loginWithOTP, 
      loginDirect,
      verifyEmailRegistration,
      logout, 
      updateProfile, 
      refreshUser,
      uploadFile,
      hasLoggedOut,
      isNewUser,
      clearNewUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
