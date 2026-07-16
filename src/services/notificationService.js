import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import api from './api';

class NotificationService {
  constructor() {
    this._navigationRef = null;
    this._unsubscribeOpened = null;
    this._localResponseSubscription = null;
    this._initialized = false;
    this._lastHandledNotificationResponseId = null;
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
    this.clearBadge().catch(console.error);
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

      case 'COUNTER_PROPOSED':
        if (data.bookingId || data.jobId) {
          nav.navigate('JobStatus', { 
            job: { 
              id: data.bookingId || data.jobId,
              status: 'COUNTER_PROPOSED',
              counterBudget: Number(data.counterBudget || 0),
              counterNotes: data.counterNotes || '',
              urgencyLevel: data.urgencyLevel || 'EMERGENCY',
              budget: 0,
              provider: {
                fullName: data.providerName || 'Provider',
                avatar: data.providerAvatar || ''
              }
            }, 
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
      
      const { notification, data } = remoteMessage;
      if (notification) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title || 'New Notification',
              body: notification.body || '',
              data: data || {},
              sound: true,
              android: {
                channelId: 'default',
                sound: true,
              }
            },
            trigger: null, // show immediately
          });
        } catch (scheduleErr) {
          console.error('[NotificationService] Local schedule error:', scheduleErr);
        }
      }
    });

    // Clean up previous local notification tap listener if it exists
    if (this._localResponseSubscription) {
      this._localResponseSubscription.remove();
    }
    // Listen for notification taps on local notifications
    this._localResponseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const notificationId = response.notification.request.identifier;
      if (this._lastHandledNotificationResponseId === notificationId) {
        console.log('[Local Notification] Already handled:', notificationId);
        return;
      }
      this._lastHandledNotificationResponseId = notificationId;

      const data = response.notification.request.content.data;
      console.log('[Local Notification] Tapped:', JSON.stringify(data));
      if (data) {
        this.handleNotificationNavigation(data);
      }
    });

    // App was in BACKGROUND and user tapped the notification
    if (this._unsubscribeOpened) {
      this._unsubscribeOpened();
    }
    this._unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      const messageId = remoteMessage?.messageId;
      if (messageId && this._lastHandledNotificationResponseId === messageId) {
        console.log('[FCM] Already handled background notification:', messageId);
        return;
      }
      if (messageId) {
        this._lastHandledNotificationResponseId = messageId;
      }

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
          const messageId = remoteMessage.messageId;
          if (messageId && this._lastHandledNotificationResponseId === messageId) {
            console.log('[FCM] Already handled initial notification:', messageId);
            return;
          }
          if (messageId) {
            this._lastHandledNotificationResponseId = messageId;
          }

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
   * Clear the app notification badge count.
   */
  async clearBadge() {
    try {
      if (Platform.OS !== 'web') {
        await Notifications.setBadgeCountAsync(0);
        console.log('[NotificationService] Badge cleared successfully');
      }
    } catch (error) {
      console.warn('[NotificationService] Failed to clear badge:', error);
    }
  }

  async initialize() {
    if (this._initialized) return;
    this._initialized = true;

    await this.clearBadge().catch(console.error);

    const hasPermission = await this.requestUserPermission();
    if (hasPermission) {
      await this.getFCMToken();
      this.setupListeners();
    }
  }
}

export default new NotificationService();
