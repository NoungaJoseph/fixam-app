import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import ServiceAgreementModal from './ServiceAgreementModal';
import { exportAgreementPdf } from '../utils/exportAgreementPdf';

export default function ServiceAgreementCard({ agreement, booking, isClient, isProvider, onRefresh }) {
  const { colors, isDark } = useTheme();
  const { t, locale } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const targetAgreement = agreement || booking?.serviceAgreement || (booking?.serviceAgreements && booking.serviceAgreements[0]) || (booking?.agreements && booking.agreements[0]);
  const bookingId = booking?.id || targetAgreement?.bookingId;

  if (!targetAgreement && !bookingId) return null;

  const terms = targetAgreement?.terms || {
    title: booking?.service || booking?.title || 'Service Contract',
    price: booking?.budget || 0,
    currency: 'XAF',
    client: { name: booking?.client?.fullName || 'Client' },
    provider: { name: booking?.provider?.fullName || booking?.providerDetails?.fullName || 'Provider' }
  };

  const clientName = terms.client?.name || terms.client?.fullName || booking?.client?.fullName || 'Client';
  const providerName = terms.provider?.name || terms.provider?.fullName || booking?.provider?.fullName || 'Provider';

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      await exportAgreementPdf({
        agreement: targetAgreement,
        booking,
        locale: locale || 'en'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#CBD5E1' }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {t('bookings.serviceAgreement', 'Fixam Service Agreement')}
        </Text>

        <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }]}>
          <Text style={[styles.statusText, { color: '#059669' }]}>
            ACTIVE
          </Text>
        </View>
      </View>

      <Text style={[styles.agreementNumber, { color: colors.textSecondary }]}>
        {targetAgreement?.publicAgreementNumber || `FSA-CONTRACT-${(bookingId || '').substring(0, 8).toUpperCase()}`}
      </Text>

      {/* Summary Box */}
      <View style={[styles.summaryBox, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Service:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{terms.title || 'Professional Service'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Agreed Amount:</Text>
          <Text style={[styles.infoValue, { color: '#0D9488', fontWeight: '700' }]}>
            {Number(terms.price || 0).toLocaleString()} {terms.currency || 'XAF'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Parties:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
            {clientName} & {providerName}
          </Text>
        </View>
      </View>

      {/* Download Action Button */}
      <View style={styles.actionColumn}>
        <TouchableOpacity
          style={[styles.primaryActionBtn, { backgroundColor: '#0D9488' }]}
          onPress={handleDownloadPdf}
          disabled={isExporting}
          activeOpacity={0.8}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
          ) : (
            <MaterialCommunityIcons name="file-pdf-box" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.primaryActionBtnText}>
            {isExporting ? t('common.loading', 'Generating PDF...') : t('bookings.downloadPdf', 'Download Contract (PDF)')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 10,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  agreementNumber: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  summaryBox: {
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: '65%',
  },
  actionColumn: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 12,
    width: '100%',
  },
  primaryActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    elevation: 1,
  },
  primaryActionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  secondaryActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
