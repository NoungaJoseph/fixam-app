import React, { useEffect, useRef } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Animated, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const CoinPaymentSuccessScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { coins, package: pkg } = route.params || {};
  const isProvider = user?.role?.toUpperCase() === 'PROVIDER';
  const coinCount = coins || pkg?.coins || 0;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true })
    ]).start();
  }, []);

  const handleBackToWallet = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: isProvider ? 'CoinSystem' : 'WalletMain' }]
    });
  };

  const handleContinue = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('MainTabs');
      return;
    }
    navigation.goBack();
  };

  return (
    <View 
      style={[styles.background, { backgroundColor: colors.background }]}
    >
      
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Animated checkmark */}
          <Animated.View
            style={[
              styles.iconCircle,
              { backgroundColor: '#22C55E', transform: [{ scale: scaleAnim }] }
            ]}
          >
            <MaterialCommunityIcons name="check-bold" size={60} color="#FFF" />
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
            <Text style={[styles.title, { color: colors.text }]}>{t('payments.success')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('wallet.coinCount', { count: coinCount })}
            </Text>

            {/* Status Card */}
            <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>{t('payments.status')}</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
                  <MaterialCommunityIcons name="check-circle" size={14} color="#16A34A" />
                  <Text style={[styles.statusText, { color: '#16A34A' }]}>{t('payments.completed')}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>{t('payments.package')}</Text>
                <Text style={[styles.statusValue, { color: colors.text }]}>{pkg?.label ? t(`wallet.packages.${pkg.label.toLowerCase()}`) : t('wallet.buyCoins')}</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.statusRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>{t('payments.coinsAdded')}</Text>
                <Text style={[styles.totalValue, { color: colors.accent }]}>
                  {t('wallet.coinCount', { count: coinCount })}
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            onPress={handleBackToWallet}
          >
            <Text style={styles.primaryBtnText}>{t('payments.goToWallet')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={handleContinue}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>{t('common.continue')}</Text>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#22C55E',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10
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
    marginBottom: 25
  },
  statusCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FEF08A',
    borderRadius: 8
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F97316'
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '700'
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900'
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800'
  },
  divider: {
    height: 1,
    marginVertical: 8
  },
  stepsCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20
  },
  stepsTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12
  },
  stepItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepNumberText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2
  },
  stepDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18
  },
  notificationBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  notificationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18
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
    alignItems: 'center'
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

export default CoinPaymentSuccessScreen;
