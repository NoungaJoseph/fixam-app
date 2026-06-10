import React, { useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const TopUpAmountScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');

  const COIN_PRICE = 500; // 1 coin = 500 FCFA

  const handleContinue = () => {
    const numAmount = parseInt(amount);
    if (!amount || isNaN(numAmount) || numAmount < 5000) {
      alert(t('payments.minimumTopUp'));
      return;
    }
    
    const coins = Math.floor(numAmount / COIN_PRICE);
    const pkg = { 
      id: 'custom', 
      coins: coins, 
      price: numAmount.toLocaleString(), 
      bonus: 0
    };
    
    navigation.navigate('TopUpPayment', { package: pkg });
  };

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('wallet.customAmount')}</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="currency-usd" size={40} color={colors.accent} />
            </View>
            
            <Text style={[styles.title, { color: colors.text }]}>{t('wallet.howMuchAdd')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('wallet.customAmountSubtitle', { price: COIN_PRICE })}
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.currencyPrefix, { color: colors.textSecondary }]}>FCFA</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            {amount.length > 0 && (
              <View style={[styles.calcBox, { backgroundColor: colors.accent + '10', borderColor: colors.accent }]}>
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>{t('wallet.estimatedCoins')}</Text>
                  <Text style={[styles.calcValue, { color: colors.text }]}>{t('wallet.coinCount', { count: Math.floor(parseInt(amount) / COIN_PRICE) || 0 })}</Text>
                </View>
              </View>
            )}

            <View style={styles.quickAmounts}>
              {[5000, 10000, 15000, 25000].map(amt => (
                <TouchableOpacity 
                  key={amt} 
                  style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setAmount(amt.toString())}
                >
                  <Text style={[styles.quickText, { color: colors.text }]}>{amt.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: colors.accent }]}
              onPress={handleContinue}
            >
              <Text style={styles.continueBtnText}>{t('wallet.continueToPayment')}</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
            </TouchableOpacity>

            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {t('wallet.minimumPurchaseHint')}
            </Text>
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
  content: { padding: 24, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, backgroundColor: 'rgba(249, 115, 22, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 30, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 70, borderRadius: 8, borderWidth: 0, borderBottomWidth: 2, paddingHorizontal: 4, marginBottom: 20 },
  currencyPrefix: { fontSize: 18, fontWeight: '800', marginRight: 15 },
  input: { flex: 1, fontSize: 28, fontWeight: '900' },
  calcBox: { width: '100%', borderRadius: 8, padding: 16, borderWidth: 1, marginBottom: 20 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  calcLabel: { fontSize: 13, fontWeight: '600' },
  calcValue: { fontSize: 15, fontWeight: '800' },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 30 },
  quickBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  quickText: { fontSize: 14, fontWeight: '700' },
  continueBtn: { width: '100%', height: 56, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  hint: { fontSize: 12, marginTop: 15, fontStyle: 'italic' },
});

export default TopUpAmountScreen;
