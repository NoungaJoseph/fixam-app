import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert,
  Platform, Image, Modal, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPPORTED_COUNTRIES } from '../../constants/countries';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const LoginScreen = ({ navigation }) => {
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(SUPPORTED_COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const { t } = useLanguage();
  const { loginDirect } = useAuth();
  const { isDarkMode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const loadCountry = async () => {
      try {
        const stored = await AsyncStorage.getItem('FIXAM_LAST_SELECTED_COUNTRY');
        if (stored) {
          const found = SUPPORTED_COUNTRIES.find(c => c.name === stored);
          if (found) setSelectedCountry(found);
        }
      } catch (err) {
        console.log('Failed to load last selected country', err);
      }
    };
    loadCountry();
  }, []);

  const handleCountrySelect = async (country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setContact('');
    try {
      await AsyncStorage.setItem('FIXAM_LAST_SELECTED_COUNTRY', country.name);
    } catch (err) {
      console.log('Failed to save selected country', err);
    }
  };

  const phoneDigits = contact.replace(/\D/g, '').slice(0, selectedCountry.phoneLength);
  const authInputStyle = { backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.32)' };
  const authInputTextStyle = { color: '#FFF' };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => selectedCountry.regex.test(phone);
  const isFormValid = loginMethod === 'phone'
    ? isValidPhone(phoneDigits) && password.length > 0
    : isValidEmail(contact.trim()) && password.length > 0;

  const handleContactChange = (value) => {
    if (loginMethod === 'phone') {
      setContact(value.replace(/\D/g, '').slice(0, selectedCountry.phoneLength));
      return;
    }
    setContact(value);
  };

  const handleLogin = async () => {
    if (!contact.trim() || !password.trim()) {
      Alert.alert(t('common.required'), t(loginMethod === 'phone' ? 'login.phonePasswordRequired' : 'login.emailPasswordRequired'));
      return;
    }
    if (loginMethod === 'phone' && phoneDigits.length !== selectedCountry.phoneLength) {
      Alert.alert(t('common.required'), t('login.phonePasswordRequired'));
      return;
    }

    setLoading(true);
    try {
      const normalizedContact = loginMethod === 'phone' ? phoneDigits : contact.trim();
      const payload = {
        [loginMethod === 'phone' ? 'phone' : 'email']: normalizedContact,
        password,
        ...(loginMethod === 'phone' ? { country: selectedCountry.name } : {})
      };

      const res = await api.post('/auth/login', payload);

      if (res.data.requiresEmailVerification) {
        navigation.navigate('OTP', { contact: res.data.email || contact, method: 'email', purpose: 'registration' });
      } else if (res.data.otpRequired) {
        navigation.navigate('OTP', { contact, method: loginMethod, role: res.data.user.role });
      } else if (res.data.requiresTwoFactor) {
        navigation.navigate('TwoFactorLoginScreen', {
          contact,
          method: loginMethod,
          tempToken: res.data.tempToken
        });
      } else {
        loginDirect(res.data.user, res.data.token);
      }
    } catch (error) {
      const msg = error.response?.data?.message || t('login.invalidCredentials');
      Alert.alert(t('login.failed'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0D9488', '#14B8A6', '#2563EB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.mainContainer}
    >
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAwareScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 24 }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 60}
        >
          <View style={styles.brandHeader}>
              <Image source={require('../../../assets/fixam-white-bg.png')} style={styles.logoImage} resizeMode="contain" />
              <Text style={styles.welcomeTo}>{t('login.welcome')}</Text>
              <Text style={styles.headerSub}>{t('login.subtitle')}</Text>
            </View>

            <View style={styles.formArea}>
              <View style={styles.methodToggle}>
                <TouchableOpacity
                  style={[styles.methodBtn, loginMethod === 'phone' && styles.methodBtnActive]}
                  onPress={() => { setLoginMethod('phone'); setContact(''); }}
                >
                  <Text
                    style={[styles.methodText, loginMethod === 'phone' && styles.methodTextActive]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {t('login.mobileNumber')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodBtn, loginMethod === 'email' && styles.methodBtnActive]}
                  onPress={() => { setLoginMethod('email'); setContact(''); }}
                >
                  <Text
                    style={[styles.methodText, loginMethod === 'email' && styles.methodTextActive]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {t('register.email')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                {/* Contact field (phone / email) */}
                <View style={[styles.inputWrapper, authInputStyle]}>
                  {loginMethod === 'phone' ? (
                    <TouchableOpacity style={styles.countryPrefix} onPress={() => setShowCountryPicker(true)}>
                      <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                      <Text style={styles.prefixText}>{selectedCountry.dialCode}</Text>
                      <MaterialIcons name="arrow-drop-down" size={18} color="#FFF" />
                    </TouchableOpacity>
                  ) : (
                    <MaterialIcons name="alternate-email" size={22} color="#FFF" style={styles.inputIcon} />
                  )}
                  <TextInput
                    style={[styles.textInput, authInputTextStyle, { height: '100%' }]}
                    placeholder={loginMethod === 'phone' ? selectedCountry.placeholder : t('register.emailPlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.66)"
                    value={loginMethod === 'phone' ? phoneDigits : contact}
                    onChangeText={handleContactChange}
                    keyboardType={loginMethod === 'phone' ? 'phone-pad' : 'email-address'}
                    maxLength={loginMethod === 'phone' ? selectedCountry.phoneLength : undefined}
                    selectionColor="#FFF"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password field */}
                <View style={[styles.inputWrapper, authInputStyle]}>
                  <MaterialIcons name="lock-outline" size={22} color="#FFF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, authInputTextStyle, { height: '100%' }]}
                    placeholder={t('register.password')}
                    placeholderTextColor="rgba(255,255,255,0.66)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    selectionColor="#FFF"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color="rgba(255,255,255,0.74)"
                    />
                  </TouchableOpacity>
                </View>

                {/* Login button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  activeOpacity={0.8}
                  disabled={loading || !isFormValid}
                  style={[styles.loginButton, { opacity: loading || !isFormValid ? 0.5 : 1 }]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>{t('roleSelection.login')}</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footerLinks}>
                  <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')}>
                    <Text style={styles.registerLink}>{t('login.registerLink')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={styles.forgotText}>{t('login.forgotPassword')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>
      </SafeAreaView>

      <Modal visible={showCountryPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCountryPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#111827' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {SUPPORTED_COUNTRIES.map(country => (
                <TouchableOpacity 
                  key={country.name} 
                  style={[styles.modalOption, { borderBottomColor: colors.border }]}
                  onPress={() => handleCountrySelect(country)}
                >
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>
                    {country.flag} {country.name} ({country.dialCode})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 24, justifyContent: 'center' },
  brandHeader: { alignItems: 'center', marginBottom: 26 },
  logoImage: { width: 340, height: 184, marginBottom: 14 },
  welcomeTo: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.88)', fontSize: 14, fontWeight: '700', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  formArea: { paddingHorizontal: 0 },
  methodToggle: { flexDirection: 'row', borderRadius: 999, padding: 4, marginBottom: 22, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  methodBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 999 },
  methodBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  methodText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.78)' },
  methodTextActive: { color: '#FFF', fontWeight: '900' },
  formContainer: { gap: 18 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, paddingHorizontal: 15, height: 58, borderWidth: 1 },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  countryPrefix: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 12, paddingRight: 12, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.28)' },
  flagText: { fontSize: 20 },
  prefixText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  loginButton: { alignSelf: 'center', width: '58%', maxWidth: 220, minWidth: 154, height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 6, flexDirection: 'row', backgroundColor: '#0D9488', position: 'relative' },
  loginButtonText: { color: '#FFF', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  buttonArrow: { position: 'absolute', right: 18 },
  footerLinks: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 10 },
  registerLink: { color: '#FFF', fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
  forgotText: { color: 'rgba(255,255,255,0.82)', fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12, textAlign: 'center' },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalOptionText: { fontSize: 16, color: '#374151', textAlign: 'center' },
});

export default LoginScreen;
