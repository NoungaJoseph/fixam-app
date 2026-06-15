import React, { useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';

const BookingFormScreen = ({ route, navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { providerId, providerName, providerRate, task } = route.params || {};
  const [form, setForm] = useState({
    bookingDate: '',
    bookingTime: '',
    location: task?.location || '',
    latitude: task?.latitude || null,
    longitude: task?.longitude || null,
    budget: String(task?.budgetMax || task?.budget || providerRate || 0),
    notes: task?.description || '',
    bookingDuration: 'DAY',
    urgencyLevel: 'NORMAL',
  });
  const [submitting, setSubmitting] = useState(false);
  const { walletBalance } = useAppContext();

  const getCoinCost = () => {
    switch(form.urgencyLevel) {
      case 'EMERGENCY': return 3;
      case 'URGENT': return 2;
      default: return 1;
    }
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setForm(prev => ({ ...prev, bookingDate: `${year}-${month}-${day}` }));
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      setForm(prev => ({ ...prev, bookingTime: `${hours}:${minutes}` }));
    }
  };

  const getSafeDate = (dateStr) => {
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const getCurrentLocation = async () => {
    try {
      setDetectingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('jobs.permissionDenied') || 'Permission Denied', t('jobs.locationPermissionBody') || 'Location permission is required.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      
      try {
        const addressResult = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (addressResult && addressResult.length > 0) {
          const addr = addressResult[0];
          const name = addr.name || '';
          const street = addr.street || '';
          const city = addr.city || addr.subregion || '';
          const region = addr.region || '';
          const addressParts = [name, street, city, region].filter(Boolean);
          const formattedAddress = addressParts.join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setForm(prev => ({ ...prev, location: formattedAddress, latitude, longitude }));
          return;
        }
      } catch (err) {
        console.log("Reverse geocode failed, using coordinates instead");
      }
      
      setForm(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, latitude, longitude }));
    } catch (error) {
      Alert.alert(t('common.error') || 'Error', t('jobs.locationFailed') || 'Could not fetch your location.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const submit = async () => {
    if (!providerId || !form.bookingDate || !form.bookingTime || !form.location || !form.budget) {
      Alert.alert(t('errors.required'), t('validation.bookingRequired'));
      return;
    }

    const coinCost = getCoinCost();
    if (walletBalance < coinCost) {
      Alert.alert(
        t('bookings.insufficientCoins', 'Insufficient coins'),
        t('bookings.coinsRequired', `You need ${coinCost} coins for this booking. Top up your wallet.`),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          { text: t('bookings.topUpWallet', 'Top Up Wallet'), onPress: () => navigation.navigate('Wallet') }
        ]
      );
      return;
    }

    try {
      setSubmitting(true);
      const bookingBudget = Number(String(form.budget || 0).replace(/[^\d.]/g, '')) || 0;
      const res = await api.post('/bookings', {
        providerId,
        taskId: task?.id,
        bookingDate: form.bookingDate,
        bookingTime: form.bookingTime,
        bookingDuration: form.bookingDuration,
        urgencyLevel: form.urgencyLevel,
        budget: bookingBudget,
        location: form.location || '',
        latitude: form.latitude,
        longitude: form.longitude,
        notes: form.notes || '',
      });
      Alert.alert(t('bookings.sent'), t('bookings.sentBody'));
      navigation.goBack();
      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || t('errors.bookingFailed');
      Alert.alert(t('bookings.failed'), message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
              <MaterialCommunityIcons name="chevron-left" size={28} color={colors.accent} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>{t('bookings.title')}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{providerName || t('common.provider')}</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* SECTION 1 — Booking Duration */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{t('bookings.bookingDuration', 'How long do you need this service?')}</Text>
              <View style={styles.durationRow}>
                {['DAY', 'WEEK', 'MONTH'].map((dur) => {
                  const isSelected = form.bookingDuration === dur;
                  return (
                    <TouchableOpacity
                      key={dur}
                      style={[styles.durationCard, { backgroundColor: isSelected ? colors.accent + '20' : colors.card, borderColor: isSelected ? colors.accent : colors.border }]}
                      onPress={() => setForm({ ...form, bookingDuration: dur })}
                    >
                      <Text style={[styles.durationText, { color: isSelected ? colors.accent : colors.text }]}>
                        {t(`bookings.${dur.toLowerCase()}Option`, dur)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SECTION 2 — Urgency Level */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{t('bookings.urgencyLevel', 'How urgent is this?')}</Text>
              <View style={styles.urgencyContainer}>
                {[
                  { id: 'NORMAL', cost: 1, title: t('bookings.normalUrgency', 'Normal'), desc: t('bookings.normalDesc', 'Standard booking, scheduled in advance') },
                  { id: 'URGENT', cost: 2, title: t('bookings.urgentUrgency', 'Urgent'), desc: t('bookings.urgentDesc', 'Same day or next day service') },
                  { id: 'EMERGENCY', cost: 3, title: t('bookings.emergencyUrgency', 'Emergency'), desc: t('bookings.emergencyDesc', 'Immediate service required') },
                ].map((urg) => {
                  const isSelected = form.urgencyLevel === urg.id;
                  return (
                    <TouchableOpacity
                      key={urg.id}
                      style={[styles.urgencyCard, { backgroundColor: isSelected ? colors.accent + '10' : colors.card, borderColor: isSelected ? colors.accent : colors.border }]}
                      onPress={() => setForm({ ...form, urgencyLevel: urg.id })}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.urgencyTitle, { color: isSelected ? colors.accent : colors.text }]}>{urg.title}</Text>
                        <Text style={[styles.urgencyDesc, { color: colors.textSecondary }]}>{urg.desc}</Text>
                      </View>
                      <View style={[styles.coinBadge, { backgroundColor: isSelected ? colors.accent : colors.border }]}>
                        <MaterialCommunityIcons name="currency-usd-circle" size={14} color="#FFF" />
                        <Text style={styles.coinBadgeText}>{urg.cost}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{t('bookings.date')}</Text>
              <TouchableOpacity
                style={[styles.selectorInput, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: form.bookingDate ? colors.text : colors.placeholder, fontSize: 15, fontWeight: '600', flex: 1 }}>
                  {form.bookingDate || "YYYY-MM-DD"}
                </Text>
                <MaterialCommunityIcons name="calendar" size={22} color={colors.accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{t('bookings.time')}</Text>
              <TouchableOpacity
                style={[styles.selectorInput, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ color: form.bookingTime ? colors.text : colors.placeholder, fontSize: 15, fontWeight: '600', flex: 1 }}>
                  {form.bookingTime || "HH:MM"}
                </Text>
                <MaterialCommunityIcons name="clock-outline" size={22} color={colors.accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{t('bookings.location')}</Text>
              <View style={styles.locationInputRow}>
                <TextInput
                  placeholder={t('bookings.locationPlaceholder')}
                  value={form.location}
                  onChangeText={(location) => setForm({ ...form, location })}
                  placeholderTextColor={colors.placeholder}
                  style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                />
                <TouchableOpacity
                  style={[styles.locationDetectBtn, { backgroundColor: colors.accent }]}
                  onPress={getCurrentLocation}
                  disabled={detectingLocation}
                >
                  <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <Input label={t('bookings.budget')} placeholder="15000" value={form.budget} onChangeText={(budget) => setForm({ ...form, budget })} keyboardType="numeric" colors={colors} />
            <Input label={t('bookings.details')} placeholder={t('bookings.detailsPlaceholder')} value={form.notes} onChangeText={(notes) => setForm({ ...form, notes })} multiline colors={colors} />

            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>{t('bookings.bookingSummary', 'Booking Summary')}</Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>Duration: {t(`bookings.${form.bookingDuration.toLowerCase()}Option`, form.bookingDuration)}</Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>Type: {t(`bookings.${form.urgencyLevel.toLowerCase()}Urgency`, form.urgencyLevel)}</Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>Date: {form.bookingDate || 'Not selected'}</Text>
              <Text style={[styles.summaryCost, { color: colors.accent }]}>Cost: {getCoinCost()} coins will be deducted</Text>
            </View>

            <TouchableOpacity onPress={submit} disabled={submitting} style={[styles.submitBtn, { opacity: submitting ? 0.65 : 1, marginTop: 12 }]}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#FFFFFF" />
              <Text style={styles.submitText}>{submitting ? t('bookings.scheduling') : t('bookings.bookNowCoins', { coins: getCoinCost() }).replace('{{coins}}', getCoinCost())}</Text>
            </TouchableOpacity>
          </ScrollView>

          {showDatePicker && (
            <DateTimePicker
              value={getSafeDate(form.bookingDate)}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={onDateChange}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              is24Hour={true}
              onChange={onTimeChange}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const Input = ({ label, colors, style, ...props }) => (
  <View style={styles.field}>
    <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    <TextInput
      {...props}
      placeholderTextColor={colors.placeholder}
      style={[styles.input, props.multiline && styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }, style]}
    />
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  content: { padding: 18, paddingBottom: 24, gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '800' },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, fontSize: 15, fontWeight: '600' },
  textArea: { minHeight: 120, paddingTop: 14, textAlignVertical: 'top' },
  submitBtn: { height: 54, borderRadius: 8, backgroundColor: '#0D9488', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  selectorInput: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationDetectBtn: {
    width: 52,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  durationRow: { flexDirection: 'row', gap: 10 },
  durationCard: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  durationText: { fontSize: 14, fontWeight: '700' },
  urgencyContainer: { gap: 10 },
  urgencyCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 14, gap: 10 },
  urgencyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  urgencyDesc: { fontSize: 13, fontWeight: '500' },
  coinBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  coinBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  summaryCard: { borderWidth: 1, borderRadius: 8, padding: 16, marginTop: 8 },
  summaryTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  summaryText: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  summaryCost: { fontSize: 14, fontWeight: '800', marginTop: 4 },
});

export default BookingFormScreen;
