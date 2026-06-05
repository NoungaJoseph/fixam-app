import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '../context/ThemeContext';

const getBiometricLabel = async () => {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Fingerprint';
  return 'Biometric';
};

const BiometricLockScreen = ({ user, onUnlock, onUsePassword }) => {
  const { colors } = useTheme();
  const [label, setLabel] = useState('Biometric');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const firstName = user?.fullName?.split(' ')?.[0] || 'there';

  const unlock = useCallback(async () => {
    setChecking(true);
    setError('');
    try {
      const nextLabel = await getBiometricLabel();
      setLabel(nextLabel);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Unlock with ${nextLabel}`,
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });
      if (result.success) {
        onUnlock?.();
      } else {
        setError('Biometric verification failed. Try again or use your password.');
      }
    } catch (_) {
      setError('Biometric verification failed. Try again or use your password.');
    } finally {
      setChecking(false);
    }
  }, [onUnlock]);

  useEffect(() => {
    getBiometricLabel().then(setLabel).catch(() => {});
    unlock();
  }, [unlock]);

  return (
    <View style={[styles.container, { backgroundColor: colors.accent }]}>
      <View style={styles.center}>
        <Image source={require('../../assets/fixam.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>Fixam</Text>
        <Text style={styles.welcome}>Welcome back, {firstName}</Text>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name={label === 'Face ID' ? 'face-recognition' : 'fingerprint'} size={54} color={colors.accent} />
        </View>
        <Text style={styles.unlockLabel}>Unlock with {label}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.unlockButton} onPress={unlock} disabled={checking}>
          {checking ? <ActivityIndicator color={colors.accent} /> : <Text style={[styles.unlockText, { color: colors.accent }]}>Unlock</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={onUsePassword} style={styles.passwordLink}>
          <Text style={styles.passwordText}>Use Password Instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  center: { width: '100%', alignItems: 'center' },
  logo: { width: 86, height: 86, marginBottom: 10 },
  appName: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
  welcome: { color: 'rgba(255,255,255,0.86)', fontSize: 16, fontWeight: '700', marginTop: 8 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginTop: 36 },
  unlockLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 20 },
  error: { color: '#FFFFFF', textAlign: 'center', marginTop: 12, fontWeight: '700' },
  unlockButton: { minWidth: 190, height: 52, borderRadius: 8, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginTop: 26 },
  unlockText: { fontSize: 16, fontWeight: '900' },
  passwordLink: { marginTop: 22, padding: 8 },
  passwordText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', textDecorationLine: 'underline' },
});

export default BiometricLockScreen;
