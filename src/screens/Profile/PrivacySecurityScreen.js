import React, { useEffect, useState, useRef } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { Alert, StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, Switch, Modal, TextInput, ActivityIndicator, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PrivacySecurityScreen = ({ navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();
  const [faceId, setFaceId] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(true);
  const [twoStep, setTwoStep] = useState(user?.twoFactorEnabled || false);

  // OTP Modal State
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(30);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const otpInputRef = useRef(null);

  // Password Modal State
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadBiometricState = async () => {
      const [enabled, hasHardware] = await Promise.all([
        SecureStore.getItemAsync('biometric_enabled'),
        LocalAuthentication.hasHardwareAsync(),
      ]);
      if (!mounted) return;
      setBiometricAvailable(hasHardware);
      setFaceId(enabled === 'true' && hasHardware);
    };
    loadBiometricState().catch(() => {
      if (mounted) {
        setBiometricAvailable(false);
        setFaceId(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let interval;
    if (otpModalVisible && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpModalVisible, otpTimer]);

  const handleBiometricToggle = async (nextValue) => {
    if (nextValue) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setBiometricAvailable(false);
        setFaceId(false);
        Alert.alert(t('profile.biometricUnsupported'));
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        setFaceId(false);
        Alert.alert(t('profile.biometricNotEnrolled'));
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm your identity to enable biometric login',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        setFaceId(false);
        Alert.alert(t('profile.biometricEnableFailed'));
        return;
      }

      await SecureStore.setItemAsync('biometric_enabled', 'true');
      setFaceId(true);
      Alert.alert(t('common.success'), t('profile.biometricEnabled'));
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm your identity to disable biometric login',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      setFaceId(true);
      return;
    }

    await SecureStore.deleteItemAsync('biometric_enabled');
    setFaceId(false);
  };

  const handleTwoStepToggle = async (nextValue) => {
    if (nextValue) {
      // Turn ON Flow
      try {
        await api.post('/auth/2fa/send-otp');
        setOtp('');
        setOtpError('');
        setOtpTimer(30);
        setOtpModalVisible(true);
        setTimeout(() => otpInputRef.current?.focus(), 500);
      } catch (error) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
      }
    } else {
      // Turn OFF Flow
      setPassword('');
      setPasswordError('');
      setPasswordModalVisible(true);
    }
  };

  const submitOtp = async () => {
    if (otp.length < 6) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      await api.post('/auth/2fa/enable', { otp });
      setOtpModalVisible(false);
      setTwoStep(true);
      await refreshUser?.();
      Alert.alert('Success', 'Two-step verification is now active');
    } catch (error) {
      setOtpError(error.response?.data?.message || t('validation.invalidOtp'));
      setOtp('');
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } finally {
      setOtpLoading(false);
    }
  };

  const submitPassword = async () => {
    if (!password) return;
    setPasswordLoading(true);
    setPasswordError('');
    try {
      await api.post('/auth/2fa/disable', { password });
      setPasswordModalVisible(false);
      setTwoStep(false);
      await refreshUser?.();
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Incorrect password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      await api.post('/auth/2fa/send-otp');
      setOtpTimer(30);
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code');
    }
  };

  const formatLastPasswordChange = (value) => {
    if (!value) return null;
    const changedAt = new Date(value);
    if (Number.isNaN(changedAt.getTime())) return null;
    const diffDays = Math.floor((Date.now() - changedAt.getTime()) / 86400000);
    
    if (diffDays < 1) return t('profile.lastChangedToday');
    if (diffDays === 1) return t('profile.lastChangedYesterday');
    if (diffDays > 1 && diffDays <= 30) {
      return t('profile.lastChangedDaysAgo', { days: diffDays });
    }
    return t('profile.lastChangedOn', { date: changedAt.toLocaleDateString() });
  };

  const SecurityItem = ({ icon, title, desc, hasSwitch, value, onValueChange, onPress, disabled }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: colors.border }, disabled && styles.disabledItem]}
      onPress={onPress}
      disabled={hasSwitch || disabled}
    >
      <View style={styles.settingInfo}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.settingTexts}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {desc ? <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>{desc}</Text> : null}
        </View>
      </View>
      {hasSwitch ? (
        <Switch value={value} onValueChange={onValueChange} disabled={disabled} trackColor={{ true: colors.accent }} />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.privacySecurity')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('profile.loginSecurity')}</Text>
            
            <SecurityItem 
              icon="face-recognition" 
              title={t('profile.faceId')}
              desc={biometricAvailable ? t('profile.faceIdDesc') : t('profile.biometricNotAvailable')}
              hasSwitch={true}
              value={faceId}
              onValueChange={handleBiometricToggle}
              disabled={!biometricAvailable}
            />

            <SecurityItem 
              icon="key-variant" 
              title={t('profile.changePassword')}
              desc={formatLastPasswordChange(user?.lastPasswordChange)}
              onPress={() => navigation.navigate('ChangePassword')}
            />

            <SecurityItem 
              icon="shield-check-outline" 
              title={t('profile.twoStep')}
              desc={t('profile.twoStepDesc')}
              hasSwitch={true}
              value={twoStep}
              onValueChange={handleTwoStepToggle}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('profile.privacyControl')}</Text>
            
            <SecurityItem 
              icon="file-document-outline" 
              title={t('profile.dataUsage')}
              desc={t('profile.dataUsageDesc')}
              onPress={() => {}}
            />
          </View>


        </ScrollView>
      </SafeAreaView>

      {/* OTP Modal */}
      <Modal visible={otpModalVisible} transparent animationType="slide" onRequestClose={() => setOtpModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => setOtpModalVisible(false)} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>Verify your email</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Enter the 6-digit code sent to your email address: {user?.email}
            </Text>

            <TextInput
              ref={otpInputRef}
              value={otp}
              onChangeText={(val) => {
                const c = val.replace(/[^0-9]/g, '');
                setOtp(c);
                if (c.length === 6) Keyboard.dismiss();
              }}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.hiddenInput}
              caretHidden
            />

            <TouchableOpacity activeOpacity={1} onPress={() => otpInputRef.current?.focus()} style={styles.otpRow}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <View key={i} style={[styles.otpBox, otp.length === i && styles.otpBoxActive]}>
                  <Text style={[styles.otpDigit, { color: colors.text }]}>{otp[i] || ''}</Text>
                </View>
              ))}
            </TouchableOpacity>

            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

            <View style={styles.resendWrapper}>
              {otpTimer > 0 ? (
                <Text style={[styles.resendText, { color: colors.textSecondary }]}>Resend code in {otpTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={resendOtp}>
                  <Text style={[styles.resendLink, { color: colors.accent }]}>Resend code</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: colors.accent }, (otp.length < 6 || otpLoading) && styles.disabledBtn]}
              onPress={submitOtp}
              disabled={otp.length < 6 || otpLoading}
            >
              {otpLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Verify</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={passwordModalVisible} transparent animationType="fade" onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => setPasswordModalVisible(false)} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm your identity</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Enter your password to disable two-step verification
            </Text>

            <View style={[styles.inputWrap, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.placeholder} />
              </TouchableOpacity>
            </View>

            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: colors.error, marginTop: 20 }, (!password || passwordLoading) && styles.disabledBtn]}
              onPress={submitPassword}
              disabled={!password || passwordLoading}
            >
              {passwordLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Confirm</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  backBtn: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 20 },
  section: { marginBottom: 30 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 15, textTransform: 'uppercase' },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 17, borderBottomWidth: 1,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: { width: 34, height: 34, justifyContent: 'center', alignItems: 'flex-start', marginRight: 12 },
  settingTexts: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '700' },
  settingDesc: { fontSize: 12, marginTop: 2 },
  dangerBtn: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 10 },
  dangerBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  dangerText: { fontWeight: '800', fontSize: 16 },
  dangerDesc: { fontSize: 13, lineHeight: 18 },
  disabledItem: { opacity: 0.45 },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginTop: 10, marginBottom: 8 },
  modalSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  
  // OTP
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  otpBox: { width: 45, height: 55, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  otpBoxActive: { borderColor: '#0D9488', borderWidth: 2 },
  otpDigit: { fontSize: 24, fontWeight: '700' },
  resendWrapper: { marginBottom: 24 },
  resendText: { fontSize: 14, fontWeight: '600' },
  resendLink: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  
  // Password
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, height: 50, width: '100%' },
  input: { flex: 1, fontSize: 15 },
  
  // Shared
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', marginTop: 8 },
  primaryBtn: { width: '100%', height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});

export default PrivacySecurityScreen;
