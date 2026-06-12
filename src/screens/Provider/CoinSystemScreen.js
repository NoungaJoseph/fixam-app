import React, { useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const PACKAGES = [
  { id: 'p1', coins: 10, price: '5,000 FCFA', label: 'Starter', popular: false, bonus: 0 },
  { id: 'p2', coins: 20, price: '10,000 FCFA', label: 'Standard', popular: true, bonus: 2 },
  { id: 'p3', coins: 30, price: '15,000 FCFA', label: 'Popular', popular: false, bonus: 3 },
  { id: 'p4', coins: 40, price: '20,000 FCFA', label: 'Growth', popular: false, bonus: 4 },
  { id: 'p5', coins: 50, price: '25,000 FCFA', label: 'Premium', popular: false, bonus: 5 },
];

const CoinSystemScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { walletBalance, transactions } = useAppContext();
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [selectedPkg, setSelectedPkg] = useState('p2');

  const handleContinue = () => {
    const pkg = PACKAGES.find(p => p.id === selectedPkg);
    navigation.navigate('CoinPaymentForm', { package: pkg });
  };

  const translateTransactionDescription = (tx) => {
    const description = String(tx.description || '').toLowerCase();
    if (description.includes('purchase')) return t('payments.coinPurchase');
    if (description.includes('spent') || description.includes('unlock') || description.includes('apply')) return t('payments.coinSpent');
    if (description.includes('service')) return t('payments.servicePayment');
    return tx.description || (tx.amount > 0 ? t('payments.coinPurchase') : t('payments.coinSpent'));
  };

  // Branded Payment Provider Logos
  const paymentLogos = [
    { name: 'MTN MoMo', uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/MTN_Logo.svg/320px-MTN_Logo.svg.png' },
    { name: 'Orange Money', uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/320px-Orange_logo.svg.png' },
  ];

  const getPackageBadgeColors = (label) => {
    switch (label) {
      case 'Standard':
        return { bg: '#ECFDF5', text: '#0D9488' };
      case 'Popular':
        return { bg: '#EFF6FF', text: '#2563EB' };
      case 'Premium':
        return { bg: '#F3E8FF', text: '#8B5CF6' };
      default:
        return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  return (
    <View style={[styles.background, { backgroundColor: isDarkMode ? '#0F172A' : '#FAFAFA' }]}>
      
      
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.openDrawer()} 
            style={[styles.headerBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
          >
            <MaterialCommunityIcons name="menu" size={22} color={isDarkMode ? '#FFF' : '#0F172A'} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{t('wallet.topUpCoins')}</Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('HelpCenter')}
            style={[styles.headerBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
          >
            <MaterialCommunityIcons name="help-circle-outline" size={22} color={isDarkMode ? '#FFF' : '#0F172A'} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Gradient Balance Card */}
          <LinearGradient
            colors={['#0D9488', '#0EA5E9', '#1D4ED8']}
            style={styles.balanceCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.balanceLeft}>
              <View style={styles.coinIconWrapper}>
                <MaterialCommunityIcons name="database" size={22} color="#FFF" />
              </View>
              
              <Text style={styles.balanceLabel}>{t('wallet.currentBalance')}</Text>
              <View style={styles.balanceValueRow}>
                <Text style={styles.balanceValue}>{walletBalance || 0}</Text>
                <Text style={styles.balanceUnit}>{t('wallet.coins')}</Text>
              </View>
            </View>

            <View style={styles.balanceRight}>
              <MaterialCommunityIcons name="wallet-plus-outline" size={80} color="rgba(255,255,255,0.15)" style={styles.bgWalletIcon} />
              <View style={[styles.statPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <MaterialCommunityIcons name="account-circle-outline" size={14} color="#FFF" />
                <Text style={styles.statPillText}>{user?.fullName?.split(' ')[0] || t('common.provider')}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Section Titles */}
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{t('wallet.choosePackage')}</Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
            {t('wallet.packageSubtitle')}
          </Text>

          {/* Packages List */}
          <View style={styles.packagesList}>
            {PACKAGES.map((pkg) => {
              const isSelected = selectedPkg === pkg.id;
              const badgeColors = getPackageBadgeColors(pkg.label);
              const cleanPrice = pkg.price.replace(' FCFA', '');

              return (
                <TouchableOpacity
                  key={pkg.id}
                  onPress={() => setSelectedPkg(pkg.id)}
                  style={[
                    styles.pkgCard,
                    { 
                      backgroundColor: isDarkMode ? '#1E293B' : '#FFF',
                      borderColor: isSelected ? '#0D9488' : (isDarkMode ? '#334155' : '#F1F5F9'),
                      borderWidth: isSelected ? 2 : 1,
                    }
                  ]}
                  activeOpacity={0.8}
                >
                  {/* BEST VALUE Banner overlay */}
                  {pkg.popular && (
                    <View style={styles.popularBadge}>
                      <MaterialCommunityIcons name="star" size={10} color="#FFF" style={{ marginRight: 2 }} />
                      <Text style={styles.popularText}>{t('wallet.bestValue')}</Text>
                    </View>
                  )}

                  {/* Left Circle Icon */}
                  <View style={[
                    styles.pkgIconContainer, 
                    { backgroundColor: isSelected ? '#ECFDF5' : (isDarkMode ? '#0F172A' : '#F1F5F9') }
                  ]}>
                    <MaterialCommunityIcons 
                      name="database" 
                      size={20} 
                      color={isSelected ? '#10B981' : (isDarkMode ? '#94A3B8' : '#334155')} 
                    />
                  </View>

                  {/* Middle Column details */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pkgCoins, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>
                      {t('wallet.coinCount', { count: pkg.coins })}
                    </Text>
                    
                    <View style={[styles.badgePill, { backgroundColor: isDarkMode ? '#115E5920' : badgeColors.bg }]}>
                      <Text style={[styles.badgeText, { color: isDarkMode ? '#0D9488' : badgeColors.text }]}>
                        {t(`wallet.packages.${pkg.label.toLowerCase()}`)}
                      </Text>
                    </View>
                  </View>

                  {/* Right Column price and radio check */}
                  <View style={styles.pkgRight}>
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceValue, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>
                        {cleanPrice}
                      </Text>
                      <Text style={[styles.priceUnit, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                        {" "}FCFA
                      </Text>
                    </View>

                    {isSelected ? (
                      <MaterialCommunityIcons name="check-circle" size={22} color="#0D9488" />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={22} color="#CBD5E1" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Info Block card */}
          <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F0FDF4', borderColor: isDarkMode ? '#334155' : '#DCFCE7' }]}>
            <View style={styles.infoLeft}>
              <MaterialCommunityIcons name="shield-check" size={22} color="#10B981" style={{ marginTop: 2 }} />
            </View>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.infoTitle, { color: isDarkMode ? '#FFF' : '#14532D' }]}>{t('wallet.whyTopUp')}</Text>
              <Text style={[styles.infoSub, { color: isDarkMode ? '#94A3B8' : '#166534' }]}>
                {t('wallet.whyTopUpDesc')}
              </Text>
            </View>
            
            {/* Wallet 3D asset */}
            <Image 
              source={{ uri: 'https://img.icons8.com/isometric/512/wallet.png' }}
              style={styles.infoWalletImage}
            />
          </View>

          {/* Checkout Button */}
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons name="lock" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.continueBtnText}>{t('wallet.continueToPayment')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#FFF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {/* Secure transaction row */}
          <View style={styles.secureRow}>
            <MaterialCommunityIcons name="check-decagram" size={16} color="#22C55E" />
            <Text style={[styles.secureText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
              {t('wallet.securePayment')}
            </Text>
          </View>

          {/* Payment providers footer logo card */}
          <View style={[styles.logoCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#334155' : '#F1F5F9', marginBottom: 28 }]}>
            <View style={styles.logoRow}>
              <View style={styles.badgeWrapper}>
                <View style={styles.mtnBadge}>
                  <Text style={styles.mtnText1}>MTN</Text>
                  <Text style={styles.mtnText2}>momo</Text>
                </View>
                <Text style={[styles.badgeLabel, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>MTN MoMo</Text>
              </View>
              
              <View style={styles.badgeWrapper}>
                <View style={styles.orangeBadge}>
                  <Text style={styles.orangeText1}>orange</Text>
                  <Text style={styles.orangeText2}>money</Text>
                </View>
                <Text style={[styles.badgeLabel, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Orange Money</Text>
              </View>
            </View>
          </View>

          {/* Transaction History Section */}
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFF' : '#0F172A', marginTop: 12 }]}>{t('wallet.transactionHistory')}</Text>
          
          {!transactions || transactions.length === 0 ? (
            <View style={[styles.emptyHistory, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
              <MaterialCommunityIcons name="history" size={40} color={isDarkMode ? '#475569' : '#CBD5E1'} />
              <Text style={[styles.emptyHistoryText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{t('payments.noTransactions')}</Text>
            </View>
          ) : (
            <View style={[styles.txListContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
              {transactions.slice(0, 10).map((tx, i) => (
                <View 
                  key={tx.id || i} 
                  style={[
                    styles.txRow, 
                    { 
                      borderBottomColor: isDarkMode ? '#334155' : '#F8FAFC',
                      borderBottomWidth: i === transactions.length - 1 ? 0 : 1 
                    }
                  ]}
                >
                  <View style={[
                    styles.txIcon, 
                    { backgroundColor: tx.amount > 0 ? (isDarkMode ? 'rgba(34,197,94,0.15)' : '#F0FDF4') : (isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEF2F2') }
                  ]}>
                    <MaterialCommunityIcons 
                      name={tx.amount > 0 ? 'arrow-down-left' : 'arrow-up-right'} 
                      size={18} 
                      color={tx.amount > 0 ? '#22C55E' : '#EF4444'} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>
                      {translateTransactionDescription(tx)}
                    </Text>
                    <Text style={[styles.txDate, { color: isDarkMode ? '#64748B' : '#94A3B8' }]}>
                      {new Date(tx.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.amount > 0 ? '#22C55E' : '#EF4444' }]}>
                    {tx.amount > 0 ? '+' : ''}{t('wallet.coinCount', { count: tx.amount })}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  
  // Header Styles
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 10 : 35, 
    paddingBottom: 12 
  },
  headerBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '800' 
  },

  content: { 
    paddingHorizontal: 20, 
    paddingTop: 8,
    paddingBottom: 40 
  },

  // Gradient Balance Card Styles
  balanceCard: { 
    borderRadius: 24, 
    padding: 24, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 28,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  balanceLeft: {
    flex: 1,
    zIndex: 2,
  },
  coinIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: { 
    color: 'rgba(255,255,255,0.75)', 
    fontSize: 13, 
    fontWeight: '700', 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2 
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceValue: { 
    color: '#FFF', 
    fontSize: 32, 
    fontWeight: '900' 
  },
  balanceUnit: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 6,
  },
  estimatedText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  balanceRight: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  bgWalletIcon: {
    position: 'absolute',
    top: -15,
    right: -10,
    opacity: 0.9,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 'auto',
  },
  statPillText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Titles
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    marginBottom: 6 
  },
  subtitle: { 
    fontSize: 13, 
    lineHeight: 18, 
    marginBottom: 22 
  },

  // Packages Cards
  packagesList: {
    gap: 12,
    marginBottom: 20,
  },
  pkgCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 20,
    padding: 16, 
    gap: 14, 
    position: 'relative', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  popularBadge: { 
    position: 'absolute', 
    top: -10, 
    right: 16, 
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFF',
    zIndex: 50,
  },
  popularText: { 
    color: '#FFF', 
    fontSize: 9, 
    fontWeight: '900' 
  },
  pkgIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pkgCoins: { 
    fontSize: 15, 
    fontWeight: '800',
    marginBottom: 3,
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pkgRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  priceRow: { 
    flexDirection: 'row', 
    alignItems: 'baseline' 
  },
  priceValue: { 
    fontSize: 16, 
    fontWeight: '800' 
  },
  priceUnit: { 
    fontSize: 10, 
    fontWeight: '700' 
  },

  // Info card styles
  infoCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  infoLeft: {
    justifyContent: 'flex-start',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoSub: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    width: '80%',
  },
  infoWalletImage: {
    width: 80,
    height: 80,
    position: 'absolute',
    right: 8,
    bottom: -15,
    resizeMode: 'contain',
  },

  // Checkout Button
  continueBtn: { 
    height: 54, 
    borderRadius: 16, 
    backgroundColor: '#0D9488',
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 18, 
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  continueBtnText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '800' 
  },
  secureRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 4, 
    marginTop: 12,
    marginBottom: 24,
  },
  secureText: { 
    fontSize: 11, 
    fontWeight: '700' 
  },

  // Logo Footer
  logoCard: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mtnBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFCC00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  mtnText1: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
    lineHeight: 8,
  },
  mtnText2: {
    fontSize: 6,
    fontWeight: '900',
    color: '#0066CC',
    lineHeight: 7,
    fontStyle: 'italic',
  },
  orangeBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F16E00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orangeText1: {
    fontSize: 6,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 7,
  },
  orangeText2: {
    fontSize: 5,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 6,
    textTransform: 'uppercase',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Transaction History styles
  emptyHistory: { 
    borderRadius: 20, 
    borderWidth: 1, 
    padding: 32, 
    alignItems: 'center', 
    gap: 10 
  },
  emptyHistoryText: { 
    fontSize: 13, 
    fontWeight: '600' 
  },
  txListContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 1,
  },
  txRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderBottomWidth: 1 
  },
  txIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  txTitle: { 
    fontSize: 14, 
    fontWeight: '800' 
  },
  txDate: { 
    fontSize: 11, 
    marginTop: 2 
  },
  txAmount: { 
    fontSize: 14, 
    fontWeight: '900' 
  },
});

export default CoinSystemScreen;
