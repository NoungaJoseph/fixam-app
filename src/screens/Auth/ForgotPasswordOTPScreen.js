import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const ForgotPasswordOTPScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const { isDarkMode, colors } = useTheme();
  const { t, language } = useLanguage();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(60);
  
  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setErrorMsg(t('forgotPassword.otpRequired'));
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/verify-reset-otp', { email, otp: code });
      if (res.data.success) {
        navigation.navigate('NewPassword', { resetToken: res.data.resetToken });
      } else {
        setErrorMsg(res.data.message || t('forgotPassword.serverError'));
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || t('forgotPassword.serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(60);
    try {
      await api.post('/auth/forgot-password', { email, language });
    } catch (error) {
      setErrorMsg(t('forgotPassword.serverError'));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{t('forgotPassword.otpTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('forgotPassword.otpSubtitle')}
          </Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                style={[
                  styles.otpInput, 
                  { 
                    backgroundColor: colors.card,
                    borderColor: digit ? colors.primary : colors.border,
                    color: colors.text
                  }
                ]}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(val) => handleOtpChange(val, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
              />
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.verifyBtn, { backgroundColor: colors.accent }]} 
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.verifyBtnText}>
              {loading ? t('common.loading') : t('forgotPassword.verifyCode')}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
              {countdown > 0 
                ? `${t('forgotPassword.resendIn')} ${countdown}s` 
                : ''}
            </Text>
            {countdown === 0 && (
              <TouchableOpacity onPress={handleResend}>
                <Text style={[styles.resendAction, { color: colors.primary }]}>
                  {t('forgotPassword.resendCode')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { padding: 20 },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 10 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 40 },
  errorText: { color: '#FF3B30', fontSize: 14, marginBottom: 15, fontWeight: '500' },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  verifyBtn: { width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginBottom: 25 },
  verifyBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { fontSize: 15 },
  resendAction: { fontSize: 15, fontWeight: '700', marginLeft: 5 },
});

export default ForgotPasswordOTPScreen;
