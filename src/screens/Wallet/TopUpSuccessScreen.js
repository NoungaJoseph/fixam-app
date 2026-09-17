import React, { useEffect, useRef } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Animated, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { COUNTRY_DATA, detectCountryFromPhone } from '../../constants/countries';

const TopUpSuccessScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { package: pkg, isPending } = route.params || {};
  const isProvider = user?.role?.toUpperCase() === 'PROVIDER';

  const userCountry = user?.country || detectCountryFromPhone(user?.phone) || 'Cameroon';
  const countryConfig = COUNTRY_DATA[userCountry] || COUNTRY_DATA.Cameroon;
  const currency = countryConfig.currency;
  const isFr = user?.language === 'fr' || user?.lang === 'fr';

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
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Animated icon */}
          <Animated.View style={[styles.iconCircle, { backgroundColor: isPending ? '#0D9488' : '#22C55E', transform: [{ scale: scaleAnim }] }]}>
            <MaterialCommunityIcons name={isPending ? 'email-send' : 'check-bold'} size={60} color="#FFF" />
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isPending
                ? (isFr ? 'Demande Reçue !' : 'Request Received!')
                : (isFr ? 'Paiement Réussi !' : 'Payment Successful!')
              }
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isPending
                ? (isFr
                    ? `Votre demande d'achat de ${pkg?.coins || 0} pièces (${pkg?.price}) a été transmise à l'équipe Fixam. Un administrateur vous contactera via les Messages avec les instructions de paiement.`
                    : `Your request for ${pkg?.coins || 0} coins (${pkg?.price}) has been sent to Fixam. An admin will contact you via Messages with payment instructions.`)
                : (isFr
                    ? `${pkg?.coins || 0} pièces ont été ajoutées à votre portefeuille.`
                    : `${pkg?.coins || 0} coins have been added to your wallet.`)
              }
            </Text>

            {/* Next steps card when pending */}
            {isPending && (
              <View style={[styles.receiptCard, { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }]}>
                <Text style={[styles.receiptTitle, { color: '#92400E', marginBottom: 10 }]}>
                  {isFr ? '📌 Prochaines étapes :' : '📌 Next Steps:'}
                </Text>
                {isFr ? (
                  <>
                    <Text style={styles.stepText}>1. Vérifiez vos <Text style={{ fontWeight: '800' }}>Messages</Text> dans l'app.</Text>
                    <Text style={styles.stepText}>2. L'admin vous enverra un numéro de transfert.</Text>
                    <Text style={styles.stepText}>3. Effectuez le transfert Mobile Money.</Text>
                    <Text style={styles.stepText}>4. Vos pièces seront ajoutées dans les 24h.</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.stepText}>1. Check your <Text style={{ fontWeight: '800' }}>Messages</Text> in the app.</Text>
                    <Text style={styles.stepText}>2. Admin will send you a transfer number.</Text>
                    <Text style={styles.stepText}>3. Complete your Mobile Money transfer.</Text>
                    <Text style={styles.stepText}>4. Your coins will be added within 24h.</Text>
                  </>
                )}
              </View>
            )}

            {/* Receipt card for actual success */}
            {!isPending && (
              <View style={[styles.receiptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.receiptHeader}>
                  <Text style={[styles.receiptTitle, { color: colors.text }]}>{isFr ? 'Reçu de Transaction' : 'Transaction Receipt'}</Text>
                  <Text style={[styles.receiptDate, { color: colors.textSecondary }]}>{new Date().toLocaleDateString()}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>{isFr ? 'Pièces ajoutées' : 'Amount Added'}</Text>
                  <View style={styles.coinsRow}>
                    <MaterialCommunityIcons name="database" size={18} color="#F97316" />
                    <Text style={[styles.receiptValue, { color: colors.text }]}>{pkg?.coins} Coins</Text>
                  </View>
                </View>
                {pkg?.bonus > 0 && (
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>{isFr ? 'Bonus' : 'Bonus Added'}</Text>
                    <Text style={[styles.receiptValue, { color: '#22C55E' }]}>+{pkg?.bonus} Coins</Text>
                  </View>
                )}
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>{isFr ? 'Montant payé' : 'Amount Paid'}</Text>
                  <Text style={[styles.receiptValue, { color: colors.text }]}>{pkg?.price} {currency}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.accent }]}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: isProvider ? 'CoinSystem' : 'WalletMain' }] })}
            >
              <Text style={styles.doneBtnText}>{isFr ? 'Retour au Portefeuille' : 'Back to Wallet'}</Text>
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
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 25, paddingHorizontal: 15 },
  receiptCard: { width: '100%', borderRadius: 24, borderWidth: 1, padding: 22, marginBottom: 30 },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  receiptTitle: { fontSize: 15, fontWeight: '800' },
  receiptDate: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, marginVertical: 15, borderStyle: 'dashed', borderRadius: 1 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  receiptLabel: { fontSize: 13, fontWeight: '600' },
  receiptValue: { fontSize: 14, fontWeight: '800' },
  coinsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stepText: { fontSize: 13, color: '#78350F', marginBottom: 6, lineHeight: 20 },
  doneBtn: { width: '100%', height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});

export default TopUpSuccessScreen;
