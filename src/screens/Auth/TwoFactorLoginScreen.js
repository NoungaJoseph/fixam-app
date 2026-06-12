import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, StatusBar, TextInput, Keyboard, ActivityIndicator, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const TwoFactorLoginScreen = ({ route, navigation }) => {
  const { tempToken, contact, method } = route.params;
  const { loginDirect } = useAuth();
  const { t } = useLanguage();
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(59);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
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
    const cleanValue = value.replace(/[^0-9]/g, '');
    setOtp(cleanValue);
    if (cleanValue.length === 6) {
      Keyboard.dismiss();
      performVerify(cleanValue);
    }
  };

  const performVerify = async (code) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/2fa/verify-login', {
        tempToken,
        otp: code
      });
      loginDirect(res.data.user, res.data.token);
    } catch (error) {
      const msg = error.response?.data?.message || t('validation.invalidCode');
      Alert.alert(t('common.error'), msg);
      setOtp('');
      setTimeout(() => inputRef.current?.focus(), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/2fa/resend-login-otp', {}, {
        headers: { Authorization: `Bearer ${tempToken}` }
      });
      setTimer(60);
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to resend code');
    }
  };

  const maskedContact = method === 'phone' 
    ? `+237 ${contact.slice(0, 3)}••••${contact.slice(-2)}`
    : contact.replace(/(.{3})(.*)(@.*)/, "$1••••$3");

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#0F172A" />
          <Text style={styles.logo}>Two-Step Verification</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="shield-check" size={50} color="#0D9488" />
        </View>

        <Text style={styles.verifyTitle}>Enter your security code</Text>
        <Text style={styles.verifySubtitle}>
          Enter the 6-digit code sent to {maskedContact}
        </Text>

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

        <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={styles.otpRow}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.otpBox, otp.length === i && styles.otpBoxActive]}>
              <Text style={styles.otpDigit}>{otp[i] || ''}</Text>
            </View>
          ))}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.timerText}>
            Resend in {`${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`}
          </Text>
          {timer === 0 && (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend now</Text>
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
            <Text style={styles.verifyBtnText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  body: { flex: 1, paddingHorizontal: 30, paddingTop: 40, alignItems: 'center' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  verifyTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 12, textAlign: 'center' },
  verifySubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  hiddenInput: { position: 'absolute', top: 0, left: 0, width: '100%', height: 100, opacity: 0, zIndex: -1 },
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

export default TwoFactorLoginScreen;
