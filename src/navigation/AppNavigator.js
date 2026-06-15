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
import CallScreen from '../screens/Call/CallScreen';
import IncomingCallScreen from '../screens/Call/IncomingCallScreen';

const RootStack = createStackNavigator();

const getActiveRouteName = (state) => {
  if (!state?.routes?.length) return null;
  const route = state.routes[state.index || 0];
  if (route.state) return getActiveRouteName(route.state);
  return route.name;
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
    if (!on) return;
    const offIncoming = on('call:incoming', (data) => {
      navigationRef.current?.navigate('IncomingCall', {
        callId: data.callId,
        caller: {
          id: data.callerId,
          name: data.callerName,
          avatar: data.callerAvatar
        },
        callType: data.callType
      });
    });
    
    return () => {
      offIncoming?.();
    };
  }, [on]);

  if (isRestoring) {
    return <AnimatedSplashScreen onFinish={() => {}} navigation={{ replace: () => {} }} />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={onNavigationReady}
      onStateChange={(state) => setCurrentRouteName(getActiveRouteName(state))}
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
        <RootStack.Screen 
          name="Call" 
          component={CallScreen}
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <RootStack.Screen 
          name="IncomingCall" 
          component={IncomingCallScreen}
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
