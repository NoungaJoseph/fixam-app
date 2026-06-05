import React from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { translateStatus } from '../../i18n/translate';

const WalletScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { walletBalance, transactions } = useAppContext();
  const { t } = useLanguage();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Premium Gradient Balance Card */}
        <LinearGradient
          colors={['#1D4ED8', '#0D9488']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.balanceLabel}>{t('payments.myWalletBalance')}</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceAmount}>{walletBalance}</Text>
          <Text style={styles.balanceCurrency}> {t('payments.coins')}</Text>
        </View>
        <TouchableOpacity
          style={styles.topUpBtn}
          onPress={() => navigation.navigate('TopUp')}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#0D9488" />
          <Text style={styles.topUpText}>{t('payments.topUpBalance')}</Text>
        </TouchableOpacity>
      </LinearGradient>

        {/* Transaction History Header */}
        <View style={styles.historyHeaderRow}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>{t('payments.recentTransactions')}</Text>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsContainer}>
          {transactions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialCommunityIcons name="history" size={48} color={colors.textSecondary + '40'} />
              <Text style={{ color: colors.textSecondary, marginTop: 10, fontWeight: '700' }}>{t('payments.noTransactions')}</Text>
            </View>
          ) : (
            transactions.map((item) => (
              <View key={item.id} style={[styles.transactionCard, { borderBottomColor: colors.border }]}>
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons 
                    name={item.type === 'DEPOSIT' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'} 
                    size={22} 
                    color={item.type === 'DEPOSIT' ? '#10B981' : '#EF4444'} 
                  />
                </View>
                
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionTitle, { color: colors.text }]}>
                    {item.type === 'DEPOSIT' ? t('payments.coinPurchase') : t('payments.servicePayment')}
                  </Text>
                  <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.transactionRight}>
                  <Text style={[styles.transactionAmount, { color: item.type === 'DEPOSIT' ? '#10B981' : '#EF4444' }]}>
                    {item.type === 'DEPOSIT' ? `+${item.amount}` : `-${item.amount}`}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'COMPLETED' ? '#10B98120' : '#F59E0B20' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'COMPLETED' ? '#10B981' : '#F59E0B' }]}>
                      {translateStatus(item.status)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Refer Card */}
        <TouchableOpacity 
          style={[styles.offerCard, { borderTopColor: colors.border, borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('Invitation')}
        >
          <View style={styles.offerIconWrap}>
            <MaterialCommunityIcons name="gift-outline" size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.offerTitle, { color: colors.text }]}>{t('payments.earnFreeCoins')}</Text>
            <Text style={[styles.offerSubtitle, { color: colors.textSecondary }]}>{t('payments.inviteEarn')}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  balanceCard: {
    paddingVertical: 28,
    marginTop: 10, marginBottom: 30, borderBottomWidth: 1,
  },
  circleTopRight: {
    position: 'absolute', top: -30, right: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  circleBottomLeft: {
    position: 'absolute', bottom: -40, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  balanceLabel: { fontSize: 11, letterSpacing: 1.5, marginBottom: 10, fontWeight: '800' },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 30 },
  balanceAmount: { fontSize: 48, fontWeight: '900' },
  balanceCurrency: { fontSize: 18, fontWeight: '700', marginLeft: 8 },
  topUpBtn: {
    borderRadius: 8, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3
  },
  topUpText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  historyTitle: { fontSize: 18, fontWeight: '900' },
  seeAll: { fontSize: 14, fontWeight: '700' },
  transactionsContainer: { marginBottom: 30 },
  transactionCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1,
  },
  iconWrap: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  transactionInfo: { flex: 1, marginLeft: 15 },
  transactionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  transactionDate: { fontSize: 12 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: '900', marginBottom: 6 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '900' },
  offerCard: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, gap: 15,
  },
  offerIconWrap: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  offerTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  offerSubtitle: { fontSize: 13, lineHeight: 18 },
});

export default WalletScreen;
