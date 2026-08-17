import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export default function DisputeDetailsCard({ dispute, isClient, isProvider, onRefresh }) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  if (!dispute) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
      case 'AWAITING_PROVIDER_RESPONSE':
      case 'AWAITING_CLIENT_RESPONSE':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'CORRECTION_REQUESTED':
      case 'CORRECTION_COMPLETED':
        return { bg: '#E0E7FF', text: '#4338CA' };
      case 'UNDER_REVIEW':
      case 'AWAITING_MORE_EVIDENCE':
        return { bg: '#FEE2E2', text: '#DC2626' };
      case 'RESOLVED':
        return { bg: '#D1FAE5', text: '#059669' };
      default:
        return { bg: '#F3F4F6', text: '#4B5563' };
    }
  };

  const statusStyle = getStatusColor(dispute.status);

  const handleSendResponse = async () => {
    if (!responseText.trim()) {
      Alert.alert('Error', t('bookings.enterResponsePlaceholder', 'Type your response...'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post(`/disputes/${dispute.id}/respond`, { response: responseText.trim() });
      if (res.data?.success) {
        Alert.alert('Success', 'Response submitted successfully.');
        setResponseText('');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to send response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteCorrection = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post(`/disputes/${dispute.id}/complete-correction`);
      if (res.data?.success) {
        Alert.alert('Success', t('bookings.status_CORRECTION_COMPLETED', 'Correction Completed'));
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to complete correction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientEvidence = Array.isArray(dispute.clientEvidence) ? dispute.clientEvidence : [];
  const providerEvidence = Array.isArray(dispute.providerEvidence) ? dispute.providerEvidence : [];
  const events = Array.isArray(dispute.events) ? dispute.events : [];

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
      {/* Header Badge */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="shield-alert-outline" size={20} color="#DC2626" style={{ marginRight: 6 }} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t('bookings.disputeStatus', 'Dispute Status')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {t(`bookings.status_${dispute.status}`, dispute.status)}
          </Text>
        </View>
      </View>

      <Text style={[styles.disputeId, { color: colors.textSecondary }]}>
        {t('bookings.disputeId', 'Dispute ID')}: DSP-{dispute.id.substring(0, 8).toUpperCase()}
      </Text>

      {/* Complaint Category & Description */}
      <View style={[styles.section, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {t('bookings.selectCategory', 'Category')}: {t(`bookings.cat_${dispute.category}`, dispute.category)}
        </Text>
        <Text style={[styles.descriptionText, { color: colors.text }]}>
          {dispute.description}
        </Text>
      </View>

      {/* Client Evidence Gallery */}
      {clientEvidence.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
            {t('bookings.attachEvidence', 'Client Evidence')} ({clientEvidence.length}):
          </Text>
          <View style={styles.evidenceGallery}>
            {clientEvidence.map((item, idx) => (
              <View key={item.id || idx} style={[styles.evidenceThumb, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                {item.url && item.url.startsWith('http') ? (
                  <Image source={{ uri: item.url }} style={styles.thumbImage} />
                ) : (
                  <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.text} />
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Provider Response */}
      {Boolean(dispute.providerResponse) && (
        <View style={[styles.responseBox, { backgroundColor: isDark ? '#0F2942' : '#F0F9FF', borderColor: '#38BDF8' }]}>
          <Text style={[styles.responseTitle, { color: '#0284C7' }]}>
            {t('bookings.providerResponse', 'Provider Response')}:
          </Text>
          <Text style={[styles.responseText, { color: colors.text }]}>
            {dispute.providerResponse}
          </Text>
        </View>
      )}

      {/* Client Response */}
      {Boolean(dispute.clientResponse) && (
        <View style={[styles.responseBox, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF', borderColor: '#818CF8' }]}>
          <Text style={[styles.responseTitle, { color: '#4F46E5' }]}>
            {t('bookings.clientResponse', 'Client Response')}:
          </Text>
          <Text style={[styles.responseText, { color: colors.text }]}>
            {dispute.clientResponse}
          </Text>
        </View>
      )}

      {/* Resolution Outcome (if resolved) */}
      {Boolean(dispute.resolution) && (
        <View style={[styles.resolutionCard, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: '#10B981' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <MaterialCommunityIcons name="check-decagram" size={18} color="#059669" style={{ marginRight: 6 }} />
            <Text style={[styles.resolutionTitle, { color: '#047857' }]}>
              {t('bookings.resolution', 'Resolution Outcome')}: {dispute.resolution}
            </Text>
          </View>
          <Text style={[styles.resolutionReason, { color: isDark ? '#D1FAE5' : '#065F46' }]}>
            {dispute.resolutionReason}
          </Text>
        </View>
      )}

      {/* Response Action Form */}
      {dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED' && (
        <View style={{ marginTop: 12 }}>
          {((isProvider && dispute.status === 'AWAITING_PROVIDER_RESPONSE') ||
            (isClient && dispute.status === 'AWAITING_CLIENT_RESPONSE')) && (
            <View style={styles.replyCard}>
              <TextInput
                style={[
                  styles.replyInput,
                  { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', color: colors.text, borderColor: isDark ? '#475569' : '#CBD5E1' }
                ]}
                placeholder={t('bookings.enterResponsePlaceholder', 'Type your response...')}
                placeholderTextColor={colors.textSecondary}
                value={responseText}
                onChangeText={setResponseText}
                multiline
              />
              <TouchableOpacity
                style={[styles.replyBtn, { opacity: isSubmitting ? 0.7 : 1 }]}
                onPress={handleSendResponse}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.replyBtnText}>{t('bookings.sendResponse', 'Send Response')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Provider Mark Correction Complete Action */}
          {isProvider && dispute.status === 'CORRECTION_REQUESTED' && (
            <TouchableOpacity
              style={[styles.correctionBtn, { opacity: isSubmitting ? 0.7 : 1 }]}
              onPress={handleCompleteCorrection}
              disabled={isSubmitting}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.correctionBtnText}>
                {t('bookings.markCorrectionDone', 'Mark Correction Completed')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Event Timeline Toggle */}
      {events.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <TouchableOpacity onPress={() => setShowEvents(!showEvents)} style={styles.timelineToggle}>
            <Text style={[styles.timelineToggleText, { color: '#0D9488' }]}>
              {t('bookings.eventTimeline', 'Dispute Timeline')} ({events.length})
            </Text>
            <MaterialCommunityIcons
              name={showEvents ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#0D9488"
            />
          </TouchableOpacity>

          {showEvents && (
            <View style={[styles.timelineContainer, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
              {events.map((evt) => (
                <View key={evt.id} style={styles.timelineItem}>
                  <MaterialCommunityIcons name="circle-small" size={16} color="#0D9488" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.timelineDesc, { color: colors.text }]}>{evt.description}</Text>
                    <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>
                      {new Date(evt.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  disputeId: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },
  section: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  evidenceGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  evidenceThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: 44,
    height: 44,
  },
  responseBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  responseTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  responseText: {
    fontSize: 12,
  },
  resolutionCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  resolutionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  resolutionReason: {
    fontSize: 12,
  },
  replyCard: {
    marginTop: 6,
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  replyBtn: {
    backgroundColor: '#0D9488',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  replyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  correctionBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  correctionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  timelineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  timelineToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timelineContainer: {
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  timelineDesc: {
    fontSize: 11,
    fontWeight: '500',
  },
  timelineTime: {
    fontSize: 10,
  },
});
