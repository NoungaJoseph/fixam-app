import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Platform
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import TealSafeAreaView from '../../components/Common/TealSafeAreaView';
import api from '../../services/api';
import { getCurrencyForUser } from '../../constants/countries';
import { translateApiError } from '../../utils/eligibilityMessages';

const JobProposalScreen = ({ route, navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { walletBalance, markJobApplied } = useAppContext();

  const { task = {} } = route.params || {};
  const taskId = task.id || route.params?.taskId || route.params?.jobId;

  const defaultBudget = String(task.budgetMax || task.budget || task.budgetMin || '');
  const [proposedBudget, setProposedBudget] = useState(defaultBudget);
  const [coverLetter, setCoverLetter] = useState('');
  const [boostCoins, setBoostCoins] = useState('');
  const [attachments, setAttachments] = useState([]); // [{ url, name, type, size }]
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showUploadPicker, setShowUploadPicker] = useState(false);

  const currencyStr = getCurrencyForUser(task.country || user?.country || 'Cameroon');
  const boostAmount = Math.max(0, parseInt(boostCoins, 10) || 0);

  // Upload file helper
  const handleUploadFile = async (fileUri, fileName, mimeType) => {
    try {
      setUploadingMedia(true);
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
        name: fileName || `proposal_file_${Date.now()}`,
        type: mimeType || 'application/octet-stream',
      });

      const res = await api.post('/uploads/proposal', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = res.data?.url || res.data?.data?.url;
      if (uploadedUrl) {
        setAttachments(prev => [
          ...prev,
          {
            url: uploadedUrl,
            name: fileName || 'Attachment',
            type: mimeType || 'image/jpeg',
          }
        ]);
      }
    } catch (err) {
      console.error('Proposal file upload error:', err);
      Alert.alert(t('common.error'), t('jobs.uploadFailed', 'Failed to upload file. Please try again.'));
    } finally {
      setUploadingMedia(false);
      setShowUploadPicker(false);
    }
  };

  // Pick Image from Gallery
  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
        await handleUploadFile(asset.uri, fileName, asset.mimeType || 'image/jpeg');
      }
    } catch (err) {
      console.error('Image pick error:', err);
    }
  };

  // Pick PDF / Document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await handleUploadFile(asset.uri, asset.name, asset.mimeType || 'application/pdf');
      }
    } catch (err) {
      console.error('Document pick error:', err);
    }
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitProposal = async () => {
    if (user?.isBlocked) {
      Alert.alert(t('common.error'), t('eligibility.accountBlocked'));
      return;
    }

    if (boostAmount > 0 && (walletBalance || 0) < boostAmount) {
      Alert.alert(
        t('jobs.insufficientCoins'),
        t('jobs.insufficientBoostCoins', `You need ${boostAmount} coins in your wallet to boost this proposal.`)
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        boostCoins: boostAmount,
        coverLetter: coverLetter.trim() || undefined,
        proposedBudget: proposedBudget ? Number(proposedBudget) : undefined,
        proposalMedia: attachments.length > 0 ? attachments : undefined,
      };

      const res = await api.post(`/jobs/${taskId}/apply`, payload);

      if (taskId) {
        await markJobApplied?.(taskId);
      }

      const alertTitle = boostAmount > 0 ? t('jobs.boostedProposalSent', 'Boosted Proposal Sent! 🚀') : t('jobs.proposalSent', 'Proposal Sent Successfully! 🎉');
      const alertBody = boostAmount > 0
        ? t('jobs.boostedProposalSentBody', `Your proposal was submitted and boosted by ${boostAmount} coins.`)
        : t('jobs.proposalSentBody', 'Your proposal was submitted to the client for free.');

      Alert.alert(alertTitle, alertBody, [
        {
          text: t('common.done', 'Done'),
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      const message = translateApiError(error, t, 'jobs.couldNotApply');
      Alert.alert(t('jobs.couldNotApply'), message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TealSafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#1F2937' : '#E2E8F0' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {t('jobs.submitProposal', 'Submit Proposal')}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
            {task.title || 'Task Proposal'}
          </Text>
        </View>
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>FREE</Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={60}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 18, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Task Summary Banner */}
        <View style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={styles.taskMetaRow}>
            {task.category && (
              <View style={[styles.pill, { backgroundColor: colors.accent + '15' }]}>
                <Text style={[styles.pillText, { color: colors.accent }]}>{task.category}</Text>
              </View>
            )}
            <Text style={[styles.taskBudgetMeta, { color: colors.textSecondary }]}>
              {t('jobs.clientBudget', 'Client Budget')}: <Text style={{ fontWeight: '800', color: colors.text }}>{Number(task.budgetMax || task.budget || 0).toLocaleString()} {currencyStr}</Text>
            </Text>
          </View>
        </View>

        {/* 1. Proposed Budget */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t('jobs.yourProposedBudget', 'Your Proposed Price / Budget')} ({currencyStr})
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder={defaultBudget || "50000"}
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            value={proposedBudget}
            onChangeText={setProposedBudget}
          />
          <Text style={styles.fieldHint}>
            {t('jobs.proposedBudgetHint', 'Enter your total fee or estimate for this task.')}
          </Text>
        </View>

        {/* 2. Cover Letter / Pitch */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t('jobs.coverLetterLabel', 'Cover Letter / Proposal Note')}
          </Text>
          <TextInput
            style={[styles.input, styles.multiInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder={t('jobs.coverLetterPlaceholder', 'Explain why you are the best person for this task, your past experience, tools you will use, and availability...')}
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={5}
            value={coverLetter}
            onChangeText={setCoverLetter}
          />
          <Text style={styles.fieldHint}>
            {t('jobs.coverLetterHint', 'A well-written cover letter significantly increases your chance of selection.')}
          </Text>
        </View>

        {/* 3. Media / Document Upload */}
        <View style={styles.fieldGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 0 }]}>
              {t('jobs.attachMediaLabel', 'Attach Photo CV / PDF Resume / Samples')}
            </Text>
          </View>

          {/* Upload CTA Button */}
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: colors.accent, backgroundColor: colors.accent + '10' }]}
            onPress={() => setShowUploadPicker(true)}
            disabled={uploadingMedia}
          >
            {uploadingMedia ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <MaterialCommunityIcons name="cloud-upload-outline" size={22} color={colors.accent} />
            )}
            <Text style={[styles.uploadButtonText, { color: colors.accent }]}>
              {uploadingMedia ? t('jobs.uploading', 'Uploading...') : t('jobs.addAttachment', '+ Add Photo or PDF Document')}
            </Text>
          </TouchableOpacity>

          {/* Attachment list */}
          {attachments.length > 0 && (
            <View style={{ marginTop: 12, gap: 8 }}>
              {attachments.map((att, index) => {
                const isPdf = att.type?.includes('pdf') || att.name?.toLowerCase().endsWith('.pdf');
                return (
                  <View key={index} style={[styles.attachmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <MaterialCommunityIcons
                      name={isPdf ? 'file-pdf-box' : 'file-image'}
                      size={28}
                      color={isPdf ? '#EF4444' : '#0D9488'}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.attachmentName, { color: colors.text }]} numberOfLines={1}>
                        {att.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                        {isPdf ? 'PDF Document' : 'Photo / Image'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeAttachment(index)} style={styles.removeAttBtn}>
                      <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 4. Optional Proposal Boost */}
        <View style={[styles.boostBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <MaterialCommunityIcons name="rocket-launch" size={18} color="#F59E0B" />
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
              {t('jobs.boostProposalTitle', 'Boost Proposal (Optional)')}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 10 }}>
            {t('jobs.boostProposalSub', 'Add Fixam Coins to feature your proposal at the very top of client results. If not selected, boost coins are 100% refunded.')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TextInput
              style={[styles.boostInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              value={boostCoins}
              onChangeText={setBoostCoins}
            />
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>
              Coins (Wallet: {walletBalance || 0})
            </Text>
          </View>
        </View>

        {/* 5. Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.accent, opacity: submitting ? 0.7 : 1 }]}
          onPress={handleSubmitProposal}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="send" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>
                {boostAmount > 0 
                  ? t('jobs.submitBoostedProposal', `Submit Boosted Proposal (${boostAmount} Coins)`)
                  : t('jobs.submitFreeProposal', 'Submit Proposal (FREE)')}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {/* Upload Picker Modal */}
      <Modal visible={showUploadPicker} transparent animationType="fade" onRequestClose={() => setShowUploadPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowUploadPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('jobs.selectUploadSource', 'Upload Document / Media')}</Text>
            
            <TouchableOpacity style={[styles.uploadOptionRow, { borderColor: colors.border }]} onPress={pickPhoto}>
              <View style={[styles.uploadIconWrap, { backgroundColor: 'rgba(13, 148, 136, 0.12)' }]}>
                <MaterialCommunityIcons name="image" size={24} color="#0D9488" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.uploadOptionTitle, { color: colors.text }]}>{t('jobs.uploadPhoto', 'Photo / Image')}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('jobs.uploadPhotoSub', 'Select certificate, past work photo or ID photo')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.uploadOptionRow, { borderColor: colors.border }]} onPress={pickDocument}>
              <View style={[styles.uploadIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EF4444" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.uploadOptionTitle, { color: colors.text }]}>{t('jobs.uploadPdf', 'PDF Document / Resume')}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('jobs.uploadPdfSub', 'Attach your CV, proposal PDF, or quote document')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowUploadPicker(false)}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{t('common.cancel', 'Cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </TealSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  freeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  taskCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  taskTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 12, fontWeight: '700' },
  taskBudgetMeta: { fontSize: 12 },

  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  fieldHint: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  multiInput: {
    height: 120,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadButtonText: { fontSize: 14, fontWeight: '700' },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  attachmentName: { fontSize: 13, fontWeight: '700' },
  removeAttBtn: { padding: 4 },

  boostBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  boostInput: {
    width: 80,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
  },

  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
  },
  modalTitle: { fontSize: 16, fontWeight: '900', marginBottom: 16, textAlign: 'center' },
  uploadOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  uploadIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  uploadOptionTitle: { fontSize: 14, fontWeight: '800' },
  cancelModalBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
});

export default JobProposalScreen;
