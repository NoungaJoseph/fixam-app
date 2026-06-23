import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import api from './api';

class NotificationService {
  constructor() {
    this._navigationRef = null;
    this._unsubscribeOpened = null;
  }

  /**
   * Pass in the NavigationContainer ref so the service can navigate.
   * Call this from AppNavigator after the ref is created.
   */
  setNavigationRef(ref) {
    this._navigationRef = ref;
  }

  /**
   * Navigate based on notification data payload.
   * Called from both quit-state and background-state tap handlers.
   */
  handleNotificationNavigation(data) {
    const nav = this._navigationRef;
    if (!nav || !nav.isReady || !nav.isReady()) return;

    const type = data?.type;

    switch (type) {
      case 'NEW_MESSAGE':
        nav.navigate('Messages');
        setTimeout(() => {
          if (data.conversationId) {
            nav.navigate('Chat', {
              conversationId: data.conversationId
            });
          }
        }, 100);
        break;

      case 'NEW_BOOKING':
      case 'BOOKING_CONFIRMED':
      case 'BOOKING_SENT':
        if (data.bookingId || data.jobId) {
          nav.navigate('JobStatus', { 
            job: { id: data.bookingId || data.jobId }, 
            jobId: data.bookingId || data.jobId,
            isBooking: true 
          });
        } else {
          nav.navigate('HomeMain');
        }
        break;

      case 'NEW_APPLICATION':
      case 'APPLICATION_ACCEPTED':
      case 'JOB_COMPLETED':
      case 'JOB_APPROVED':
      case 'JOB_REJECTED':
        if (data.jobId) {
          nav.navigate('JobStatus', { 
            job: { id: data.jobId },
            jobId: data.jobId 
          });
        } else {
          nav.navigate('HomeMain');
        }
        break;

      case 'COINS_ADDED':
        nav.navigate('Wallet');
        break;

      default:
        nav.navigate('Notifications');
        break;
    }
  }

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
   * Setup foreground, background, and quit-state notification listeners.
   * Must be called AFTER setNavigationRef so navigation works for taps.
   */
  setupListeners() {
    // Listen to token refresh
    messaging().onTokenRefresh(async (token) => {
      console.log('[FCM] Token refreshed:', token);
      await this.syncTokenWithBackend(token);
    });

    // Foreground message handler — show in-app toast or update badge
    messaging().onMessage(async (remoteMessage) => {
      console.log('[FCM] Foreground message arrived:', JSON.stringify(remoteMessage));
      // Handled globally or by toast
    });

    // App was in BACKGROUND and user tapped the notification
    if (this._unsubscribeOpened) {
      this._unsubscribeOpened();
    }
    this._unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[FCM] onNotificationOpenedApp:', JSON.stringify(remoteMessage?.data));
      if (remoteMessage?.data) {
        this.handleNotificationNavigation(remoteMessage.data);
      }
    });

    // App was QUIT and user tapped the notification to open it
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage?.data) {
          console.log('[FCM] getInitialNotification:', JSON.stringify(remoteMessage.data));
          // Delay to let the navigation tree mount fully
          setTimeout(() => {
            this.handleNotificationNavigation(remoteMessage.data);
          }, 1200);
        }
      })
      .catch((err) => console.error('[FCM] getInitialNotification error:', err));
  }

  /**
   * Initialize notification services.
   * Should be called right after successful login or app startup if authenticated.
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
