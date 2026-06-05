import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import api from './api';

class NotificationService {
  /**
   * Request permission for notifications (iOS requires explicit permission, 
   * Android 13+ requires it too).
   */
  async requestUserPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[FCM] Authorization status:', authStatus);
      }
      return enabled;
    } catch (error) {
      console.error('[FCM] Permission error:', error);
      return false;
    }
  }

  /**
   * Get the FCM device token and send it to our backend.
   */
  async getFCMToken() {
    try {
      if (Platform.OS === 'ios') {
        // Required for iOS before getting token
        await messaging().registerDeviceForRemoteMessages();
      }

      const token = await messaging().getToken();
      if (token) {
        console.log('[FCM] Token generated:', token);
        await this.syncTokenWithBackend(token);
      }
      return token;
    } catch (error) {
      console.error('[FCM] Token error:', error);
      return null;
    }
  }

  /**
   * Sync token to the backend
   */
  async syncTokenWithBackend(fcmToken) {
    try {
      await api.put('/users/fcm-token', { fcmToken });
      console.log('[FCM] Token synced to backend successfully');
    } catch (error) {
      console.error('[FCM] Failed to sync token to backend:', error?.response?.data || error.message);
    }
  }

  /**
   * Setup foreground and background notification listeners
   */
  setupListeners() {
    // Listen to token refresh
    messaging().onTokenRefresh(async (token) => {
      console.log('[FCM] Token refreshed:', token);
      await this.syncTokenWithBackend(token);
    });

    // Foreground message handler
    messaging().onMessage(async (remoteMessage) => {
      console.log('[FCM] A new FCM message arrived in foreground!', JSON.stringify(remoteMessage));
      // You can trigger local notifications or show in-app toasts here
    });
  }

  /**
   * Initialize notification services
   * Should be called right after successful login or app startup if authenticated
   */
  async initialize() {
    const hasPermission = await this.requestUserPermission();
    if (hasPermission) {
      await this.getFCMToken();
      this.setupListeners();
    }
  }
}

export default new NotificationService();
