import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

const PasswordSuccessScreen = ({ navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
            <MaterialCommunityIcons name="check-decagram" size={80} color="#34C759" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t('forgotPassword.successTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('forgotPassword.successSubtitle')}
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: colors.accent }]} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.btnText}>{t('forgotPassword.goToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  iconCircle: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 15, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  footer: { paddingHorizontal: 30, paddingBottom: 40 },
  btn: { width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});

export default PasswordSuccessScreen;
