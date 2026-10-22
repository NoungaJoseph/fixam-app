import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, StatusBar, TextInput, Keyboard, ActivityIndicator, Alert, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const OTPScreen = ({ route, navigation }) => {
  const { contact, method, role, purpose, dialCode = '+237' } = route.params || { contact: '', method: 'phone', role: 'CLIENT' };
  const { loginWithOTP, verifyEmailRegistration, isLoading } = useAuth();
  const { t, locale } = useLanguage();
  const { isDarkMode } = useTheme();
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [timer, setTimer] = useState(59);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input on mount with a slight delay for smoother transition
    const timerId = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 800);

    const interval = setInterval(() => {
      setTimer(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    
    return () => {
      clearTimeout(timerId);
      clearInterval(interval);
    };
  }, []);

  const handleOtpChange = (value) => {
    // Only allow numbers
    const cleanValue = value.replace(/[^0-9]/g, '');
    setOtp(cleanValue);
    
    if (cleanValue.length === 6 && !verifying && !isLoading) {
      Keyboard.dismiss();
      performVerify(cleanValue);
    }
  };

  const performVerify = async (code) => {
    if (verifying || isLoading || code.length !== 6) return;
    setVerifying(true);
    try {
      const email = method === 'email' ? contact : null;
      const phone = method === 'phone' ? contact : null;
      
      if (purpose === 'registration') {
        await verifyEmailRegistration(email, code);
      } else {
        await loginWithOTP(email, phone, code);
      }
      // AuthContext will update user state and trigger navigation to Home
    } catch (error) {
      const msg = error.response?.data?.message || t('otp.invalidCode');
      Alert.alert(t('otp.failed'), msg);
      setOtp('');
      // Refocus after error
      setTimeout(() => inputRef.current?.focus(), 500);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      const email = method === 'email' ? contact : null;
      const phone = method === 'phone' ? contact : null;
      await api.post('/auth/request-otp', { email, phone, language: locale });
      setTimer(60);
      Alert.alert(t('otp.success', 'Success'), t('otp.resendSuccess', 'A new code has been sent.'));
      if (inputRef.current) inputRef.current.focus();
    } catch (error) {
      const msg = error.response?.data?.message || t('otp.failed');
      Alert.alert(t('otp.error', 'Error'), msg);
    }
  };

  const maskedContact = method === 'phone' 
    ? `+237 ${contact.slice(0, 3)}••••${contact.slice(-2)}`
    : contact.replace(/(.{3})(.*)(@.*)/, "$1••••$3");

  const palette = {
    background: isDarkMode ? '#07111F' : '#F6F8FB',
    surface: isDarkMode ? '#101B2D' : '#FFFFFF',
    text: isDarkMode ? '#F8FAFC' : '#0F172A',
    muted: isDarkMode ? '#94A3B8' : '#64748B',
    border: isDarkMode ? '#26364D' : '#DCE4EE',
  };

  const displayContact = method === 'phone'
    ? `${dialCode} ${contact.slice(0, 3)}••••${contact.slice(-2)}`
    : contact.replace(/(.{3})(.*)(@.*)/, '$1••••$3');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={palette.text} />
          <Text style={[styles.logo, { color: palette.text }]}>{t('otp.verification')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons 
            name={method === 'phone' ? "cellphone-message" : "email-check-outline"} 
            size={50} 
            color="#0D9488" 
          />
        </View>

        <Text style={[styles.verifyTitle, { color: palette.text }]}>
          {method === 'phone' ? t('otp.checkSms') : t('otp.checkEmail')}
        </Text>
        <Text style={[styles.verifySubtitle, { color: palette.muted }]}>
          {t('otp.sentCode', { contact: displayContact })}
        </Text>

        <View style={{ position: 'relative' }}>
          {/* Visible OTP Boxes */}
          <View style={styles.otpRow}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <View key={i} style={[styles.otpBox, { backgroundColor: palette.surface, borderColor: palette.border }, otp.length === i && styles.otpBoxActive]}>
                <Text style={[styles.otpDigit, { color: palette.text }]}>{otp[i] || ''}</Text>
              </View>
            ))}
          </View>

          {/* Hidden TextInput overlaid natively to ensure keyboard opens on tap */}
          <TextInput
            ref={inputRef}
            value={otp}
            onChangeText={handleOtpChange}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.hiddenInput}
            caretHidden
            autoFocus={true}
            blurOnSubmit={false}
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            textContentType="oneTimeCode"
            importantForAutofill="yes"
          />
        </View>

        <View style={styles.resendContainer}>
          <Text style={styles.timerText}>
            {t('otp.resendIn', { time: `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}` })}
          </Text>
          {timer === 0 && (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>{t('otp.resendNow')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.verifyBtn, (otp.length < 6 || isLoading || verifying) && styles.verifyBtnDisabled]}
          disabled={otp.length < 6 || isLoading || verifying}
          onPress={() => performVerify(otp)}
        >
          {isLoading || verifying ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.verifyBtnText}>{t('otp.verifyContinue')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 15 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 44, alignItems: 'center' },
  iconCircle: { width: 76, height: 76, borderRadius: 22, backgroundColor: '#E7F7F4', justifyContent: 'center', alignItems: 'center', marginBottom: 28 },
  verifyTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 12, textAlign: 'center' },
  verifySubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  hiddenInput: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent',
  },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  otpBox: { width: 44, height: 58, borderWidth: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  otpBoxActive: { borderColor: '#0D9488', backgroundColor: '#FFF' },
  otpDigit: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  resendContainer: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  timerText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  resendLink: { fontSize: 14, color: '#0D9488', fontWeight: '700', textDecorationLine: 'underline' },
  verifyBtn: { backgroundColor: '#0D9488', width: '100%', height: 54, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});

export default OTPScreen;
