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

const ProjectProposalScreen = ({ route, navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const { project = {}, provider = {} } = route.params || {};
  const providerUserId = provider?.user?.id || provider?.userId || provider?.id;

  const [proposalType, setProposalType] = useState('EXACT'); // EXACT or SIMILAR
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(String(project.price || provider.rate || 50));
  const [days, setDays] = useState('5');
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const currencyStr = getCurrencyForUser(provider.user?.country || user?.country || 'Cameroon');

  const handleSubmit = async () => {
    if (user?.isBlocked) {
      Alert.alert(t('common.error'), t('eligibility.accountBlocked'));
      return;
    }
    if (!isIdentityVerified(user)) {
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
      await api.post('/bookings', {
        providerId: providerUserId,
        isProposal: true,
        budget: Number(budget || project.price || 0),
        bookingDate: new Date().toISOString(),
        bookingTime: '09:00',
        bookingDuration: `${days || 3} DAYS`,
        notes: `PROJECT PROPOSAL: ${project.title || 'Custom Service'}\nRequirements: ${description.trim()}`,
        location: `Project: ${project.title || 'Custom Service'} (${project.selectedTier?.name || 'Package'})`
      });

      // 2. Fetch or create conversation
      const convRes = await api.post('/chat/conversations', { participantId: providerUserId });
      const conversation = convRes.data.data;

      // 3. Send proposal message into conversation
      const proposalText = `📋 *PROPOSAL FOR PROJECT*: ${project.title || 'Custom Service'}\nType: ${proposalType === 'EXACT' ? 'Buy Exact Project' : 'Similar Custom Service'}\nPackage: ${project.selectedTier?.name || 'STANDARD'}\nOffered Price: ${currencyStr} ${budget}\nTimeline: ${days} Days\n\nRequirements:\n${description.trim()}`;
      await api.post(`/chat/conversations/${conversation.id}/messages`, { content: proposalText, type: 'TEXT' });

      Alert.alert(
        t('common.success'),
        t('project.proposalSentSuccess', 'Your proposal has been sent to the provider!'),
        [
          {
            text: t('common.openChat', 'Open Chat'),
            onPress: () => {
              navigation.replace('Chat', {
                conversationId: conversation.id,
                receiverId: providerUserId,
                userName: provider.user?.fullName || 'Provider',
                avatar: getMediaUrl(provider.user?.avatar),
                otherParticipant: conversation.participants?.[0] || { id: providerUserId, role: 'PROVIDER' },
              });
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
        <View style={[styles.projectBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

        {/* Proposal Intent Radio Group */}
        <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>{t('project.proposalTypeLabel', 'Select Proposal Type')}</Text>
        <TouchableOpacity
          style={[
            styles.radioOption,
            {
              backgroundColor: colors.card,
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
              backgroundColor: colors.card,
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
            style={[styles.input, styles.multiInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder={t('project.requirementsPlaceholder', 'Describe your project requirements, scope, and specific instructions...')}
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Offered Price & Timeline */}
        <View style={styles.rowTwo}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('project.offeredBudget', 'Offered Budget')} ({currencyStr})</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="50"
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('project.timelineDays', 'Expected Days')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="5"
              keyboardType="numeric"
              value={days}
              onChangeText={setDays}
            />
          </View>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },

  projectBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 16, fontWeight: '900', marginBottom: 8 },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  providerName: { fontSize: 13, fontWeight: '700' },

  fieldGroup: { marginTop: 16, marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
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
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  radioTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  radioSub: { fontSize: 11, lineHeight: 16, fontWeight: '500' },
  rowTwo: { flexDirection: 'row', gap: 12, marginBottom: 20 },

  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});

export default ProjectProposalScreen;
