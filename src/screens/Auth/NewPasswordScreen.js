import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const NewPasswordScreen = ({ route, navigation }) => {
  const { resetToken } = route.params;
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const requirements = [
    { label: t('validation.reqMinLength', 'At least 8 characters'), met: password.length >= 8 },
    { label: t('validation.reqNumber', 'Contains a number'), met: /\d/.test(password) },
    { label: t('validation.reqSpecial', 'Contains a special character (!@#$...)'), met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    { label: t('validation.reqUppercase', 'Contains uppercase letter'), met: /[A-Z]/.test(password) },
  ];
  const metCount = requirements.filter(r => r.met).length;
  const strength = metCount <= 1 ? 'weak' : metCount === 2 ? 'fair' : metCount === 3 ? 'good' : 'strong';
  const strengthColor = { weak: '#EF4444', fair: '#F97316', good: '#EAB308', strong: '#22C55E' }[strength];
  const strengthLabel = {
    weak: t('profile.passwordStrengthWeak', 'Weak'),
    fair: t('profile.passwordStrengthFair', 'Fair'),
    good: t('validation.passwordStrengthGood', 'Good'),
    strong: t('profile.passwordStrengthStrong', 'Strong')
  }[strength];

  const handleUpdate = async () => {
    if (metCount < 3) {
      setErrorMsg(t('validation.passwordFormat', 'Password must meet at least 3 requirements'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('forgotPassword.passwordMismatch', 'Passwords do not match'));
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/reset-password', { resetToken, newPassword: password });
      if (res.data.success) {
        navigation.navigate('PasswordSuccess');
      } else {
        setErrorMsg(res.data.message || t('forgotPassword.serverError'));
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || t('forgotPassword.serverError'));
    } finally {
      setLoading(false);
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
          <Text style={[styles.title, { color: colors.text }]}>{t('forgotPassword.newPasswordTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('forgotPassword.newPasswordSubtitle')}
          </Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="lock-outline" size={22} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t('forgotPassword.newPasswordLabel')}
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {password.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                  {t('validation.passwordStrength', 'Password Strength')}:
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '900', color: strengthColor }}>
                  {strengthLabel}
                </Text>
              </View>
              <View style={{ height: 6, width: '100%', backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: ['0%', '25%', '50%', '75%', '100%'][metCount], backgroundColor: strengthColor, borderRadius: 3 }} />
              </View>

              <View style={{ marginTop: 10, gap: 4 }}>
                {requirements.map((req, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons 
                      name={req.met ? "check-circle" : "close-circle"} 
                      size={14} 
                      color={req.met ? "#22C55E" : "#94A3B8"} 
                    />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: req.met ? colors.text : colors.textSecondary }}>
                      {req.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="lock-check-outline" size={22} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t('forgotPassword.confirmPasswordLabel')}
              placeholderTextColor={colors.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <MaterialCommunityIcons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.updateBtn, { backgroundColor: colors.accent }]} 
            onPress={handleUpdate}
            disabled={loading}
          >
            <Text style={styles.updateBtnText}>
              {loading ? t('common.loading') : t('forgotPassword.updatePassword')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { padding: 20 },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 10 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 40 },
  errorText: { color: '#FF3B30', fontSize: 14, marginBottom: 15, fontWeight: '500' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 15, height: 65, width: '100%', borderWidth: 1, marginBottom: 20 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', height: '100%' },
  updateBtn: { width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  updateBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});

export default NewPasswordScreen;
