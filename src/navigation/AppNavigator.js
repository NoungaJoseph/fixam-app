import React, { useRef, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import ProviderTabNavigator from './ProviderTabNavigator';
import AnimatedSplashScreen from '../screens/Auth/AnimatedSplashScreen';
import { useNavigationStateContext } from '../context/NavigationStateContext';
import notificationService from '../services/notificationService';

import { createStackNavigator } from '@react-navigation/stack';
import { useSocket } from '../context/SocketContext';

const RootStack = createStackNavigator();

const getActiveRouteName = (state) => {
  if (!state?.routes?.length) return null;
  const route = state.routes[state.index || 0];
  if (route.state) return getActiveRouteName(route.state);
  return route.name;
};

const linking = {
  prefixes: ['fixam://', 'https://usefixam.com', 'https://*.usefixam.com'],
  config: {
    screens: {
      MainApp: {
        screens: {
          ProviderProfile: 'profile/:uid',
          TaskDetails: 'job/:taskId',
        },
      },
    },
  },
};

const AppNavigator = () => {
  const { user, isLoading, isRestoring } = useAuth();
  const { setCurrentRouteName } = useNavigationStateContext();
  const { on } = useSocket();
  const navigationRef = useRef(null);

  // Provide the navigation ref to the notification service so it can
  // navigate when the user taps a push notification (background / quit state).
  const onNavigationReady = useCallback(() => {
    notificationService.setNavigationRef(navigationRef.current);
    setCurrentRouteName(navigationRef.current?.getCurrentRoute?.()?.name || null);
  }, [setCurrentRouteName]);

  React.useEffect(() => {
    // Initialize FCM notifications only after user is authenticated.
    // This ensures the JWT auth token is already set on the axios instance
    // (via setAuthToken in AuthContext) before we try to sync the FCM token
    // to the backend, preventing "Not authorized, token failed" errors.
    if (user) {
      notificationService.initialize().catch((err) => {
        if (__DEV__) console.log('[FCM] Initialization error:', err.message);
      });
    }
  }, [user]);

  React.useEffect(() => {
    // Keep useEffect if needed for other socket events later, else empty
  }, [on]);

  if (isRestoring) {
    return <AnimatedSplashScreen onFinish={() => {}} navigation={{ replace: () => {} }} />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={onNavigationReady}
      onStateChange={(state) => setCurrentRouteName(getActiveRouteName(state))}
      linking={linking}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainApp">
          {() => (
            !user ? (
              <AuthNavigator />
            ) : (user.role?.toUpperCase() === 'PROVIDER' && user.providerProfile?.profileMode !== 'PERSONAL') ? (
              <ProviderTabNavigator />
            ) : (
              <TabNavigator />
            )
          )}
        </RootStack.Screen>

      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
