import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert,
  ScrollView, Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { t } = useLanguage();
  const { loginDirect } = useAuth();
  const { isDarkMode, colors } = useTheme();
  const phoneDigits = contact.replace(/\D/g, '').slice(0, 9);
  const authInputStyle = { backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.32)' };
  const authInputTextStyle = { color: '#FFF' };

  const handleContactChange = (value) => {
    if (loginMethod === 'phone') {
      setContact(value.replace(/\D/g, '').slice(0, 9));
      return;
    }
    setContact(value);
  };

  const handleLogin = async () => {
    if (!contact.trim() || !password.trim()) {
      Alert.alert(t('common.required'), t(loginMethod === 'phone' ? 'login.phonePasswordRequired' : 'login.emailPasswordRequired'));
      return;
    }
    if (loginMethod === 'phone' && phoneDigits.length !== 9) {
      Alert.alert(t('common.required'), t('login.phonePasswordRequired'));
      return;
    }

    setLoading(true);
    try {
      const normalizedContact = loginMethod === 'phone' ? phoneDigits : contact.trim();
      const payload = {
        [loginMethod === 'phone' ? 'phone' : 'email']: normalizedContact,
        password
      };
      
      const res = await api.post('/auth/login', payload);
      
      if (res.data.otpRequired) {
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
              <Text style={[styles.methodText, loginMethod === 'phone' && styles.methodTextActive]}>{t('login.mobileNumber')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.methodBtn, loginMethod === 'email' && styles.methodBtnActive]}
              onPress={() => { setLoginMethod('email'); setContact(''); }}
            >
              <Text style={[styles.methodText, loginMethod === 'email' && styles.methodTextActive]}>{t('register.email')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={[styles.inputWrapper, authInputStyle]}>
              {loginMethod === 'phone' ? (
                <View style={styles.countryPrefix}>
                  <Text style={styles.flagText}>🇨🇲</Text>
                  <Text style={styles.prefixText}>+237</Text>
                </View>
              ) : (
                <MaterialIcons name="alternate-email" size={22} color="#FFF" style={styles.inputIcon} />
              )}
              <TextInput
                style={[styles.textInput, authInputTextStyle]}
                placeholder={loginMethod === 'phone' ? '6XX XXX XXX' : t('register.emailPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.66)"
                value={loginMethod === 'phone' ? phoneDigits : contact}
                onChangeText={handleContactChange}
                keyboardType={loginMethod === 'phone' ? "phone-pad" : "email-address"}
                maxLength={loginMethod === 'phone' ? 9 : undefined}
                selectionColor="#FFF"
              />
            </View>

            <View style={[styles.inputWrapper, authInputStyle]}>
              <MaterialIcons name="lock-outline" size={22} color="#FFF" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, authInputTextStyle]}
                placeholder={t('register.password')}
                placeholderTextColor="rgba(255,255,255,0.66)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                selectionColor="#FFF"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={20}
                  color="rgba(255,255,255,0.74)"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={handleLogin} 
              activeOpacity={0.8} 
              disabled={loading}
              style={[styles.loginButton, { opacity: loading ? 0.72 : 1 }]}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>{t('roleSelection.login')}</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#0F766E" style={styles.buttonArrow} />
                </>
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
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 76, paddingBottom: 34, justifyContent: 'center' },
  brandHeader: { alignItems: 'center', marginBottom: 26 },
  logoImage: { width: 170, height: 92, marginBottom: 14 },
  welcomeTo: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.88)', fontSize: 14, fontWeight: '700', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  formArea: { paddingHorizontal: 0 },
  methodToggle: { flexDirection: 'row', borderRadius: 999, padding: 4, marginBottom: 22, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  methodBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 9 },
  methodBtnActive: { backgroundColor: '#FFF' },
  methodText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.78)' },
  methodTextActive: { color: '#0F766E', fontWeight: '900' },
  formContainer: { gap: 18 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, paddingHorizontal: 15, height: 58, borderWidth: 1 },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  countryPrefix: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 12, paddingRight: 12, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.28)' },
  flagText: { fontSize: 20 },
  prefixText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  loginButton: { alignSelf: 'center', width: '58%', maxWidth: 220, minWidth: 154, height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 6, flexDirection: 'row', backgroundColor: '#FFF', position: 'relative' },
  loginButtonText: { color: '#0F766E', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  buttonArrow: { position: 'absolute', right: 18 },
  footerLinks: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 10 },
  registerLink: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  forgotText: { color: 'rgba(255,255,255,0.82)', fontSize: 14, fontWeight: '700' },
});

export default LoginScreen;
