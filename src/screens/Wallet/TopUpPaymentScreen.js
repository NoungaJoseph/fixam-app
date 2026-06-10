import React, { useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, Image, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const METHODS = [
  { id: 'mtn', name: 'MTN Mobile Money', icon: 'https://seeklogo.com/images/M/mtn-logo-40644FC8B0-seeklogo.com.png', type: 'momo' },
  { id: 'orange', name: 'Orange Money', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1200px-Orange_logo.svg.png', type: 'momo' },
  { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card-outline', type: 'card' },
];

const TopUpPaymentScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { package: pkg } = route.params || {};
  const [selectedMethod, setSelectedMethod] = useState('mtn');
  const [phone, setPhone] = useState('670671249');
  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    if ((selectedMethod === 'mtn' || selectedMethod === 'orange') && !phone) {
      Alert.alert('Phone Required', 'Please enter your mobile money phone number.');
      return;
    }
    
    // Simulate payment flow
    Alert.alert(
      'Confirm Payment',
      `You are about to pay ${pkg?.price} FCFA for ${pkg?.coins} coins via ${METHODS.find(m => m.id === selectedMethod)?.name}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay Now', 
          onPress: async () => {
            setLoading(true);
            try {
              const res = await api.post('/wallet/topup', {
                coins: pkg?.coins || 0,
                reference: `FIX-${Date.now()}`,
                paymentMethod: METHODS.find(m => m.id === selectedMethod)?.name,
                phone,
              });
              navigation.navigate('TopUpSuccess', { package: pkg, transaction: res.data.data });
            } catch (error) {
              Alert.alert('Request failed', error.response?.data?.message || 'Could not submit payment request.');
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Payment Method</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Purchase Summary</Text>
              <MaterialCommunityIcons name="receipt-outline" size={20} color={colors.placeholder} />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Package</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{pkg?.coins} Coins</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Bonus</Text>
              <Text style={[styles.summaryValue, { color: '#22C55E' }]}>+{pkg?.bonus} Coins</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total Price</Text>
              <Text style={[styles.totalValue, { color: colors.accent }]}>{pkg?.price} FCFA</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Payment Method</Text>

          {METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                onPress={() => setSelectedMethod(method.id)}
                style={[
                  styles.methodCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? colors.accent : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  }
                ]}
              >
                <View style={[styles.methodIconWrap, { backgroundColor: isDarkMode ? colors.surface : '#F8FAFC' }]}>
                  {method.type === 'momo' ? (
                    <Image source={{ uri: method.icon }} style={styles.momoIcon} />
                  ) : (
                    <MaterialCommunityIcons name={method.icon} size={26} color={colors.primary} />
                  )}
                </View>
                <Text style={[styles.methodName, { color: colors.text }]}>{method.name}</Text>
                <View style={[styles.radio, { borderColor: isSelected ? colors.accent : colors.border }]}>
                  {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Momo Phone Input */}
          {(selectedMethod === 'mtn' || selectedMethod === 'orange') && (
            <View style={styles.phoneSection}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MOBILE MONEY NUMBER</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.countryCode}>
                  <Text style={[styles.countryText, { color: colors.text }]}>🇨🇲 +237</Text>
                  <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="6xx xxx xxx"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
                A payment prompt will be sent to this number.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.payBtn, { backgroundColor: colors.accent }]}
            onPress={handlePay}
          >
            <MaterialCommunityIcons name="lock-outline" size={20} color="#FFF" />
            <Text style={styles.payBtnText}>{loading ? 'Submitting...' : `Confirm & Pay ${pkg?.price} FCFA`}</Text>
          </TouchableOpacity>

          <View style={styles.secureBadge}>
            <MaterialCommunityIcons name="shield-lock-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.secureBadgeText, { color: colors.textSecondary }]}>End-to-end encrypted transaction</Text>
          </View>
        </ScrollView>
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
  content: { padding: 22, paddingBottom: 40 },
  summaryCard: { borderRadius: 8, padding: 20, borderWidth: 1, marginBottom: 25 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryTitle: { fontSize: 16, fontWeight: '800' },
  divider: { height: 1, marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  summaryLabel: { fontSize: 14, fontWeight: '600' },
  summaryValue: { fontSize: 15, fontWeight: '800' },
  totalLabel: { fontSize: 16, fontWeight: '900' },
  totalValue: { fontSize: 20, fontWeight: '900' },
  sectionTitle: { fontSize: 17, fontWeight: '900', marginBottom: 15 },
  methodCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginBottom: 12, gap: 14, borderBottomWidth: 1 },
  methodIconWrap: { width: 42, height: 42, justifyContent: 'center', alignItems: 'flex-start', overflow: 'hidden' },
  momoIcon: { width: 32, height: 32, resizeMode: 'contain' },
  methodName: { flex: 1, fontSize: 15, fontWeight: '700' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  phoneSection: { marginTop: 10, marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 8, borderWidth: 0, borderBottomWidth: 1, paddingHorizontal: 4 },
  countryCode: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countryText: { fontSize: 14, fontWeight: '700' },
  vDivider: { width: 1, height: 24, marginHorizontal: 5 },
  input: { flex: 1, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  inputHint: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  payBtn: { height: 56, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  payBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  secureBadgeText: { fontSize: 11, fontWeight: '600' },
});

export default TopUpPaymentScreen;
