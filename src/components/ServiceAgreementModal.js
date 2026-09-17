import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { exportAgreementPdf } from '../utils/exportAgreementPdf';

export default function ServiceAgreementModal({ visible, onClose, agreement }) {
  const { colors, isDark } = useTheme();
  const { t, locale } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);

  if (!visible || !agreement) return null;

  const terms = agreement.terms || {};
  const client = terms.client || {};
  const provider = terms.provider || {};
  const schedule = terms.schedule || {};
  const materials = Array.isArray(terms.materialsList) ? terms.materialsList : [];
  const isFr = locale === 'fr';

  const handleDownloadOrSharePdf = async () => {
    setIsExporting(true);
    try {
      await exportAgreementPdf({
        agreement,
        locale: locale || 'en'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
          {/* Header (NO ICONS) */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isFr ? 'Contrat de Service Fixam' : 'Fixam Service Agreement'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ fontSize: 18, color: colors.textSecondary, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.agreementNumber, { color: colors.textSecondary }]}>
            {agreement.publicAgreementNumber} (v{agreement.version})
          </Text>

          <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
            {/* Section 1: Parties */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{isFr ? '1. PARTIES' : '1. PARTIES'}</Text>
            <View style={[styles.box, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
              <Text style={[styles.bodyText, { color: colors.text }]}>
                <Text style={{ fontWeight: '700' }}>Client:</Text> {client.name || 'Client'} ({client.phone || 'N/A'})
              </Text>
              <Text style={[styles.bodyText, { color: colors.text, marginTop: 4 }]}>
                <Text style={{ fontWeight: '700' }}>{isFr ? 'Prestataire :' : 'Provider:'}</Text> {provider.name || 'Provider'} ({provider.phone || 'N/A'})
              </Text>
            </View>

            {/* Section 2: Service & Scope */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>{isFr ? '2. SERVICE ET DESCRIPTION' : '2. SERVICE & SCOPE'}</Text>
            <View style={[styles.box, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
              <Text style={[styles.bodyText, { color: colors.text }]}>
                <Text style={{ fontWeight: '700' }}>{isFr ? 'Intitulé :' : 'Title:'}</Text> {terms.title || 'Service'}
              </Text>
              <Text style={[styles.bodyText, { color: colors.text, marginTop: 4 }]}>
                <Text style={{ fontWeight: '700' }}>{isFr ? 'Description :' : 'Scope:'}</Text> {terms.scopeOfWork || 'As agreed in booking.'}
              </Text>
            </View>

            {/* Section 3: Schedule & Price */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>{isFr ? '3. CALENDRIER ET PRICING' : '3. SCHEDULE & PRICING'}</Text>
            <View style={[styles.box, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
              <Text style={[styles.bodyText, { color: colors.text }]}>
                <Text style={{ fontWeight: '700' }}>{isFr ? 'Planification :' : 'Schedule:'}</Text> {schedule.date} {schedule.time}
              </Text>
              <Text style={[styles.bodyText, { color: colors.text, marginTop: 4 }]}>
                <Text style={{ fontWeight: '700' }}>{isFr ? 'Lieu :' : 'Location:'}</Text> {terms.location}
              </Text>
              <Text style={[styles.bodyText, { color: '#0D9488', fontWeight: '700', marginTop: 6, fontSize: 13 }]}>
                {isFr ? 'Montant convenu :' : 'Agreed Total:'} {terms.price ? terms.price.toLocaleString() : '0'} {terms.currency || 'XAF'}
              </Text>
            </View>

            {/* Section 4: Materials */}
            {materials.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>{isFr ? '4. MATÉRIEL ET OUTILS' : '4. MATERIALS & TOOLS'}</Text>
                <View style={[styles.box, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
                  {materials.map((m, idx) => (
                    <Text key={idx} style={[styles.bodyText, { color: colors.text, marginTop: idx > 0 ? 3 : 0 }]}>
                      • {m.name || m.item} (Qty: {m.quantity || m.qty || 1}) — {isFr ? 'Fourni par' : 'Supplying'}: {m.suppliedBy || 'Provider'}
                    </Text>
                  ))}
                </View>
              </>
            )}

            {/* Section 5: Official Status */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>{isFr ? '5. STATUT DU CONTRAT' : '5. OFFICIAL RECORD STATUS'}</Text>
            <View style={[styles.box, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
              <Text style={[styles.bodyText, { color: '#059669', fontWeight: '700' }]}>
                {isFr ? '✓ Contrat actif confirmé par Fixam' : '✓ Mutual Contract Active via Fixam Confirmation'}
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary, fontSize: 11, marginTop: 2 }]}>
                {isFr ? 'Fait foi en cas de litige.' : 'Terms binding upon booking confirmation. Usable as legal proof.'}
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleDownloadOrSharePdf} disabled={isExporting}>
              {isExporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
              ) : (
                <MaterialCommunityIcons name="file-pdf-box" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              )}
              <Text style={styles.acceptBtnText}>
                {isExporting ? (isFr ? 'Génération...' : 'Generating...') : (isFr ? 'Télécharger / Partager PDF' : 'Download / Share PDF')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
              <Text style={styles.closeModalBtnText}>{isFr ? 'Fermer' : 'Close'}</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  agreementNumber: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  box: {
    padding: 10,
    borderRadius: 8,
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  closeModalBtn: {
    flex: 1,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
