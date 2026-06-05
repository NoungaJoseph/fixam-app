import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PERMISSIONS_KEY = 'fixam:native-permissions-requested:v1';
const PUSH_TOKEN_KEY = 'fixam:expo-push-token:v1';

export const requestStartupPermissions = async () => {
  const alreadyAsked = await AsyncStorage.getItem(PERMISSIONS_KEY);
  let pushToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);

  try {
    const isExpoGo = Constants.appOwnership === 'expo';
    if (Device.isDevice && !isExpoGo) {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Fixam',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#14B8A6',
        });
      }

      const notificationStatus = await Notifications.getPermissionsAsync();
      const finalStatus = notificationStatus.granted || alreadyAsked === 'yes'
        ? notificationStatus
        : await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });

      if (finalStatus.granted && !pushToken) {
        const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
        if (projectId) {
          const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
          pushToken = tokenResult.data;
          await AsyncStorage.setItem(PUSH_TOKEN_KEY, pushToken);
        }
      }
    }

    if (alreadyAsked !== 'yes') {
      const locationStatus = await Location.getForegroundPermissionsAsync();
      if (!locationStatus.granted) {
        await Location.requestForegroundPermissionsAsync();
      }
    }

    return pushToken;
  } finally {
    if (alreadyAsked !== 'yes') {
      await AsyncStorage.setItem(PERMISSIONS_KEY, 'yes').catch(() => {});
    }
  }
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
