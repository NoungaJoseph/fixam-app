import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Animated, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';

const VerificationSuccessScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // Navigate back to the main app Settings tab (shows navbar at bottom)
  const goBackToSettings = () => {
    // Navigate to the SettingsMain in the Settings tab - this keeps the tab bar visible
    navigation.navigate('SettingsMain');
  };

  return (
    <View 
      style={[styles.background, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Animated checkmark */}
          <View style={styles.iconWrap}>
            <Animated.View style={[styles.iconCircle, { backgroundColor: '#22C55E', transform: [{ scale: scaleAnim }] }]}>
              <MaterialCommunityIcons name="check-bold" size={52} color="#FFF" />
            </Animated.View>
          </View>

          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
            <Text style={[styles.title, { color: colors.text }]}>Documents Submitted!</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Your verification documents have been successfully received. Our team will review them and notify you once the process is complete.
            </Text>

            {/* Info card */}
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#EEF4FF' }]}>
                  <MaterialCommunityIcons name="clock-outline" size={22} color={colors.accent} />
                </View>
                <View style={styles.infoText}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>Processing Time</Text>
                  <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>Verification can take up to 48 hours</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#ECFDF5' }]}>
                  <MaterialCommunityIcons name="bell-ring-outline" size={22} color="#22C55E" />
                </View>
                <View style={styles.infoText}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>You'll be notified</Text>
                  <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>A push notification will be sent once your verification is approved or if more info is needed.</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FFF7ED' }]}>
                  <MaterialCommunityIcons name="shield-check-outline" size={22} color="#F97316" />
                </View>
                <View style={styles.infoText}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>Secure & Private</Text>
                  <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>Your data is encrypted and will never be shared without your consent.</Text>
                </View>
              </View>
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: '#22C55E' }]}
              onPress={goBackToSettings}
            >
              <MaterialCommunityIcons name="check" size={20} color="#FFF" />
              <Text style={styles.doneBtnText}>Go to Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>View Submission</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 40,
  },
  iconWrap: { alignItems: 'center', marginBottom: 28 },
  iconCircle: {
    width: 110, height: 110, borderRadius: 55,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#22C55E', shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 28, paddingHorizontal: 10 },
  infoCard: { width: '100%', borderRadius: 22, borderWidth: 1, padding: 20, marginBottom: 28 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 4 },
  infoIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  infoDesc: { fontSize: 13, lineHeight: 19 },
  divider: { height: 1, marginVertical: 14 },
  doneBtn: {
    width: '100%', height: 52, borderRadius: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    marginBottom: 12,
  },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  secondaryBtn: {
    width: '100%', height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '700' },
});

export default VerificationSuccessScreen;
