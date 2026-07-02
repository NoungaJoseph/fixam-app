import React, { useEffect, useRef } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Animated, Image, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { COUNTRY_DATA, detectCountryFromPhone } from '../../constants/countries';

const TopUpSuccessScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { package: pkg } = route.params || {};
  const isProvider = user?.role?.toUpperCase() === 'PROVIDER';

  const userCountry = user?.country || detectCountryFromPhone(user?.phone) || 'Cameroon';
  const countryConfig = COUNTRY_DATA[userCountry] || COUNTRY_DATA.Cameroon;
  const currency = countryConfig.currency;
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Animated checkmark */}
          <Animated.View style={[styles.iconCircle, { backgroundColor: '#22C55E', transform: [{ scale: scaleAnim }] }]}>
            <MaterialCommunityIcons name="check-bold" size={60} color="#FFF" />
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
            <Text style={[styles.title, { color: colors.text }]}>Payment Request Sent</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Your request for {pkg?.coins || 0} coins is pending admin approval. You will receive a notification once payment is confirmed.
            </Text>

            {/* Receipt card */}
            <View style={[styles.receiptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.receiptHeader}>
                <Text style={[styles.receiptTitle, { color: colors.text }]}>Transaction Receipt</Text>
                <Text style={[styles.receiptDate, { color: colors.textSecondary }]}>{new Date().toLocaleDateString()}</Text>
              </View>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Amount Added</Text>
                <View style={styles.coinsRow}>
                  <MaterialCommunityIcons name="database" size={18} color="#F97316" />
                  <Text style={[styles.receiptValue, { color: colors.text }]}>{pkg?.coins} Coins</Text>
                </View>
              </View>

              {pkg?.bonus > 0 && (
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Bonus Added</Text>
                  <Text style={[styles.receiptValue, { color: '#22C55E' }]}>+{pkg?.bonus} Coins</Text>
                </View>
              )}

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Amount Paid</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>{pkg?.price} {currency}</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Transaction ID</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>#FIX-{Math.floor(Math.random() * 1000000)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.accent }]}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: isProvider ? 'CoinSystem' : 'WalletMain' }] })}
            >
              <Text style={styles.doneBtnText}>Back to Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: isProvider ? 'CoinSystem' : 'WalletMain' }] })}>
              <Text style={[styles.historyBtnText, { color: colors.textSecondary }]}>View Transaction History</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 25, paddingBottom: 40 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 30, shadowColor: '#22C55E', shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 35, paddingHorizontal: 15 },
  receiptCard: { width: '100%', borderRadius: 24, borderWidth: 1, padding: 22, marginBottom: 30 },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  receiptTitle: { fontSize: 15, fontWeight: '800' },
  receiptDate: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, marginVertical: 15, borderStyle: 'dashed', borderRadius: 1 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  receiptLabel: { fontSize: 13, fontWeight: '600' },
  receiptValue: { fontSize: 14, fontWeight: '800' },
  coinsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  doneBtn: { width: '100%', height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  historyBtn: { padding: 10 },
  historyBtnText: { fontSize: 14, fontWeight: '700' },
});

export default TopUpSuccessScreen;
