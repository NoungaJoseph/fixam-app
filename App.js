import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { theme } from './src/services/theme';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { AppProvider } from './src/context/AppContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { useAuth } from './src/context/AuthContext';
import { NavigationStateProvider } from './src/context/NavigationStateContext';
import AppNavigator from './src/navigation/AppNavigator';
import CallModal from './src/components/CallModal';
import SupportChatButton from './src/components/SupportChatButton';
import BiometricLockScreen from './src/components/BiometricLockScreen';
import * as SecureStore from 'expo-secure-store';
import * as Sentry from '@sentry/react-native';
import axios from 'axios';
import MaintenanceScreen from './src/screens/MaintenanceScreen';
import notificationService from './src/services/notificationService';
import AnimatedSplashScreen from './src/screens/Auth/AnimatedSplashScreen';
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold, 
  Inter_900Black 
} from '@expo-google-fonts/inter';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  tracesSampleRate: 1.0,
  enabled: false,
});

// ---------------------------------------------------------------------------
// Maintenance gate — checked once at startup, rechecked every 5 min if active
// ---------------------------------------------------------------------------
const useMaintenanceCheck = () => {
  const [appReady, setAppReady] = React.useState(false);
  const [maintenance, setMaintenance] = React.useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = React.useState('');
  const intervalRef = React.useRef(null);

  const checkStatus = React.useCallback(async () => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
      const response = await Promise.race([
        axios.get(`${API_URL}/api/system/status`),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3000)
        ),
      ]);

      const inMaintenance = response?.data?.maintenance === true;
      setMaintenance(inMaintenance);
      setMaintenanceMsg(response?.data?.message || '');

      if (inMaintenance) {
        // Poll every 5 minutes while in maintenance
        if (!intervalRef.current) {
          intervalRef.current = setInterval(checkStatus, 5 * 60 * 1000);
        }
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (_) {
      // Timeout or network error — fail open, proceed normally
      setMaintenance(false);
    } finally {
      setAppReady(true);
    }
  }, []);

  React.useEffect(() => {
    checkStatus();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkStatus]);

  return { appReady, maintenance, maintenanceMsg };
};

const AppChrome = () => {
  const { isDarkMode } = useTheme();
  const { user, token, isRestoring, logout } = useAuth();
  const [locked, setLocked] = useState(false);
  const backgroundAtRef = useRef(null);

  useEffect(() => {
    if (user && token) {
      notificationService.initialize().catch(console.error);
    }
  }, [user, token]);

  useEffect(() => {
    let cancelled = false;
    const checkInitialLock = async () => {
      if (isRestoring || !user) return;
      const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled');
      const storedToken = await SecureStore.getItemAsync('authToken');
      if (!cancelled && biometricEnabled === 'true' && storedToken) {
        setLocked(true);
      }
    };
    checkInitialLock().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isRestoring, user]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'background') {
        backgroundAtRef.current = Date.now();
        return;
      }
      if (state === 'active' && user && token && backgroundAtRef.current) {
        const elapsed = Date.now() - backgroundAtRef.current;
        backgroundAtRef.current = null;
        if (elapsed > 30000) {
          const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled');
          if (biometricEnabled === 'true') setLocked(true);
        }
      }
    });
    return () => subscription.remove();
  }, [token, user]);

  if (locked && user) {
    return <BiometricLockScreen user={user} onUnlock={() => setLocked(false)} onUsePassword={() => { setLocked(false); logout(); }} />;
  }

  // Apply global default font
  const oldTextRender = React.createElement;
  if (!global.textFontPatched) {
    global.textFontPatched = true;
    const { Text, TextInput } = require('react-native');
    const oldRender = Text.render;
    if (oldRender) {
      Text.render = function(...args) {
        const origin = oldRender.call(this, ...args);
        return React.cloneElement(origin, {
          style: [{ fontFamily: 'Inter-Regular' }, origin.props.style]
        });
      };
    }
    const oldTextInputRender = TextInput.render;
    if (oldTextInputRender) {
      TextInput.render = function(...args) {
        const origin = oldTextInputRender.call(this, ...args);
        return React.cloneElement(origin, {
          style: [{ fontFamily: 'Inter-Regular' }, origin.props.style]
        });
      };
    }
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#14B8A6" />
      <AppNavigator />
      <SupportChatButton />
      <CallModal />
    </>
  );
};

function App() {
  const { appReady, maintenance, maintenanceMsg } = useMaintenanceCheck();
  
  let [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-Black': Inter_900Black,
  });

  if (!appReady || !fontsLoaded) {
    // Show the animated splash while the status check resolves (max 3s)
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AnimatedSplashScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (maintenance) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <MaintenanceScreen message={maintenanceMsg} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <LanguageProvider>
            <ThemeProvider>
              <AuthProvider>
                <SocketProvider>
                  <AppProvider>
                    <NavigationStateProvider>
                      <AppChrome />
                    </NavigationStateProvider>
                  </AppProvider>
                </SocketProvider>
              </AuthProvider>
            </ThemeProvider>
          </LanguageProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);
