import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import ProviderTabNavigator from './ProviderTabNavigator';
import AnimatedSplashScreen from '../screens/Auth/AnimatedSplashScreen';
import { useNavigationStateContext } from '../context/NavigationStateContext';

const getActiveRouteName = (state) => {
  if (!state?.routes?.length) return null;
  const route = state.routes[state.index || 0];
  if (route.state) return getActiveRouteName(route.state);
  return route.name;
};

const AppNavigator = () => {
  const { user, isLoading, isRestoring } = useAuth();
  const { setCurrentRouteName } = useNavigationStateContext();
  const navigationRef = useRef(null);

  if (isLoading || isRestoring) {
    return <AnimatedSplashScreen onFinish={() => {}} navigation={{ replace: () => {} }} />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setCurrentRouteName(navigationRef.current?.getCurrentRoute?.()?.name || null)}
      onStateChange={(state) => setCurrentRouteName(getActiveRouteName(state))}
    >
      {!user ? (
        <AuthNavigator />
      ) : (user.role?.toUpperCase() === 'PROVIDER' && user.providerProfile?.profileMode !== 'PERSONAL') ? (
        <ProviderTabNavigator />
      ) : (
        <TabNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
