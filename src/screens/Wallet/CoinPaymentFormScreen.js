import React, { useEffect, useRef, useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { validatePhoneForProvider, getNetworkFromPhone } from '../../utils/phoneValidation';

const PAYMENT_METHODS = [
  { id: 'MTN', label: 'MTN MoMo', color: '#FFCC00', textColor: '#111827', icon: 'cellphone-wireless' },
  { id: 'ORANGE', label: 'Orange Money', color: '#F16E00', textColor: '#FFFFFF', icon: 'cellphone-check' },
];

const CoinPaymentFormScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { fetchAppData } = useAppContext();
  const { t } = useLanguage();
  const { package: pkg } = route.params || {};

  const [paymentId, setPaymentId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('MTN');
  const [formData, setFormData] = useState({
    phone: user?.phone || ''
  });
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('IDLE');
  const [phoneError, setPhoneError] = useState(null);
  const [networkDetected, setNetworkDetected] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    generatePaymentId();
  }, []);

  const generatePaymentId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const id = `PAY-${timestamp}-${random}`;
    setPaymentId(id);
  };

  const getNumericAmount = (value) => {
    return Number(String(value || '').replace(/[^\d]/g, ''));
  };

  const totalCoins = (pkg?.coins || 0) + (pkg?.bonus || 0);

  const pollPaymentStatus = async (reference) => {
    const maxAttempts = 24;
    let attempts = 0;

    const poll = async () => {
      attempts++;

      try {
        const response = await api.get('/payments/status/' + reference);
        const { status } = response.data;

        if (status === 'success') {
          await fetchAppData?.();
          navigation.replace('CoinPaymentSuccess', {
            coins: response.data.coins,
            package: pkg,
          });
          return;
        }

        if (status === 'failed') {
          navigation.replace('CoinPaymentFailed', {
            message: response.data.message,
            package: pkg,
          });
          return;
        }

        if (attempts < maxAttempts) {
          timeoutRef.current = setTimeout(poll, 5000);
        } else {
          navigation.navigate('CoinPaymentFailed', {
            message: 'Payment timed out. If money was deducted, please contact support.',
            package: pkg,
          });
        }
      } catch (error) {
        if (attempts < maxAttempts) {
          timeoutRef.current = setTimeout(poll, 5000);
        } else {
          navigation.navigate('CoinPaymentFailed', {
            message: 'Payment timed out. If money was deducted, please contact support.',
            package: pkg,
          });
        }
      }
    };

    poll();
  };

  const handlePhoneChange = (text) => {
    setFormData({ ...formData, phone: text });
    setPhoneError(null);

    const cleaned = text.replace(/[\s\-]/g, '').replace(/^\+?237/, '');
    if (cleaned.length >= 3) {
      const detected = getNetworkFromPhone(text);
      setNetworkDetected(detected);
      if (detected && detected !== 'UNKNOWN') {
        setSelectedMethod(detected);
      }
    } else {
      setNetworkDetected(null);
    }
  };

  const handleMethodChange = (newMethod) => {
    setSelectedMethod(newMethod);
    setPhoneError(null);

    const cleaned = formData.phone.replace(/[\s\-]/g, '').replace(/^\+?237/, '');
    if (cleaned.length >= 9) {
      const validation = validatePhoneForProvider(formData.phone, newMethod);
      if (!validation.valid) {
        setFormData({ ...formData, phone: '' });
        setNetworkDetected(null);
        setPhoneError(t(validation.error));
      }
    }
  };

  const handleSubmitPayment = async () => {
    // Validate form
    if (!formData.phone.trim()) {
      Alert.alert(t('common.error'), t('payments.phoneRequiredShort'));
      return;
    }

    // Validate phone matches selected provider
    const validation = validatePhoneForProvider(formData.phone, selectedMethod);
    if (!validation.valid) {
      setPhoneError(t(validation.error));
      return;
    }
    try {
      setLoading(true);
      const amount = getNumericAmount(pkg.amount || pkg.price);

      const response = await api.post('/payments/topup', {
        amount,
        phone: formData.phone,
        coins: totalCoins,
      });

      setPaymentStatus('PROCESSING');
      setPaymentId(response.data.reference || paymentId);
      if (response.data.reference) {
        pollPaymentStatus(response.data.reference);
      } else {
        navigation.replace('CoinPaymentFailed', {
          message: 'Payment reference was not returned. Please try again.',
          package: pkg,
        });
      }
    } catch (error) {
      console.log('Payment submission error:', error);
      navigation.replace('CoinPaymentFailed', {
        message: error.response?.data?.message || t('payments.submitPaymentFailed'),
        package: pkg,
      });
    } finally {
      setLoading(false);
    }
  };

  if (paymentStatus === 'PROCESSING') {
    return (
      <View style={[styles.background, { backgroundColor: colors.background }]}>
        
        <SafeAreaView style={styles.container}>
          <View style={styles.pendingContent}>
            <View style={[styles.pendingIcon, { backgroundColor: colors.accentSoft }]}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
            <Text style={[styles.pendingTitle, { color: colors.text }]}>
              {t('payments.waitingApproval', 'Waiting for your approval...')}
            </Text>
            <Text style={[styles.pendingSubtitle, { color: colors.textSecondary }]}>
              {t('payments.checkPhonePrompt', 'Check your phone for the payment prompt.')}
            </Text>
            <Text style={[styles.pendingHint, { color: colors.textSecondary }]}>
              {t('payments.enterPinToComplete', 'Enter your Mobile Money PIN to complete the payment.')}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('payments.formTitle')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Package Info Card */}
          <View style={[styles.packageCard, { borderBottomColor: colors.border }]}>
            <View style={styles.packageHeader}>
              <View>
                <Text style={[styles.packageCoins, { color: colors.text }]}>{pkg.coins} {t('payments.coins')}</Text>
                <Text style={[styles.packageLabel, { color: colors.textSecondary }]}>{pkg.label}</Text>
              </View>
              <View style={[styles.priceBadge, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.priceText, { color: colors.accent }]}>{pkg.price}</Text>
              </View>
            </View>
            {pkg.bonus > 0 && (
              <View style={styles.bonusSection}>
                <MaterialCommunityIcons name="gift" size={20} color="#10B981" />
                <Text style={styles.bonusText}>{t('payments.freeBonus', { count: pkg.bonus })}</Text>
              </View>
            )}
          </View>

          {/* Payment ID removed from user-facing UI — kept in console for debugging */}

          {/* User Info Section */}
          <View style={[styles.sectionCard, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('payments.yourInformation')}</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t('payments.phoneNumber')}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="+237 6XXXXXXXX"
                placeholderTextColor={colors.placeholder}
                value={formData.phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
              />
              {/* Network detection badge */}
              {formData.phone.replace(/[\s\-]/g, '').replace(/^\+?237/, '').length >= 3 && networkDetected && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <View style={{
                    backgroundColor: networkDetected === 'MTN' ? '#FFCC00' : networkDetected === 'ORANGE' ? '#F16E00' : '#94A3B8',
                    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 6
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: networkDetected === 'MTN' ? '#000' : '#fff' }}>
                      {networkDetected === 'UNKNOWN' ? '?' : networkDetected}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {networkDetected === 'MTN' ? 'MTN Mobile Money detected'
                      : networkDetected === 'ORANGE' ? 'Orange Money detected'
                      : 'Network not recognized'}
                  </Text>
                </View>
              )}
              {/* Phone validation error */}
              {phoneError && (
                <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, fontWeight: '600' }}>
                  {phoneError}
                </Text>
              )}
            </View>
          </View>

          {/* Payment Method */}
          <View style={[styles.sectionCard, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('payments.paymentMethod')}</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map((method) => {
                const active = selectedMethod === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    onPress={() => handleMethodChange(method.id)}
                    style={[
                      styles.methodCard,
                      {
                        borderColor: active ? colors.accent : colors.border,
                        backgroundColor: active ? colors.accentSoft : colors.card,
                      }
                    ]}
                  >
                    <View style={[styles.methodLogo, { backgroundColor: method.color }]}>
                      <MaterialCommunityIcons name={method.icon} size={20} color={method.textColor} />
                    </View>
                    <Text style={[styles.methodText, { color: colors.text }]}>{method.label}</Text>
                    {active ? <MaterialCommunityIcons name="check-circle" size={18} color={colors.accent} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Payment Instructions */}
          <View style={[styles.sectionCard, { borderBottomColor: colors.border }]}>
            <View style={styles.instructionHeader}>
              <MaterialCommunityIcons name="information" size={24} color={colors.accent} />
              <Text style={[styles.instructionTitle, { color: colors.accent }]}>{t('payments.howPaymentWorks')}</Text>
            </View>
            <Text style={[styles.instructionText, { color: colors.accent }]}>
              {t('payments.paymentInstructions', { price: pkg.price })}
            </Text>
            {paymentStatus !== 'IDLE' && (
              <View style={[styles.statusBox, { backgroundColor: colors.accentSoft }]}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={[styles.statusText, { color: colors.accent }]}>
                  {paymentStatus === 'PROCESSING' ? t('payments.waiting') : paymentStatus}
                </Text>
              </View>
            )}
          </View>

          {/* Coin Calculation */}
          <View style={[styles.sectionCard, { borderBottomColor: colors.border }]}>
            <View style={styles.calculationRow}>
              <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>{t('payments.baseCoins')}</Text>
              <Text style={[styles.calcValue, { color: colors.text }]}>{pkg.coins} {t('payments.coins')}</Text>
            </View>
            {pkg.bonus > 0 && (
              <View style={styles.calculationRow}>
                <Text style={[styles.calcLabel, { color: '#10B981' }]}>{t('payments.bonusCoins')}</Text>
                <Text style={[styles.calcValue, { color: '#10B981' }]}>+{pkg.bonus} {t('payments.coins')}</Text>
              </View>
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.calculationRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>{t('payments.totalCoins')}</Text>
              <Text style={[styles.totalValue, { color: colors.accent }]}>{totalCoins} {t('payments.coins')}</Text>
            </View>
          </View>

          <View style={{ height: 16 }} />

          {/* Submit Button — inside scroll flow so it's always accessible */}
          <TouchableOpacity
            onPress={handleSubmitPayment}
            disabled={loading}
            style={[
              styles.submitBtn,
              { backgroundColor: colors.accent, opacity: loading ? 0.6 : 1 }
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" />
                <Text style={styles.submitText}>{t('payments.payWith', { price: pkg.price, method: selectedMethod === 'MTN' ? 'MTN MoMo' : 'Orange Money' })}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24
  },
  packageCard: {
    borderBottomWidth: 1,
    padding: 18,
    marginBottom: 20
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  packageCoins: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4
  },
  packageLabel: {
    fontSize: 13,
    fontWeight: '600'
  },
  priceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800'
  },
  bonusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8
  },
  bonusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981'
  },
  sectionCard: {
    borderBottomWidth: 1,
    padding: 18,
    marginBottom: 16
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12
  },
  paymentIdBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1
  },
  paymentId: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace'
  },
  formGroup: {
    marginBottom: 14
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500'
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: '500'
  },
  phoneNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderBottomWidth: 1
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  statusBox: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800'
  },
  methodRow: {
    gap: 12,
  },
  methodCard: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodLogo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadContent: {
    alignItems: 'center'
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4
  },
  uploadSubtitle: {
    fontSize: 12,
    fontWeight: '500'
  },
  receiptPreview: {
    position: 'relative',
    alignItems: 'center'
  },
  receiptImage: {
    width: 200,
    height: 150,
    borderRadius: 8
  },
  removeBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10
  },
  calcLabel: {
    fontSize: 13,
    fontWeight: '600'
  },
  calcValue: {
    fontSize: 14,
    fontWeight: '700'
  },
  divider: {
    height: 1,
    marginVertical: 8
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800'
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900'
  },
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 0
  },
  submitText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800'
  },
  pendingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24
  },
  pendingIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  pendingTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12
  },
  pendingSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8
  },
  pendingHint: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic'
  },
  pendingReferenceBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  }
});

export default CoinPaymentFormScreen;
