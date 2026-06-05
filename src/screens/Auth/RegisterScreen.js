import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const RegisterScreen = ({ navigation, route }) => {
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();
  const { loginDirect } = useAuth();
  const { role } = route.params || { role: 'client' };
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    referral: '',
    location: '',
    password: '',
    repeatPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  const setPhoneField = (value) => setField('phone', value.replace(/\D/g, '').slice(0, 9));
  const phoneDigits = formData.phone.replace(/\D/g, '').slice(0, 9);
  const authInputStyle = { backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.32)', color: '#FFF' };
  
  const handleRegister = async () => {
    // Normalize phone: remove spaces and non-digits
    const normalizedPhone = phoneDigits;
    const userData = { ...formData, phone: normalizedPhone, fullName: `${formData.firstName} ${formData.lastName}`.trim() };

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert(t('validation.nameRequired'));
      return;
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      alert(t('validation.emailRequired'));
      return;
    }
    if (normalizedPhone.length !== 9) {
      alert(t('validation.phoneRequired'));
      return;
    }
    if (!formData.location.trim()) {
      alert(t('validation.locationRequired'));
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      alert(t('validation.passwordLength'));
      return;
    }
    if (!agree) {
      alert(t('register.termsRequired'));
      return;
    }
    if (formData.password !== formData.repeatPassword) {
      alert(t('validation.passwordMismatch'));
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.post('/auth/register', {
        ...userData,
        role: role.toUpperCase(),
        providerProfile: role === 'provider' ? {
          skills: [],
          bio: '',
          rate: 0,
          serviceArea: formData.location,
          experienceLevel: '',
          availability: {}
        } : undefined
      });
      loginDirect(res.data.user, res.data.token, true);
    } catch (error) {
      alert(error.response?.data?.message || t('errors.registrationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = authInputStyle;

  return (
    <LinearGradient
      colors={['#0D9488', '#14B8A6', '#2563EB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{role === 'client' ? t('register.clientTitle') : t('register.providerTitle')}</Text>
                <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
              </View>
            </View>

            <View style={styles.formArea}>
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>{t('register.firstName')}</Text>
                  <TextInput style={[styles.input, inputStyle]} placeholder={t('register.firstName')} placeholderTextColor="rgba(255,255,255,0.66)" value={formData.firstName} onChangeText={(value) => setField('firstName', value)} selectionColor="#FFF" />
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>{t('register.lastName')}</Text>
                  <TextInput style={[styles.input, inputStyle]} placeholder={t('register.lastName')} placeholderTextColor="rgba(255,255,255,0.66)" value={formData.lastName} onChangeText={(value) => setField('lastName', value)} selectionColor="#FFF" />
                </View>
              </View>

              <Text style={styles.label}>{t('register.email')}</Text>
              <TextInput style={[styles.input, inputStyle]} placeholder={t('register.emailPlaceholder')} placeholderTextColor="rgba(255,255,255,0.66)" keyboardType="email-address" value={formData.email} onChangeText={(value) => setField('email', value)} selectionColor="#FFF" />

              <Text style={styles.label}>{t('register.phone')}</Text>
              <View style={[styles.phoneInputWrapper, inputStyle]}>
                <View style={styles.countryPrefix}>
                  <Text style={styles.flagText}>🇨🇲</Text>
                  <Text style={styles.prefixText}>+237</Text>
                </View>
                <TextInput
                  style={styles.flexInput}
                  placeholder="6XX XXX XXX"
                  placeholderTextColor="rgba(255,255,255,0.66)"
                  keyboardType="phone-pad"
                  value={phoneDigits}
                  onChangeText={setPhoneField}
                  maxLength={9}
                  selectionColor="#FFF"
                />
              </View>

              <Text style={styles.label}>{t('register.referral')}</Text>
              <TextInput style={[styles.input, inputStyle]} placeholder={t('register.referralPlaceholder')} placeholderTextColor="rgba(255,255,255,0.66)" value={formData.referral} onChangeText={(value) => setField('referral', value)} selectionColor="#FFF" />

              <Text style={styles.label}>{t('register.location')}</Text>
              <TextInput style={[styles.input, inputStyle]} placeholder="e.g. Akwa, Douala" placeholderTextColor="rgba(255,255,255,0.66)" value={formData.location} onChangeText={(value) => setField('location', value)} selectionColor="#FFF" />

              <Text style={styles.label}>{t('register.password')}</Text>
              <View style={[styles.inputWrapper, inputStyle]}>
                <TextInput
                  style={styles.flexInput}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.66)"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(value) => setField('password', value)}
                  selectionColor="#FFF"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color="rgba(255,255,255,0.74)" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>{t('register.repeatPassword')}</Text>
              <View style={[styles.inputWrapper, inputStyle]}>
                <TextInput
                  style={styles.flexInput}
                  placeholder="Repeat Password"
                  placeholderTextColor="rgba(255,255,255,0.66)"
                  secureTextEntry={!showPassword}
                  value={formData.repeatPassword}
                  onChangeText={(value) => setField('repeatPassword', value)}
                  selectionColor="#FFF"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color="rgba(255,255,255,0.74)" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.termsRow} onPress={() => setAgree(!agree)}>
                <MaterialCommunityIcons name={agree ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color="#FFF" />
                <Text style={styles.termsText}>
                  {t('register.agreePrefix')}{' '}
                  <Text style={styles.linkText} onPress={() => navigation.navigate('TermsPolicy', { type: 'terms' })}>{t('register.terms')}</Text>
                  {' '}{t('register.and')}{' '}
                  <Text style={styles.linkText} onPress={() => navigation.navigate('TermsPolicy', { type: 'privacy' })}>{t('register.privacy')}</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.registerBtn, { opacity: submitting ? 0.65 : 1 }]} onPress={handleRegister} activeOpacity={0.85} disabled={submitting}>
                <Text style={styles.registerBtnText}>{submitting ? t('register.creating') : t('register.submit')}</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#0F766E" style={styles.buttonArrow} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: { padding: 22, paddingBottom: 42 },
  header: { 
    flexDirection: 'row', 
    gap: 14, 
    alignItems: 'center', 
    marginBottom: 18,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 0
  },
  backBtn: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  title: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  subtitle: { color: 'rgba(255,255,255,0.86)', fontSize: 14, marginTop: 5 },
  formArea: { paddingTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  label: { color: '#FFF', fontSize: 13, fontWeight: '900', marginBottom: 9, marginTop: 12 },
  input: { height: 54, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontWeight: '600' },
  inputWrapper: { height: 54, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  phoneInputWrapper: { height: 54, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  countryPrefix: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 12, paddingRight: 12, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.28)' },
  flagText: { fontSize: 20 },
  prefixText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  flexInput: { flex: 1, height: '100%', color: '#FFF', fontSize: 15, fontWeight: '600' },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  termsText: { flex: 1, color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 19 },
  linkText: { color: '#FFF', fontWeight: '900', textDecorationLine: 'underline' },
  registerBtn: { alignSelf: 'center', width: '72%', maxWidth: 260, minWidth: 190, height: 56, borderRadius: 999, marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', position: 'relative' },
  registerBtnText: { color: '#0F766E', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  buttonArrow: { position: 'absolute', right: 20 },
});

export default RegisterScreen;
