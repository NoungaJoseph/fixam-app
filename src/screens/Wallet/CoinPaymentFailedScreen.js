import React from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const CoinPaymentFailedScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { message, package: pkg } = route.params || {};

  const handleTryAgain = () => {
    navigation.replace('CoinPaymentForm', { package: pkg });
  };

  const handleContactSupport = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('MainTabs', { screen: 'Messages', params: { screen: 'ChatList' } });
      return;
    }
    navigation.navigate('ChatList');
  };

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="close" size={58} color="#FFF" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t('payments.failed')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {message || t('payments.paymentNotCompleted', 'Your payment could not be completed. Please try again.')}
          </Text>
        </View>

        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleTryAgain}
          >
            <Text style={styles.primaryBtnText}>{t('payments.tryAgain')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={handleContactSupport}
          >
            <MaterialCommunityIcons name="message" size={20} color={colors.accent} />
            <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>{t('payments.contactSupport')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '600'
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#EF4444'
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800'
  },
  secondaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700'
  }
});

export default CoinPaymentFailedScreen;
