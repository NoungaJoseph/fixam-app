import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert, Share } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import ServiceAgreementModal from './ServiceAgreementModal';

export default function ServiceAgreementCard({ agreement, isClient, isProvider, onRefresh }) {
  const { colors, isDark } = useTheme();
  const { t, locale } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  if (!agreement) return null;

  const terms = agreement.terms || {};
  const clientName = terms.client?.name || 'Client';
  const providerName = terms.provider?.name || 'Provider';

  const handleDownloadOrSharePdf = async () => {
    const pdfUrl = `https://api.usefixam.com/api/agreements/${agreement.id}/pdf?lang=${locale || 'en'}`;
    try {
      await Share.share({
        url: pdfUrl,
        title: `${agreement.publicAgreementNumber} PDF`,
        message: `Fixam Service Agreement: ${pdfUrl}`
      });
    } catch (_) {
      Linking.openURL(pdfUrl).catch(() => {
        Alert.alert('Error', 'Unable to open PDF contract link.');
      });
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#CBD5E1' }]}>
      {/* Header (NO ICONS) */}
      <View style={styles.headerRow}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {t('bookings.serviceAgreement', 'Fixam Service Agreement')}
        </Text>

        <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.statusText, { color: '#059669' }]}>
            {t('bookings.agreementActive', 'ACTIVE')}
          </Text>
        </View>
      </View>

      <Text style={[styles.agreementNumber, { color: colors.textSecondary }]}>
        {agreement.publicAgreementNumber} (v{agreement.version})
      </Text>

      {/* Summary Box */}
      <View style={[styles.summaryBox, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Service:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{terms.title || 'Service'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Agreed Amount:</Text>
          <Text style={[styles.infoValue, { color: '#0D9488', fontWeight: '700' }]}>
            {terms.price ? terms.price.toLocaleString() : '0'} {terms.currency || 'XAF'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Parties:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
            {clientName} & {providerName}
          </Text>
        </View>
      </View>

      {/* Action Buttons (NO ICONS) */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#0D9488' }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.actionBtnText}>{t('bookings.viewAgreement', 'View Agreement')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}
          onPress={handleDownloadOrSharePdf}
        >
          <Text style={[styles.actionBtnText, { color: colors.text }]}>{t('bookings.downloadPdf', 'Download PDF')}</Text>
        </TouchableOpacity>
      </View>

      {/* Full Detail Modal */}
      <ServiceAgreementModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        agreement={agreement}
        isClient={isClient}
        isProvider={isProvider}
        onRefresh={onRefresh}
      />
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
    fontSize: 10,
    fontWeight: '700',
  },
  agreementNumber: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  summaryBox: {
    padding: 10,
    borderRadius: 8,
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
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
