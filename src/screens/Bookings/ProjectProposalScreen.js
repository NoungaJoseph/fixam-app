import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import TealSafeAreaView from '../../components/Common/TealSafeAreaView';
import UserAvatar from '../../components/UserAvatar';
import api, { getMediaUrl } from '../../services/api';
import { getCurrencyForUser } from '../../constants/countries';
import VerificationRequiredModal from '../../components/VerificationRequiredModal';
import { isIdentityVerified, getVerificationMessageKey, translateApiError } from '../../utils/eligibilityMessages';
import MaterialsListEditor from '../../components/MaterialsListEditor';

const ProjectProposalScreen = ({ route, navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const { project = {}, provider = {} } = route.params || {};
  const providerUserId = provider?.user?.id || provider?.userId || provider?.id;

  const [proposalType, setProposalType] = useState('EXACT'); // EXACT or SIMILAR
  const [budgetType, setBudgetType] = useState('FIXED_BUDGET');
  const [paymentPreference, setPaymentPreference] = useState('AGREE_WITH_PROVIDER');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(String(project.price || provider.rate || 50));
  const [days, setDays] = useState('5');
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [materialsList, setMaterialsList] = useState([]);
  const [requiresDiagnosis, setRequiresDiagnosis] = useState(false);

  const currencyStr = getCurrencyForUser(provider.user?.country || user?.country || 'Cameroon');

  const handleSubmit = async () => {
    if (user?.isBlocked) {
      Alert.alert(t('common.error'), t('eligibility.accountBlocked'));
      return;
    }
    // Client accounts can request a project without provider verification.
    // Provider accounts retain the verification requirement enforced by the API.
    if (user?.role === 'PROVIDER' && !isIdentityVerified(user)) {
      setVerificationMessage(t(getVerificationMessageKey(user, 'booking')));
      setShowVerificationModal(true);
      return;
    }
    if (!description.trim()) {
      Alert.alert(t('common.error'), t('project.proposalDescRequired', 'Please describe your proposal or requirements'));
      return;
    }
    if (!providerUserId) {
      Alert.alert(t('common.error'), t('profile.providerUnavailable'));
      return;
    }

    setLoading(true);
    try {
      // 1. Create free proposal booking (0 coins for client)
      const cleanedMaterialsList = (Array.isArray(materialsList) ? materialsList : [])
        .filter(item => item && typeof item.name === 'string' && item.name.trim().length > 0)
        .map(item => ({
          id: item.id || undefined,
          name: item.name.trim(),
          suppliedBy: 'PROVIDER'
        }));

      await api.post('/bookings', {
        providerId: providerUserId,
        isProposal: true,
        budget: budgetType === 'REQUEST_QUOTE' ? 0 : Number(budget),
        bookingDate: new Date().toISOString(),
        bookingTime: '09:00',
        bookingDuration: 'DAY',
        notes: `PROJECT PROPOSAL: ${project.title || 'Custom Service'}\nRequirements: ${description.trim()}`,
        location: `Project: ${project.title || 'Custom Service'} (${project.selectedTier?.name || 'Package'})`,
        materialsList: cleanedMaterialsList,
        requiresDiagnosis,
        budgetType,
        paymentPreference,
      });

      // 2. Fetch or create conversation
      Alert.alert(
        t('common.success'),
        t('project.proposalSentSuccess', 'Your proposal has been sent to the provider!'),
        [
          {
            text: t('common.ok', 'OK'),
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert(t('common.error'), translateApiError(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <TealSafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#1F2937' : '#E2E8F0' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('project.sendProposal', 'Send Proposal')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={60}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Project & Provider Banner */}
        <View style={[styles.projectBanner, { borderColor: colors.border }]}>
          <Text style={[styles.bannerTitle, { color: colors.text }]} numberOfLines={2}>
            {project.title || 'Project Proposal'}
          </Text>
          <View style={styles.providerRow}>
            <UserAvatar uri={getMediaUrl(provider.user?.avatar)} name={provider.user?.fullName} size={30} radius={15} />
            <Text style={[styles.providerName, { color: colors.textSecondary }]}>
              {provider.user?.fullName || 'Provider'}
            </Text>
          </View>
        </View>

        <Text style={[styles.directPaymentNote, { color: colors.textSecondary, borderTopColor: colors.border }]}>
          {t('booking.bookings.directPaymentNotice', 'Fixam does not collect or hold service payments. You agree and pay directly.')}
        </Text>

        {/* Proposal Intent Radio Group */}
        <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>{t('project.proposalTypeLabel', 'Select Proposal Type')}</Text>
        <TouchableOpacity
          style={[
            styles.radioOption,
            {
              backgroundColor: colors.background,
              borderColor: proposalType === 'EXACT' ? colors.accent : colors.border
            }
          ]}
          onPress={() => setProposalType('EXACT')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={proposalType === 'EXACT' ? 'radiobox-marked' : 'radiobox-blank'}
            size={22}
            color={proposalType === 'EXACT' ? colors.accent : colors.placeholder}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.radioTitle, { color: colors.text }]}>{t('project.buyExactProject', 'Buy / Request this exact project')}</Text>
            <Text style={[styles.radioSub, { color: colors.textSecondary }]}>{t('project.buyExactSub', 'Proceed with the features and deliverables described in this project')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.radioOption,
            {
              backgroundColor: colors.background,
              borderColor: proposalType === 'SIMILAR' ? colors.accent : colors.border
            }
          ]}
          onPress={() => setProposalType('SIMILAR')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={proposalType === 'SIMILAR' ? 'radiobox-marked' : 'radiobox-blank'}
            size={22}
            color={proposalType === 'SIMILAR' ? colors.accent : colors.placeholder}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.radioTitle, { color: colors.text }]}>{t('project.requestSimilarService', 'Request a custom service similar to this project')}</Text>
            <Text style={[styles.radioSub, { color: colors.textSecondary }]}>{t('project.requestSimilarSub', 'Ask provider to adapt or customize work for your specific needs')}</Text>
          </View>
        </TouchableOpacity>

        {/* Proposal Description */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('project.requirementsLabel', 'Proposal Description / Requirements')} *</Text>
          <TextInput
            style={[styles.input, styles.multiInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder={t('project.requirementsPlaceholder', 'Describe your project requirements, scope, and specific instructions...')}
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <MaterialsListEditor
          items={materialsList}
          onChangeItems={setMaterialsList}
          requiresDiagnosis={requiresDiagnosis}
          onToggleDiagnosis={setRequiresDiagnosis}
        />

        {/* Budget, payment and timeline */}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('booking.bookings.budget', 'Budget')}</Text>
        <View style={styles.intentRow}>
          {[['FIXED_BUDGET', t('booking.bookings.myBudget', 'My budget')], ['REQUEST_QUOTE', t('booking.bookings.requestQuote', 'Request a quote')]].map(([value, label]) => (
            <TouchableOpacity key={value} onPress={() => setBudgetType(value)} style={[styles.intentChip, { borderColor: budgetType === value ? colors.accent : colors.border, backgroundColor: budgetType === value ? `${colors.accent}14` : colors.background }]}><Text style={{ color: budgetType === value ? colors.accent : colors.text, fontWeight: '800' }}>{label}</Text></TouchableOpacity>
          ))}
        </View>
        <View style={styles.rowTwo}>
          {budgetType === 'FIXED_BUDGET' ? <View style={{ flex: 1 }}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('project.offeredBudget', 'Offered Budget')} ({currencyStr})</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="50"
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
            />
          </View> : <View style={{ flex: 1 }}><Text style={[styles.quoteHint, { color: colors.textSecondary }]}>{t('booking.bookings.requestQuote', 'Request a quote')}</Text><Text style={[styles.quoteSub, { color: colors.textSecondary }]}>{t('project.quoteRequestHint', 'The provider will send clear terms for your review.')}</Text></View>}
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('project.timelineDays', 'Expected Days')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="5"
              keyboardType="numeric"
              value={days}
              onChangeText={setDays}
            />
          </View>
        </View>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('booking.bookings.paymentPreference', 'Payment preference')}</Text>
        <View style={styles.intentRow}>
          {[
            ['CASH', t('booking.bookings.cash', 'Cash')], ['MOBILE_MONEY', t('booking.bookings.mobileMoney', 'Mobile Money')], ['AGREE_WITH_PROVIDER', t('booking.bookings.agreeWithProvider', 'Agree with provider')],
          ].map(([value, label]) => <TouchableOpacity key={value} onPress={() => setPaymentPreference(value)} style={[styles.intentChip, { borderColor: paymentPreference === value ? colors.accent : colors.border, backgroundColor: paymentPreference === value ? `${colors.accent}14` : colors.background }]}><Text style={{ color: paymentPreference === value ? colors.accent : colors.text, fontWeight: '800', fontSize: 12 }}>{label}</Text></TouchableOpacity>)}
        </View>

        {/* Submit Proposal Button */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.accent }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>{t('project.submitProposal', 'Submit Proposal')}</Text>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <VerificationRequiredModal
        visible={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        message={verificationMessage || t('verification.bookingRequired')}
        isProvider={false}
      />
    </TealSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.2 },

  projectBanner: { borderBottomWidth: 1, paddingBottom: 18, marginBottom: 22 },
  directPaymentNote: { borderTopWidth: 1, paddingTop: 14, marginBottom: 8, fontSize: 13, lineHeight: 20 },
  bannerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.25, marginBottom: 8 },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  providerName: { fontSize: 13, fontWeight: '700' },

  fieldGroup: { marginTop: 20, marginBottom: 4, paddingBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DCE4EE' },
  fieldLabel: { fontSize: 15, fontWeight: '900', marginBottom: 8 },
  input: {
    height: 48,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    paddingHorizontal: 0,
    fontSize: 14,
    fontWeight: '600',
  },
  multiInput: {
    height: 110,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  radioTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  radioSub: { fontSize: 11, lineHeight: 16, fontWeight: '500' },
  rowTwo: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  intentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  intentChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  quoteHint: { fontSize: 15, fontWeight: '900', paddingTop: 2 },
  quoteSub: { fontSize: 12, lineHeight: 18, marginTop: 5 },

  submitBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});

export default ProjectProposalScreen;
