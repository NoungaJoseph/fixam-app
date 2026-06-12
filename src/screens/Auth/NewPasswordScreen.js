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

  const handleUpdate = async () => {
    if (password.length < 8) {
      setErrorMsg(t('forgotPassword.passwordShort'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('forgotPassword.passwordMismatch'));
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
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="lock-check-outline" size={22} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t('forgotPassword.confirmPasswordLabel')}
              placeholderTextColor={colors.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
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
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  updateBtn: { width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  updateBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});

export default NewPasswordScreen;
