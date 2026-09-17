import React, { useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const ChangePasswordScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { refreshUser } = useAuth();
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const requirements = [
    { label: t('validation.reqMinLength', 'At least 8 characters'), met: newPassword.length >= 8 },
    { label: t('validation.reqNumber', 'Contains a number'), met: /\d/.test(newPassword) },
    { label: t('validation.reqSpecial', 'Contains a special character (!@#$...)'), met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) },
    { label: t('validation.reqUppercase', 'Contains uppercase letter'), met: /[A-Z]/.test(newPassword) },
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

  const handleSave = async () => {
    const nextErrors = {};
    if (!currentPassword) nextErrors.current = t('profile.currentPasswordRequired');
    
    if (newPassword.length > 0 && metCount < 3) {
      nextErrors.newPass = t('validation.passwordFormat', 'Password must meet at least 3 requirements');
    }

    if (newPassword !== confirmPassword) nextErrors.confirm = t('profile.passwordMismatch');
    if (!confirmPassword) nextErrors.confirm = t('profile.confirmPasswordRequired');
    setErrors(nextErrors);
    setSuccess('');
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await api.post('/users/change-password', {
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmNewPassword: confirmPassword,
      });
      await refreshUser?.();
      setSuccess(res.data?.message || t('profile.passwordUpdatedSuccess'));
      setTimeout(() => navigation.goBack(), 700);
    } catch (error) {
      setErrors({ form: error.response?.data?.message || t('profile.updateFailed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.changePassword')}</Text>
          <View style={{ width: 42 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.lockIcon}>
            <MaterialCommunityIcons name="lock-reset" size={36} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('profile.updatePassword')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('profile.passwordHelp')}
          </Text>

          {/* Current Password */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('profile.currentPassword')}</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border }]}>
              <TextInput
                value={currentPassword}
                onChangeText={(text) => setCurrentPassword(text)}
                placeholder="Enter current password"
                placeholderTextColor="rgba(0,0,0,0.4)"
                style={[styles.input, { color: colors.text }]}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="oneTimeCode"
                importantForAutofill="no"
                editable={true}
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <MaterialCommunityIcons name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.placeholder} />
              </TouchableOpacity>
            </View>
            {errors.current ? <Text style={styles.inlineError}>{errors.current}</Text> : null}
          </View>

          {/* New Password */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('profile.newPassword')}</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border }]}>
              <TextInput
                value={newPassword}
                onChangeText={(text) => setNewPassword(text)}
                placeholder="Enter new password"
                placeholderTextColor="rgba(0,0,0,0.4)"
                style={[styles.input, { color: colors.text }]}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="oneTimeCode"
                importantForAutofill="no"
                editable={true}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <MaterialCommunityIcons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.placeholder} />
              </TouchableOpacity>
            </View>
            {errors.newPass ? <Text style={styles.inlineError}>{errors.newPass}</Text> : null}
          </View>

          {/* Strength indicator */}
          {newPassword.length > 0 && (
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

          {/* Confirm Password */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('profile.confirmNewPassword')}</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border }]}>
              <TextInput
                value={confirmPassword}
                onChangeText={(text) => setConfirmPassword(text)}
                placeholder="Re-enter new password"
                placeholderTextColor="rgba(0,0,0,0.4)"
                style={[styles.input, { color: colors.text }]}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="oneTimeCode"
                importantForAutofill="no"
                editable={true}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <MaterialCommunityIcons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.placeholder} />
              </TouchableOpacity>
            </View>
            {errors.confirm ? <Text style={styles.inlineError}>{errors.confirm}</Text> : null}
          </View>

          {!errors.confirm && confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <Text style={styles.matchError}>{t('profile.passwordMismatch')}</Text>
          )}
          {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]} onPress={handleSave} disabled={loading}>
            <MaterialCommunityIcons name="lock-check-outline" size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>{loading ? t('profile.updating') : t('profile.updatePassword', 'Update Password')}</Text>
          </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 24, paddingBottom: 120 },
  lockIcon: { width: 70, height: 70, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 18, alignSelf: 'center' },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 30 },
  field: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, paddingHorizontal: 16, height: 52 },
  input: { flex: 1, fontSize: 15, fontWeight: '500', height: '100%' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8, marginBottom: 16 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '700' },
  matchError: { color: '#EF4444', fontSize: 12, fontWeight: '600', marginTop: -12, marginBottom: 12 },
  inlineError: { color: '#EF4444', fontSize: 12, fontWeight: '600', marginTop: 6 },
  formError: { color: '#EF4444', fontSize: 13, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  successText: { color: '#22C55E', fontSize: 13, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  saveBtn: { height: 56, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});

export default ChangePasswordScreen;
