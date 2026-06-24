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
import { COLORS } from '../services/theme';

const MaintenanceScreen = ({ message }) => {
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.delay(3800),
      ])
    );
    pulse.start();
    blink.start();
    return () => { pulse.stop(); blink.stop(); };
  }, [pulseAnim, blinkAnim]);

  const displayMessage = message || 'We are improving Fixam for you. Back soon!';
  const paddingTop = (insets?.top || 0) + 24;
  const paddingBottom = (insets?.bottom || 0) + 24;

  return (
    <View style={[styles.container, { paddingTop, paddingBottom }]}>
      <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <MaterialCommunityIcons name="tools" size={80} color="#FFFFFF" />
      </Animated.View>
      <Text style={styles.title}>We'll be right back</Text>
      <Text style={styles.message}>{displayMessage}</Text>
      <View style={styles.divider} />
      <Text style={styles.brand}>FIXAM</Text>
      <View style={styles.spacer} />
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
    backgroundColor: COLORS.primary || '#0D1B2A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrapper: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 16 },
  message: { fontSize: 16, color: 'rgba(255,255,255,0.80)', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  divider: { width: 56, height: 1, backgroundColor: 'rgba(255,255,255,0.30)', marginBottom: 20 },
  brand: { fontSize: 20, fontWeight: 'bold', color: 'rgba(255,255,255,0.55)', letterSpacing: 4 },
  spacer: { flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF', marginRight: 8 },
  statusText: { fontSize: 13, color: 'rgba(255,255,255,0.50)', fontWeight: 'bold' },
});

export default MaintenanceScreen;
