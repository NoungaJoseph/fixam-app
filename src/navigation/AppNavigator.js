import React, { useRef, useCallback } from 'react';
import { NavigationContainer, DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import ProviderTabNavigator from './ProviderTabNavigator';
import AnimatedSplashScreen from '../screens/Auth/AnimatedSplashScreen';
import { useNavigationStateContext } from '../context/NavigationStateContext';
import { useTheme } from '../context/ThemeContext';
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
  const { isDarkMode, colors } = useTheme();
  const { setCurrentRouteName } = useNavigationStateContext();
  const { on } = useSocket();
  const navigationRef = useRef(null);

  const baseNavTheme = isDarkMode ? NavDarkTheme : NavDefaultTheme;
  const defaultFonts = baseNavTheme?.fonts || {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '600' },
    heavy: { fontFamily: 'System', fontWeight: '700' },
  };

  const navTheme = {
    ...baseNavTheme,
    dark: isDarkMode,
    colors: {
      ...(baseNavTheme?.colors || {}),
      primary: colors.accent,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
    fonts: {
      ...defaultFonts,
      regular: { ...defaultFonts.regular },
      medium: { ...defaultFonts.medium },
      bold: { ...defaultFonts.bold },
      heavy: { ...defaultFonts.heavy },
    },
  };

  // Provide the navigation ref to the notification service so it can
  // navigate when the user taps a push notification (background / quit state).
  const onNavigationReady = useCallback(() => {
    notificationService.setNavigationRef(navigationRef.current);
    setCurrentRouteName(navigationRef.current?.getCurrentRoute?.()?.name || null);
  }, [setCurrentRouteName]);

  React.useEffect(() => {
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
      theme={navTheme}
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
