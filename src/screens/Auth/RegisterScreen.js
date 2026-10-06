import React, { useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  StatusBar, Platform, ScrollView, Modal
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { COUNTRY_DATA, SUPPORTED_COUNTRIES } from '../../constants/countries';

const RegisterScreen = ({ navigation, route }) => {
  const { isDarkMode, colors } = useTheme();
  const { t, locale } = useLanguage();
  const { loginDirect } = useAuth();
  const insets = useSafeAreaInsets();
  const { role } = route.params || { role: 'client' };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    referral: '',
    region: '',
    city: '',
    password: '',
    repeatPassword: '',
    country: SUPPORTED_COUNTRIES[0].name,
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const selectedCountry = COUNTRY_DATA[formData.country] || COUNTRY_DATA.Cameroon;

  const handleCountrySelect = (countryName) => {
    setFormData(prev => ({
      ...prev,
      country: countryName,
      phone: '',
      region: '',
      city: ''
    }));
    setErrors(prev => ({
      ...prev,
      phone: null,
      region: null,
      city: null
    }));
    setShowCountryPicker(false);
  };
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => (prev[key] ? { ...prev, [key]: null } : prev));
  };
  const setPhoneField = (value) => {
    setField('phone', value.replace(/\D/g, '').slice(0, selectedCountry.phoneLength));
    setErrors(prev => (prev.phone ? { ...prev, phone: null } : prev));
  };
  const phoneDigits = formData.phone.replace(/\D/g, '').slice(0, selectedCountry.phoneLength);
  const authInputStyle = { backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.32)', color: '#FFF' };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => selectedCountry.regex.test(phone);

  // ── Password requirements ────────────────────────────────────────────────────
  const isFr = locale === 'fr';
  const requirements = [
    { label: isFr ? 'Au moins 6 caractères' : 'At least 6 characters', met: formData.password.length >= 6 },
    { label: isFr ? 'Contient une lettre majuscule (A-Z)' : 'Contains uppercase letter (A-Z)', met: /[A-Z]/.test(formData.password) },
    { label: isFr ? 'Contient un chiffre (0-9)' : 'Contains a number (0-9)', met: /\d/.test(formData.password) },
  ];
  const metCount = requirements.filter(r => r.met).length;
  const strength = metCount <= 1 ? 'weak' : metCount === 2 ? 'fair' : 'strong';
  const strengthColor = { weak: '#EF4444', fair: '#F97316', strong: '#22C55E' };
  const strengthLabel = {
    weak: isFr ? 'Faible' : 'Weak',
    fair: isFr ? 'Moyen' : 'Fair',
    strong: isFr ? 'Fort' : 'Strong',
  };
  const strengthWidth = ['0%', '33%', '66%', '100%'][metCount];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('validation.firstNameRequired', isFr ? 'Le prénom est requis' : 'First name is required');
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('validation.lastNameRequired', isFr ? 'Le nom est requis' : 'Last name is required');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired', isFr ? 'Une adresse email valide est requise' : 'A valid email address is required');
    } else if (!isValidEmail(formData.email.trim())) {
      newErrors.email = t('validation.emailRequired', isFr ? 'Une adresse email valide est requise' : 'A valid email address is required');
    }
    if (!phoneDigits) {
      newErrors.phone = t('validation.phoneRequired', isFr ? 'Un numéro de téléphone valide est requis' : 'A valid phone number is required');
    } else if (!isValidPhone(phoneDigits)) {
      newErrors.phone = t('validation.phoneRequired', isFr ? 'Un numéro de téléphone valide est requis' : 'A valid phone number is required');
    }
    if (!formData.region.trim()) {
      newErrors.region = t('validation.regionRequired', isFr ? 'La région est requise' : 'Region is required');
    }
    if (!formData.city.trim()) {
      newErrors.city = t('validation.cityRequired', isFr ? 'La ville est requise' : 'City is required');
    }
    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired', isFr ? 'Le mot de passe est requis' : 'Password is required');
    } else if (formData.password.length < 6) {
      newErrors.password = isFr
        ? 'Le mot de passe doit comporter au moins 6 caractères'
        : 'Password must be at least 6 characters long';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = isFr
        ? 'Veuillez ajouter au moins une lettre majuscule (A-Z)'
        : 'Please add at least one uppercase capital letter (A-Z)';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = isFr
        ? 'Veuillez ajouter au moins un chiffre (0-9)'
        : 'Please add at least one number (0-9)';
    }
    if (!formData.repeatPassword) {
      newErrors.repeatPassword = t('validation.repeatPasswordRequired', isFr ? 'Veuillez confirmer votre mot de passe' : 'Please repeat your password');
    } else if (formData.password !== formData.repeatPassword) {
      newErrors.repeatPassword = t('validation.passwordMismatch', isFr ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match');
    }
    if (!agree) {
      newErrors.agree = t('register.termsRequired', isFr ? 'Veuillez accepter les Conditions générales' : 'Please accept the Terms & Conditions and Privacy Policy');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    const normalizedPhone = phoneDigits;
    const finalLocation = formData.city && formData.region ? `${formData.city}, ${formData.region}` : '';
    const userData = { ...formData, location: finalLocation, phone: normalizedPhone, fullName: `${formData.firstName} ${formData.lastName}`.trim() };
    try {
      setSubmitting(true);
      const res = await api.post('/auth/register', {
        ...userData,
        language: locale || 'en',
        role: role.toUpperCase(),
        providerProfile: role === 'provider' ? {
          skills: [], bio: '', rate: 0,
          serviceArea: '',
          experienceLevel: '', availability: {}
        } : undefined
      });
      if (res.data.requiresEmailVerification) {
        navigation.navigate('OTP', { 
          contact: res.data.email, 
          method: 'email', 
          purpose: 'registration' 
        });
      } else {
        loginDirect(res.data.user, res.data.token, true);
      }
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
      <SafeAreaView style={styles.flex} edges={['top']}>
        <KeyboardAwareScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 60}
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
                <Text style={styles.label}>
                  {t('register.firstName')}
                  <Text style={styles.requiredStar}> *</Text>
                </Text>
                <TextInput
                  style={[styles.input, inputStyle, errors.firstName && styles.inputError]}
                  placeholder={t('register.firstName')}
                  placeholderTextColor="rgba(255,255,255,0.66)"
                  value={formData.firstName}
                  onChangeText={(v) => setField('firstName', v)}
                  selectionColor="#FFF"
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>
                  {t('register.lastName')}
                  <Text style={styles.requiredStar}> *</Text>
                </Text>
                <TextInput
                  style={[styles.input, inputStyle, errors.lastName && styles.inputError]}
                  placeholder={t('register.lastName')}
                  placeholderTextColor="rgba(255,255,255,0.66)"
                  value={formData.lastName}
                  onChangeText={(v) => setField('lastName', v)}
                  selectionColor="#FFF"
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
            </View>

            {/* Email */}
            <Text style={styles.label}>
              {t('register.email')}
              <Text style={styles.requiredStar}> *</Text>
            </Text>
            <TextInput
              style={[styles.input, inputStyle, errors.email && styles.inputError]}
              placeholder={t('register.emailPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.66)"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(v) => setField('email', v)}
              selectionColor="#FFF"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Phone */}
            <Text style={styles.label}>
              {t('register.phone')}
              <Text style={styles.requiredStar}> *</Text>
            </Text>
            <View style={[styles.phoneInputWrapper, inputStyle, errors.phone && styles.inputError]}>
              <TouchableOpacity style={styles.countryPrefix} onPress={() => setShowCountryPicker(true)}>
                <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                <Text style={styles.prefixText}>{selectedCountry.dialCode}</Text>
                <MaterialCommunityIcons name="menu-down" size={18} color="#FFF" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
              <TextInput
                style={styles.flexInput}
                placeholder={selectedCountry.placeholder}
                placeholderTextColor="rgba(255,255,255,0.66)"
                keyboardType="phone-pad"
                value={phoneDigits}
                onChangeText={setPhoneField}
                maxLength={selectedCountry.phoneLength}
                selectionColor="#FFF"
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            {/* Referral */}
            <Text style={styles.label}>
              {t('register.referral')}
              <Text style={styles.optionalBadge}> ({isFr ? 'Optionnel' : 'Optional'})</Text>
            </Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder={isFr ? 'Entrez le code de parrainage' : 'Enter referral code'}
              placeholderTextColor="rgba(255,255,255,0.66)"
              value={formData.referral}
              onChangeText={(v) => setField('referral', v)}
              selectionColor="#FFF"
            />

            {/* Location */}
            <Text style={styles.label}>
              {t('register.location')}
              <Text style={styles.requiredStar}> *</Text>
            </Text>
            <View style={styles.row}>
              <View style={styles.half}>
                <TouchableOpacity 
                  style={[styles.input, inputStyle, { justifyContent: 'center' }, errors.region && styles.inputError]} 
                  onPress={() => setShowRegionPicker(true)}
                >
                  <Text style={{ color: formData.region ? '#FFF' : 'rgba(255,255,255,0.66)', fontSize: 15, fontWeight: '600' }}>
                    {formData.region || t('register.selectRegion')}
                  </Text>
                </TouchableOpacity>
                {errors.region && <Text style={styles.errorText}>{errors.region}</Text>}
              </View>
              <View style={styles.half}>
                <TouchableOpacity 
                  style={[styles.input, inputStyle, { justifyContent: 'center' }, !formData.region && { opacity: 0.5 }, errors.city && styles.inputError]} 
                  onPress={() => formData.region && setShowCityPicker(true)}
                  disabled={!formData.region}
                >
                  <Text style={{ color: formData.city ? '#FFF' : 'rgba(255,255,255,0.66)', fontSize: 15, fontWeight: '600' }}>
                    {formData.city || t('register.selectCity')}
                  </Text>
                </TouchableOpacity>
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>
            </View>
            {/* Password */}
            <Text style={styles.label}>
              {t('register.password')}
              <Text style={styles.requiredStar}> *</Text>
            </Text>
            <View style={[styles.inputWrapper, inputStyle, errors.password && styles.inputError]}>
              <TextInput
                style={styles.flexInput}
                placeholder={t('login.password')}
                placeholderTextColor="rgba(255,255,255,0.66)"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(v) => setField('password', v)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                selectionColor="#FFF"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="rgba(255,255,255,0.74)"
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

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
            <Text style={styles.label}>
              {t('register.repeatPassword')}
              <Text style={styles.requiredStar}> *</Text>
            </Text>
            <View style={[styles.inputWrapper, inputStyle, errors.repeatPassword && styles.inputError]}>
              <TextInput
                style={styles.flexInput}
                placeholder={t('login.repeatPassword')}
                placeholderTextColor="rgba(255,255,255,0.66)"
                secureTextEntry={!showPassword}
                value={formData.repeatPassword}
                onChangeText={(v) => setField('repeatPassword', v)}
                selectionColor="#FFF"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="rgba(255,255,255,0.74)"
                />
              </TouchableOpacity>
            </View>
            {errors.repeatPassword && <Text style={styles.errorText}>{errors.repeatPassword}</Text>}

            {/* Terms */}
            <TouchableOpacity 
              style={[styles.termsRow, errors.agree && { padding: 6, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.18)' }]} 
              onPress={() => {
                setAgree(!agree);
                setErrors(prev => (prev.agree ? { ...prev, agree: null } : prev));
              }}
            >
              <MaterialCommunityIcons
                name={agree ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color={errors.agree ? '#FCA5A5' : '#FFF'}
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
            {errors.agree && <Text style={styles.errorText}>{errors.agree}</Text>}

            {/* Register button */}
            <TouchableOpacity
              style={[styles.registerBtn, { opacity: submitting ? 0.7 : 1 }]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={submitting}
            >
              <Text style={styles.registerBtnText}>
                {submitting ? t('register.creating') : t('register.submit')}
              </Text>
            </TouchableOpacity>

            {/* Bottom spacer to guarantee the button can scroll fully above navigation area */}
            <View style={{ height: 120 }} />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>

      <Modal visible={showRegionPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRegionPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#111827' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('register.selectRegion')}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {Object.keys(selectedCountry.regions || {}).map(region => (
                <TouchableOpacity 
                  key={region} 
                  style={[styles.modalOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setField('region', region);
                    setField('city', ''); // reset city when region changes
                    setShowRegionPicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>{region}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showCityPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCityPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#111827' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('register.selectCity')}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {!!formData.region && (selectedCountry.regions?.[formData.region] || []).map(city => (
                <TouchableOpacity 
                  key={city} 
                  style={[styles.modalOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setField('city', city);
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showCountryPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCountryPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#111827' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {SUPPORTED_COUNTRIES.map(country => (
                <TouchableOpacity 
                  key={country.name} 
                  style={[styles.modalOption, { borderBottomColor: colors.border }]}
                  onPress={() => handleCountrySelect(country.name)}
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
  requiredStar: { color: '#EF4444', fontSize: 14, fontWeight: '900' },
  optionalBadge: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'normal' },
  input: { height: 54, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontWeight: '600' },
  inputWrapper: { height: 54, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  phoneInputWrapper: { height: 54, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  countryPrefix: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 12, paddingRight: 12, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.28)' },
  flagText: { fontSize: 20 },
  prefixText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  flexInput: { flex: 1, height: '100%', color: '#FFF', fontSize: 15, fontWeight: '600' },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
    marginLeft: 4,
  },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12, textAlign: 'center' },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalOptionText: { fontSize: 16, color: '#374151', textAlign: 'center' },
});

export default RegisterScreen;
