import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

const CATEGORIES = [
  'WORK_INCOMPLETE',
  'POOR_QUALITY',
  'WRONG_SERVICE',
  'PROPERTY_DAMAGE',
  'MISSING_MATERIAL',
  'BREACH_OF_AGREEMENT',
  'PRICE_DISAGREEMENT',
  'NO_SHOW',
  'OTHER'
];

export default function DisputeModal({ visible, onClose, bookingId, onSuccess }) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [category, setCategory] = useState('WORK_INCOMPLETE');
  const [description, setDescription] = useState('');
  const [evidenceList, setEvidenceList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setEvidenceList((prev) => [
          ...prev,
          {
            id: String(Date.now() + Math.random()),
            url: asset.uri,
            type: asset.type === 'video' ? 'video' : 'image',
            name: asset.fileName || 'evidence_file'
          }
        ]);
      }
    } catch (err) {
      console.error('Pick Image Error:', err.message);
    }
  };

  const handleRemoveEvidence = (id) => {
    setEvidenceList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', t('bookings.problemDescPlaceholder', 'Please enter a description of the problem.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        bookingId,
        category,
        description: description.trim(),
        clientEvidence: evidenceList
      };

      const res = await api.post('/disputes', payload);
      if (res.data?.success) {
        Alert.alert('Submitted', t('bookings.disputeSubmittedSuccess', 'Problem report submitted to Fixam Support.'));
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to submit dispute.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to submit dispute.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="alert-decagram-outline" size={22} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t('bookings.reportProblemTitle', 'Report a Problem / Open Dispute')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {/* Category Select */}
            <Text style={[styles.label, { color: colors.text }]}>
              {t('bookings.selectCategory', 'Select Problem Category')}
            </Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((catKey) => {
                const isSelected = category === catKey;
                return (
                  <TouchableOpacity
                    key={catKey}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? '#EF4444' : (isDark ? '#0F172A' : '#F1F5F9'),
                        borderColor: isSelected ? '#DC2626' : (isDark ? '#334155' : '#CBD5E1')
                      }
                    ]}
                    onPress={() => setCategory(catKey)}
                  >
                    <Text style={[styles.categoryChipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                      {t(`bookings.cat_${catKey}`, catKey.replace('_', ' '))}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Description */}
            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>
              {t('bookings.problemDescription', 'Problem Description')} *
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  color: colors.text,
                  borderColor: isDark ? '#475569' : '#CBD5E1'
                }
              ]}
              multiline
              numberOfLines={4}
              placeholder={t('bookings.problemDescPlaceholder', 'Explain clearly what went wrong or what is missing...')}
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
            />

            {/* Evidence Picker */}
            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>
              {t('bookings.attachEvidence', 'Attach Photos / Evidence')}
            </Text>
            <TouchableOpacity
              style={[
                styles.addEvidenceBtn,
                { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: isDark ? '#334155' : '#CBD5E1' }
              ]}
              onPress={handlePickImage}
            >
              <MaterialCommunityIcons name="camera-plus-outline" size={18} color="#0D9488" style={{ marginRight: 6 }} />
              <Text style={[styles.addEvidenceText, { color: '#0D9488' }]}>
                {t('bookings.addEvidenceFile', 'Add Photo / Evidence File')}
              </Text>
            </TouchableOpacity>

            {/* Evidence Thumbnails */}
            {evidenceList.length > 0 && (
              <View style={styles.evidenceList}>
                {evidenceList.map((item) => (
                  <View key={item.id} style={[styles.evidenceBadge, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                    <MaterialCommunityIcons name="paperclip" size={14} color={colors.text} style={{ marginRight: 4 }} />
                    <Text numberOfLines={1} style={[styles.evidenceName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveEvidence(item.id)}>
                      <MaterialCommunityIcons name="close-circle" size={16} color="#EF4444" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="shield-alert-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>{t('bookings.submitDispute', 'Submit Dispute Report')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    borderRadius: 16,
    padding: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 90,
  },
  addEvidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addEvidenceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  evidenceList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  evidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  evidenceName: {
    fontSize: 11,
    maxWidth: 120,
  },
  submitBtn: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
