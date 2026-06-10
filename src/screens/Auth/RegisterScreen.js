import React, { useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
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
  const insets = useSafeAreaInsets();
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
  const [passwordFocused, setPasswordFocused] = useState(false);

  const setField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  const setPhoneField = (value) => setField('phone', value.replace(/\D/g, '').slice(0, 9));
  const phoneDigits = formData.phone.replace(/\D/g, '').slice(0, 9);
  const authInputStyle = { backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.32)', color: '#FFF' };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^6\d{8}$/.test(phone);

  // ── Password requirements ────────────────────────────────────────────────────
  const requirements = [
    { label: 'At least 8 characters',                   met: formData.password.length >= 8 },
    { label: 'Contains a number',                        met: /\d/.test(formData.password) },
    { label: 'Contains a special character (!@#$...)',   met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) },
    { label: 'Contains uppercase letter',                met: /[A-Z]/.test(formData.password) },
  ];
  const metCount = requirements.filter(r => r.met).length;
  const strength = metCount <= 1 ? 'weak' : metCount <= 2 ? 'fair' : metCount <= 3 ? 'good' : 'strong';
  const strengthColor = { weak: '#EF4444', fair: '#F97316', good: '#EAB308', strong: '#22C55E' };
  const strengthLabel = { weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong' };
  const strengthWidth = ['0%', '25%', '50%', '75%', '100%'][metCount];

  // ── Form validity ────────────────────────────────────────────────────────────
  const isFormValid =
    formData.firstName.trim().length > 0 &&
    formData.lastName.trim().length > 0 &&
    isValidEmail(formData.email.trim()) &&
    isValidPhone(phoneDigits) &&
    formData.location.trim().length > 0 &&
    metCount >= 3 &&
    formData.password === formData.repeatPassword &&
    agree;

  const handleRegister = async () => {
    const normalizedPhone = phoneDigits;
    const userData = { ...formData, phone: normalizedPhone, fullName: `${formData.firstName} ${formData.lastName}`.trim() };

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert(t('validation.nameRequired')); return;
    }
    if (!isValidEmail(formData.email.trim())) {
      alert(t('validation.emailRequired')); return;
    }
    if (!isValidPhone(normalizedPhone)) {
      alert(t('validation.phoneRequired')); return;
    }
    if (!formData.location.trim()) {
      alert(t('validation.locationRequired')); return;
    }
    if (metCount < 3) {
      alert(t('validation.passwordFormat')); return;
    }
    if (!agree) {
      alert(t('register.termsRequired')); return;
    }
    if (formData.password !== formData.repeatPassword) {
      alert(t('validation.passwordMismatch')); return;
    }
    try {
      setSubmitting(true);
      const res = await api.post('/auth/register', {
        ...userData,
        role: role.toUpperCase(),
        providerProfile: role === 'provider' ? {
          skills: [], bio: '', rate: 0,
          serviceArea: formData.location,
          experienceLevel: '', availability: {}
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
  const showRequirements = passwordFocused || formData.password.length > 0;

  return (
    <LinearGradient
      colors={['#0D9488', '#14B8A6', '#2563EB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {role === 'client' ? t('register.clientTitle') : t('register.providerTitle')}
              </Text>
              <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
            </View>
          </View>

          <View style={styles.formArea}>
            {/* First / Last name */}
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>{t('register.firstName')}</Text>
                <TextInput
                  style={[styles.input, inputStyle]}
                  placeholder={t('register.firstName')}
                  placeholderTextColor="rgba(255,255,255,0.66)"
                  value={formData.firstName}
                  onChangeText={(v) => setField('firstName', v)}
                  selectionColor="#FFF"
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>{t('register.lastName')}</Text>
                <TextInput
                  style={[styles.input, inputStyle]}
                  placeholder={t('register.lastName')}
                  placeholderTextColor="rgba(255,255,255,0.66)"
                  value={formData.lastName}
                  onChangeText={(v) => setField('lastName', v)}
                  selectionColor="#FFF"
                />
              </View>
            </View>

            {/* Email */}
            <Text style={styles.label}>{t('register.email')}</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder={t('register.emailPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.66)"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(v) => setField('email', v)}
              selectionColor="#FFF"
            />

            {/* Phone */}
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

            {/* Referral */}
            <Text style={styles.label}>{t('register.referral')}</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder={t('register.referralPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.66)"
              value={formData.referral}
              onChangeText={(v) => setField('referral', v)}
              selectionColor="#FFF"
            />

            {/* Location */}
            <Text style={styles.label}>{t('register.location')}</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="e.g. Akwa, Douala"
              placeholderTextColor="rgba(255,255,255,0.66)"
              value={formData.location}
              onChangeText={(v) => setField('location', v)}
              selectionColor="#FFF"
            />

            {/* Password */}
            <Text style={styles.label}>{t('register.password')}</Text>
            <View style={[styles.inputWrapper, inputStyle]}>
              <TextInput
                style={styles.flexInput}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.66)"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(v) => setField('password', v)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                selectionColor="#FFF"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="rgba(255,255,255,0.74)"
                />
              </TouchableOpacity>
            </View>

            {/* Password strength + requirements */}
            {showRequirements && (
              <View style={styles.requirementsBox}>
                {/* Strength bar */}
                <View style={styles.strengthRow}>
                  <View style={styles.strengthTrack}>
                    <View style={[
                      styles.strengthFill,
                      {
                        backgroundColor: strengthColor[strength],
                        width: strengthWidth,
                      }
                    ]} />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strengthColor[strength] }]}>
                    {formData.password.length > 0 ? strengthLabel[strength] : ''}
                  </Text>
                </View>

                {/* Per-requirement rows */}
                {requirements.map((req, idx) => (
                  <View key={idx} style={styles.reqRow}>
                    <View style={[styles.reqDot, { backgroundColor: req.met ? '#22C55E' : 'rgba(255,255,255,0.25)' }]}>
                      {req.met && <Text style={styles.reqCheck}>✓</Text>}
                    </View>
                    <Text style={[styles.reqText, { color: req.met ? '#22C55E' : 'rgba(255,255,255,0.72)' }]}>
                      {req.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Repeat password */}
            <Text style={styles.label}>{t('register.repeatPassword')}</Text>
            <View style={[styles.inputWrapper, inputStyle]}>
              <TextInput
                style={styles.flexInput}
                placeholder="Repeat Password"
                placeholderTextColor="rgba(255,255,255,0.66)"
                secureTextEntry={!showPassword}
                value={formData.repeatPassword}
                onChangeText={(v) => setField('repeatPassword', v)}
                selectionColor="#FFF"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="rgba(255,255,255,0.74)"
                />
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <TouchableOpacity style={styles.termsRow} onPress={() => setAgree(!agree)}>
              <MaterialCommunityIcons
                name={agree ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color="#FFF"
              />
              <Text style={styles.termsText}>
                {t('register.agreePrefix')}{' '}
                <Text style={styles.linkText} onPress={() => navigation.navigate('TermsPolicy', { type: 'terms' })}>
                  {t('register.terms')}
                </Text>
                {' '}{t('register.and')}{' '}
                <Text style={styles.linkText} onPress={() => navigation.navigate('TermsPolicy', { type: 'privacy' })}>
                  {t('register.privacy')}
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Register button */}
            <TouchableOpacity
              style={[styles.registerBtn, { opacity: submitting || !isFormValid ? 0.5 : 1 }]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={submitting || !isFormValid}
            >
              <Text style={styles.registerBtnText}>
                {submitting ? t('register.creating') : t('register.submit')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    padding: 22,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 22,
  },
  header: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 18,
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
  // Password requirements
  requirementsBox: { marginTop: 10, marginBottom: 2, paddingHorizontal: 4 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  strengthTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginRight: 10 },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '700', width: 48 },
  reqRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  reqDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  reqCheck: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  reqText: { fontSize: 12 },
  // Terms & button
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  termsText: { flex: 1, color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 19 },
  linkText: { color: '#FFF', fontWeight: '900', textDecorationLine: 'underline' },
  registerBtn: { alignSelf: 'center', width: '72%', maxWidth: 260, minWidth: 190, height: 56, borderRadius: 999, marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D9488', position: 'relative' },
  registerBtnText: { color: '#FFF', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  buttonArrow: { position: 'absolute', right: 20 },
  passwordHint: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4, marginLeft: 4 },
});

export default RegisterScreen;
