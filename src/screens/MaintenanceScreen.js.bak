import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../services/theme';

const MaintenanceScreen = ({ message }) => {
  const insets = useSafeAreaInsets();

  // Pulsing dot animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Status text opacity for blink
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse the icon gently
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Blink the "Checking status..." dot
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.delay(3800),
      ])
    );

    pulse.start();
    blink.start();

    return () => {
      pulse.stop();
      blink.stop();
    };
  }, [pulseAnim, blinkAnim]);

  const displayMessage =
    message || 'We are improving Fixam for you. Back soon!';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      

      {/* Icon */}
      <Animated.View
        style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}
      >
        <MaterialCommunityIcons name="tools" size={80} color="#FFFFFF" />
      </Animated.View>

      {/* Title */}
      <Text style={styles.title}>We'll be right back</Text>

      {/* Message */}
      <Text style={styles.message}>{displayMessage}</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Brand name */}
      <Text style={styles.brand}>Fixam</Text>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Checking status indicator */}
      <View style={styles.statusRow}>
        <Animated.View style={[styles.dot, { opacity: blinkAnim }]} />
        <Text style={styles.statusText}>Checking status…</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrapper: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.80)',
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 24,
    marginBottom: 32,
  },
  divider: {
    width: 56,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.30)',
    marginBottom: 20,
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  spacer: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.50)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default MaintenanceScreen;
