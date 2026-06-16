import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, StatusBar, TextInput, Keyboard, ActivityIndicator, Alert, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const OTPScreen = ({ route, navigation }) => {
  const { contact, method, role, purpose } = route.params || { contact: '', method: 'phone', role: 'CLIENT' };
  const { loginWithOTP, verifyEmailRegistration, isLoading } = useAuth();
  const { t, locale } = useLanguage();
  const [otp, setOtp] = useState('');
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
    
    if (cleanValue.length === 6) {
      Keyboard.dismiss();
      performVerify(cleanValue);
    }
  };

  const performVerify = async (code) => {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#0F172A" />
          <Text style={styles.logo}>{t('otp.verification')}</Text>
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

        <Text style={styles.verifyTitle}>
          {method === 'phone' ? t('otp.checkSms') : t('otp.checkEmail')}
        </Text>
        <Text style={styles.verifySubtitle}>
          {t('otp.sentCode', { contact: maskedContact })}
        </Text>

        <View style={{ position: 'relative' }}>
          {/* Visible OTP Boxes */}
          <View style={styles.otpRow}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <View key={i} style={[styles.otpBox, otp.length === i && styles.otpBoxActive]}>
                <Text style={styles.otpDigit}>{otp[i] || ''}</Text>
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
          style={[styles.verifyBtn, (otp.length < 6 || isLoading) && styles.verifyBtnDisabled]}
          disabled={otp.length < 6 || isLoading}
          onPress={() => performVerify(otp)}
        >
          {isLoading ? (
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
  body: { flex: 1, paddingHorizontal: 30, paddingTop: 40, alignItems: 'center' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
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
  otpBox: { width: 45, height: 60, borderWidth: 2, borderColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  otpBoxActive: { borderColor: '#0D9488', backgroundColor: '#FFF' },
  otpDigit: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  resendContainer: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  timerText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  resendLink: { fontSize: 14, color: '#0D9488', fontWeight: '700', textDecorationLine: 'underline' },
  verifyBtn: { backgroundColor: '#0F172A', width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});

export default OTPScreen;
