import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const paymentLabel = (value, french) => ({
  CASH: french ? 'Espèces' : 'Cash',
  MOBILE_MONEY: 'Mobile Money',
  AGREE_WITH_PROVIDER: french ? 'À convenir avec le prestataire' : 'Agree with provider',
}[value] || (french ? 'À convenir avec le prestataire' : 'Agree with provider'));

export default function RevisedQuoteScreen({ route, navigation }) {
  const { booking = {}, mode = 'provider' } = route.params || {};
  const { colors } = useTheme();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const isFr = String(locale || '').startsWith('fr');
  const isProvider = mode === 'provider' || user?.id === booking.providerId;
  const [revision, setRevision] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    budget: String(booking.budget || ''), message: '', bookingTime: booking.bookingTime || '',
    bookingDuration: booking.bookingDuration || 'DAY', paymentPreference: booking.paymentPreference || 'AGREE_WITH_PROVIDER',
  });

  useEffect(() => {
    if (!booking?.id) return;
    api.get(`/bookings/${booking.id}/revisions`)
      .then((response) => {
        const newest = response.data?.data?.[0];
        // Existing counter-offers stay actionable while accounts progressively receive the new flow.
        setRevision(newest || (booking.counterBudget ? {
          legacy: true,
          budget: booking.counterBudget,
          message: booking.counterNotes,
          paymentPreference: booking.paymentPreference,
        } : null));
      })
      .catch(() => setRevision(booking.counterBudget ? {
        legacy: true, budget: booking.counterBudget, message: booking.counterNotes,
        paymentPreference: booking.paymentPreference,
      } : null));
  }, [booking?.id, booking.counterBudget, booking.counterNotes, booking.paymentPreference]);

  const send = async () => {
    if (!form.message.trim()) {
      Alert.alert(t('common.error', 'Error'), isFr ? 'Expliquez les modifications proposées.' : 'Explain the proposed changes.');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/bookings/${booking.id}/revisions`, {
        budget: Number(form.budget), message: form.message, bookingTime: form.bookingTime || undefined,
        bookingDuration: form.bookingDuration, paymentPreference: form.paymentPreference, reason: 'PRICE',
      });
      Alert.alert(t('common.success', 'Success'), isFr ? 'Proposition révisée envoyée.' : 'Revised quote sent.');
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error', 'Error'), error.response?.data?.message || (isFr ? 'Impossible d’envoyer la proposition.' : 'Unable to send revised quote.'));
    } finally { setSaving(false); }
  };

  const respond = async (action) => {
    if (!revision) return;
    setSaving(true);
    try {
      if (revision.legacy) {
        await api.patch(`/bookings/${booking.id}/status`, { status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' });
      } else {
        await api.post(`/bookings/${booking.id}/revisions/${revision.id}/${action}`);
      }
      Alert.alert(t('common.success', 'Success'), action === 'accept'
        ? (isFr ? 'Réservation confirmée.' : 'Booking confirmed.')
        : (isFr ? 'Proposition refusée.' : 'Quote declined.'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error', 'Error'), error.response?.data?.message || (isFr ? 'Impossible de mettre à jour la proposition.' : 'Unable to update quote.'));
    } finally { setSaving(false); }
  };

  const Row = ({ label, value }) => <View style={[styles.row, { borderBottomColor: colors.border }]}><Text style={{ color: colors.textSecondary }}>{label}</Text><Text style={{ color: colors.text, fontWeight: '800', flexShrink: 1, textAlign: 'right' }}>{value || '—'}</Text></View>;
  const title = isProvider ? (isFr ? 'Envoyer une proposition révisée' : 'Send a revised quote') : (isFr ? 'Examiner la proposition révisée' : 'Review revised quote');

  return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={styles.page}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: colors.accent, fontWeight: '800' }}>← {isFr ? 'Retour' : 'Back'}</Text></TouchableOpacity>
    <Text style={[styles.eyebrow, { color: colors.accent }]}>{isFr ? 'RÉSERVATION' : 'BOOKING'}</Text>
    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
    <Text style={[styles.sub, { color: colors.textSecondary }]}>{isFr ? 'Comparez clairement les conditions avant de confirmer.' : 'Review the terms clearly before confirmation.'}</Text>
    <Text style={[styles.heading, { color: colors.text }]}>{isFr ? 'Conditions demandées' : 'Requested terms'}</Text>
    <Row label={isFr ? 'Budget' : 'Budget'} value={`${Number(booking.budget || 0).toLocaleString()} XAF`} />
    <Row label={isFr ? 'Horaire' : 'Time'} value={booking.bookingTime} />
    <Row label={isFr ? 'Durée' : 'Duration'} value={booking.bookingDuration} />
    <Row label={isFr ? 'Paiement' : 'Payment'} value={paymentLabel(booking.paymentPreference, isFr)} />
    {isProvider ? <>
      <Text style={[styles.heading, { color: colors.text }]}>{isFr ? 'Conditions révisées' : 'Revised terms'}</Text>
      <TextInput value={form.budget} onChangeText={(budget) => setForm({ ...form, budget })} keyboardType="numeric" placeholder={isFr ? 'Nouveau budget' : 'New budget'} placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
      <TextInput value={form.message} onChangeText={(message) => setForm({ ...form, message })} multiline placeholder={isFr ? 'Expliquez les changements' : 'Explain the changes'} placeholderTextColor={colors.textSecondary} style={[styles.input, styles.area, { color: colors.text, borderColor: colors.border }]} />
      <Text style={[styles.label, { color: colors.textSecondary }]}>{isFr ? 'Préférence de paiement' : 'Payment preference'}</Text>
      <View style={styles.choiceRow}>{['CASH', 'MOBILE_MONEY', 'AGREE_WITH_PROVIDER'].map((value) => <TouchableOpacity key={value} onPress={() => setForm({ ...form, paymentPreference: value })} style={[styles.choice, { borderColor: form.paymentPreference === value ? colors.accent : colors.border, backgroundColor: form.paymentPreference === value ? `${colors.accent}16` : 'transparent' }]}><Text style={{ color: form.paymentPreference === value ? colors.accent : colors.text, fontWeight: '700', fontSize: 12 }}>{paymentLabel(value, isFr)}</Text></TouchableOpacity>)}</View>
      <TouchableOpacity disabled={saving} onPress={send} style={[styles.primary, { backgroundColor: colors.accent }]}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{isFr ? 'Envoyer la proposition révisée' : 'Send revised quote'}</Text>}</TouchableOpacity>
    </> : <>
      {revision ? <><Text style={[styles.heading, { color: colors.text }]}>{isFr ? 'Conditions révisées' : 'Revised terms'}</Text><Row label={isFr ? 'Budget' : 'Budget'} value={`${Number(revision.budget ?? booking.budget).toLocaleString()} XAF`} /><Row label={isFr ? 'Paiement' : 'Payment'} value={paymentLabel(revision.paymentPreference || booking.paymentPreference, isFr)} />{revision.message ? <Text style={[styles.note, { color: colors.textSecondary }]}>{revision.message}</Text> : null}</> : <Text style={[styles.note, { color: colors.textSecondary }]}>{isFr ? 'Aucune proposition révisée active.' : 'There is no active revised quote.'}</Text>}
      <Text style={[styles.note, { color: colors.textSecondary }]}>{isFr ? 'Fixam ne collecte ni ne conserve les paiements de service.' : 'Fixam does not collect or hold service payments.'}</Text>
      {revision ? <View style={styles.actions}><TouchableOpacity disabled={saving} onPress={() => respond('decline')} style={[styles.secondary, { borderColor: colors.border }]}><Text style={{ color: colors.text, fontWeight: '800' }}>{isFr ? 'Refuser' : 'Decline'}</Text></TouchableOpacity><TouchableOpacity disabled={saving} onPress={() => respond('accept')} style={[styles.primary, { backgroundColor: colors.accent, flex: 1, marginTop: 0 }]}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{isFr ? 'Accepter' : 'Accept revised quote'}</Text>}</TouchableOpacity></View> : null}
    </>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, page: { padding: 22, paddingBottom: 48 }, eyebrow: { marginTop: 32, fontSize: 12, fontWeight: '900', letterSpacing: 1.2 }, title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.8, marginTop: 8 }, sub: { fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 28 }, heading: { fontSize: 17, fontWeight: '900', marginTop: 22, marginBottom: 8 }, row: { paddingVertical: 14, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, input: { borderBottomWidth: 1, fontSize: 16, paddingVertical: 14, marginBottom: 12 }, area: { minHeight: 100, textAlignVertical: 'top' }, label: { marginTop: 4, marginBottom: 8, fontWeight: '700', fontSize: 13 }, choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 10 }, primary: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 18 }, primaryText: { color: '#fff', fontWeight: '900' }, secondary: { padding: 16, borderWidth: 1, borderRadius: 12, alignItems: 'center', flex: 1 }, actions: { flexDirection: 'row', gap: 10, marginTop: 18 }, note: { lineHeight: 21, marginTop: 12 },
});
