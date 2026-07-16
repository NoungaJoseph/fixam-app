import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const { width, height } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async () => {
    if (!email) {
      setErrorMsg(t('forgotPassword.emailRequired'));
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg(t('forgotPassword.invalidEmail'));
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Assuming you have an api service configured
      const api = require('../../services/api').default;
      const res = await api.post('/auth/forgot-password', { email, language });
      if (res.data.success) {
        // Navigate to OTP screen passing the email
        navigation.navigate('ForgotPasswordOTP', { email });
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
    <View 
      style={[styles.background, { backgroundColor: colors.background }]}
    >
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]} edges={['top']}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F0F9FF' }]}>
            <MaterialCommunityIcons name="lock-reset" size={50} color={colors.accent} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t('forgotPassword.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('forgotPassword.subtitle')}
          </Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="email-outline" size={22} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t('forgotPassword.emailPlaceholder')}
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={colors.accent}
            />
          </View>

          <TouchableOpacity style={[styles.resetBtn, { backgroundColor: colors.accent }]} onPress={handleReset}>
            <Text style={styles.resetBtnText}>
              {loading ? t('common.loading') : t('forgotPassword.sendCode')}
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  backBtn: { padding: 20 },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 40, alignItems: 'center' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 15 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 15, height: 65, width: '100%', borderWidth: 1, marginBottom: 30 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', height: '100%' },
  resetBtn: { width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  resetBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  errorText: { color: '#FF3B30', fontSize: 14, marginBottom: 15, textAlign: 'center', fontWeight: '500' },
});

export default ForgotPasswordScreen;
