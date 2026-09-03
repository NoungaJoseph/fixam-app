import React, { useState, useEffect, useRef } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { getVerificationMessageKey, isIdentityVerified, translateApiError } from '../../utils/eligibilityMessages';
import MaterialsListEditor from '../../components/MaterialsListEditor';

const formatAddressLabel = (address) => {
  if (!address) return '';
  const parts = [
    address.street || address.name,
    address.district,
    address.subregion,
    address.city,
  ]
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter(Boolean);

  return [...new Set(parts)].join(', ');
};

const formatTimeForDisplay = (time24) => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  const h12Str = String(h12).padStart(2, '0');
  return `${h12Str}:${mStr} ${period}`;
};

const BookingFormScreen = ({ route, navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { providerId, providerName, providerRate, task } = route.params || {};
  const { user } = useAuth();
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
    materialsList: task?.materialsList || [],
    requiresDiagnosis: task?.requiresDiagnosis || false,
  });
  const [submitting, setSubmitting] = useState(false);
  const { walletBalance } = useAppContext();

  const isNavigatingRef = useRef(false);
  const handleSafeGoBack = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    navigation.goBack();
    setTimeout(() => { isNavigatingRef.current = false; }, 500);
  };

  const getCoinCost = () => {
    return form.urgencyLevel === 'HIGH_PRIORITY' ? 1 : 0;
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [tempHour, setTempHour] = useState('08');
  const [tempMinute, setTempMinute] = useState('00');
  const [tempPeriod, setTempPeriod] = useState('AM');

  useEffect(() => {
    if (showTimePicker) {
      if (form.bookingTime) {
        const [hStr, mStr] = form.bookingTime.split(':');
        const h = parseInt(hStr, 10);
        const period = h >= 12 ? 'PM' : 'AM';
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        setTempHour(String(h12).padStart(2, '0'));
        setTempMinute(mStr);
        setTempPeriod(period);
      } else {
        setTempHour('08');
        setTempMinute('00');
        setTempPeriod('AM');
      }
    }
  }, [showTimePicker, form.bookingTime]);

  const onCustomTimeConfirm = () => {
    let hours = parseInt(tempHour, 10);
    if (tempPeriod === 'PM' && hours < 12) {
      hours += 12;
    } else if (tempPeriod === 'AM' && hours === 12) {
      hours = 0;
    }
    const hh = String(hours).padStart(2, '0');
    const mm = tempMinute;
    setForm(prev => ({ ...prev, bookingTime: `${hh}:${mm}` }));
    setShowTimePicker(false);
  };

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
          const formattedAddress = formatAddressLabel(addressResult[0]);
          if (formattedAddress) {
            setForm(prev => ({ ...prev, location: formattedAddress, latitude, longitude }));
            return;
          }
        }
      } catch (err) {
        console.log('Reverse geocode failed:', err.message);
      }

      setForm(prev => ({ ...prev, latitude, longitude }));
      Alert.alert(t('jobs.locationRequired') || 'Location required', t('jobs.enterStreetQuarter') || 'We could not find your street or quarter. Please type it in the location field.');
    } catch (error) {
      Alert.alert(t('common.error') || 'Error', t('jobs.locationFailed') || 'Could not fetch your location.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const submit = async () => {
    if (user?.isBlocked) {
      Alert.alert(t('common.error'), t('eligibility.accountBlocked'));
      return;
    }
    if (!isIdentityVerified(user)) {
      Alert.alert(t('verification.required'), t(getVerificationMessageKey(user, 'booking')));
      return;
    }

    if (!providerId || !form.bookingDate || !form.bookingTime || !form.location) {
      Alert.alert(t('errors.required'), t('validation.bookingRequired'));
      return;
    }

    const coinCost = getCoinCost();
    if (coinCost > 0 && walletBalance < coinCost) {
      Alert.alert(
        t('bookings.insufficientCoins', 'Insufficient coins'),
        t('bookings.highPriorityCoinsRequired', `High Priority booking requires 1 coin. Please top up your wallet.`),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          { text: t('bookings.topUpWallet', 'Top Up Wallet'), onPress: () => navigation.navigate('Wallet') }
        ]
      );
      return;
    }

    try {
      setSubmitting(true);
      const durationMap = {
        '1 Hour': 'HOURLY',
        '2-3 Hours': 'HOURLY',
        'Half Day (4 Hours)': 'HALF_DAY',
        'Full Day (8 Hours)': 'DAY',
        'Multi-Day Project': 'DAY',
        'Flexible': 'FIXED',
        'DAY': 'DAY',
        'HALF_DAY': 'HALF_DAY',
        'HOURLY': 'HOURLY',
        'FIXED': 'FIXED'
      };
      const mappedDuration = durationMap[form.bookingDuration] || 'HOURLY';
      let bookingBudget = Number(String(form.budget || 0).replace(/[^\d.]/g, '')) || 0;

      const res = await api.post('/bookings', {
        providerId,
        taskId: task?.id,
        bookingDate: form.bookingDate,
        bookingTime: form.bookingTime,
        bookingDuration: mappedDuration,
        urgencyLevel: form.urgencyLevel,
        budget: bookingBudget,
        location: form.location || 'Location Not Specified',
        latitude: form.latitude,
        longitude: form.longitude,
        notes: form.notes || '',
        requiresDiagnosis: form.requiresDiagnosis,
        materialsList: form.materialsList,
      });
      Alert.alert(t('bookings.sent'), t('bookings.sentBody'));
      handleSafeGoBack();
      return res.data;
    } catch (error) {
      const message = translateApiError(error, t, 'errors.bookingFailed');
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
            <TouchableOpacity onPress={handleSafeGoBack} style={[styles.backBtn, { backgroundColor: colors.card }]}>
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

            {/* SECTION 2 — Priority / Urgency Level */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{t('bookings.priorityLevel', 'Booking Priority')}</Text>
              <View style={styles.urgencyContainer}>
                {[
                  { id: 'NORMAL', cost: 0, title: t('bookings.normalPriority', 'Standard'), desc: t('bookings.normalPriorityDesc', 'Standard booking — Free (0 Coins)') },
                  { id: 'HIGH_PRIORITY', cost: 1, title: t('bookings.highPriority', 'High Priority'), desc: t('bookings.highPriorityDesc', 'Expedited response & top priority — 1 Coin') },
                ].map((urg) => {
                  const isSelected = form.urgencyLevel === urg.id;
                  return (
                    <TouchableOpacity
                      key={urg.id}
                      style={[styles.urgencyCard, { backgroundColor: isSelected ? colors.accent + '12' : colors.card, borderColor: isSelected ? colors.accent : colors.border }]}
                      onPress={() => setForm({ ...form, urgencyLevel: urg.id })}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={[styles.urgencyTitle, { color: isSelected ? colors.accent : colors.text }]}>{urg.title}</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: urg.cost > 0 ? '#F59E0B' : '#10B981' }}>
                            {urg.cost > 0 ? `1 Coin` : `FREE`}
                          </Text>
                        </View>
                        <Text style={[styles.urgencyDesc, { color: colors.textSecondary }]}>{urg.desc}</Text>
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
                  {form.bookingTime ? formatTimeForDisplay(form.bookingTime) : "HH:MM"}
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

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{t('bookings.durationLabel', 'Service Duration')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {[
                  { key: '1 Hour', label: '1 Hour' },
                  { key: '2-3 Hours', label: '2-3 Hours' },
                  { key: 'Half Day (4 Hours)', label: 'Half Day (4h)' },
                  { key: 'Full Day (8 Hours)', label: 'Full Day (8h)' },
                  { key: 'Multi-Day Project', label: 'Multi-Day' },
                  { key: 'Flexible', label: 'Flexible' }
                ].map((opt) => {
                  const isSel = form.bookingDuration === opt.key || (form.bookingDuration === 'DAY' && opt.key === 'Full Day (8 Hours)');
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setForm({ ...form, bookingDuration: opt.key })}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        backgroundColor: isSel ? colors.accent : (isDarkMode ? '#1E293B' : '#F1F5F9'),
                        borderColor: isSel ? colors.accent : colors.border
                      }}
                    >
                      <Text style={{ color: isSel ? '#FFFFFF' : colors.text, fontSize: 13, fontWeight: '700' }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <Input label={t('bookings.budget')} placeholder="15000" value={form.budget} onChangeText={(budget) => setForm({ ...form, budget })} keyboardType="numeric" colors={colors} />
            <Input label={t('bookings.details')} placeholder={t('bookings.detailsPlaceholder')} value={form.notes} onChangeText={(notes) => setForm({ ...form, notes })} multiline colors={colors} />

            <MaterialsListEditor
              items={form.materialsList}
              onChangeItems={(items) => setForm(prev => ({ ...prev, materialsList: items }))}
              requiresDiagnosis={form.requiresDiagnosis}
              onToggleDiagnosis={(val) => setForm(prev => ({ ...prev, requiresDiagnosis: val }))}
            />

            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>{t('bookings.bookingSummary', 'Booking Summary')}</Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{t('bookings.durationLabel', 'Duration:')} {t(`bookings.${form.bookingDuration.toLowerCase()}Option`, form.bookingDuration)}</Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{t('bookings.priorityLabel', 'Priority:')} {form.urgencyLevel === 'HIGH_PRIORITY' ? t('bookings.highPriority', 'High Priority') : t('bookings.normalPriority', 'Standard')}</Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{t('bookings.dateLabel', 'Date:')} {form.bookingDate || t('bookings.notSelected', 'Not selected')}</Text>
              <Text style={[styles.summaryCost, { color: getCoinCost() > 0 ? '#F59E0B' : '#10B981' }]}>
                {t('bookings.costLabel', 'Cost:')} {getCoinCost() > 0 ? `1 Coin (${t('bookings.highPriority', 'High Priority')})` : `FREE (0 Coins)`}
              </Text>
            </View>

            <TouchableOpacity onPress={submit} disabled={submitting} style={[styles.submitBtn, { opacity: submitting ? 0.65 : 1, marginTop: 12 }]}>
              {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <MaterialCommunityIcons name="calendar-check" size={20} color="#FFFFFF" />}
              <Text style={styles.submitText}>
                {submitting 
                  ? t('bookings.scheduling') 
                  : (getCoinCost() > 0 
                      ? t('bookings.bookNowHighPriority', 'Book Now (1 Coin)')
                      : t('bookings.bookNowFree', 'Book Now (Free)'))}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {showDatePicker && Platform.OS === 'ios' ? (
            <Modal transparent={true} visible={showDatePicker} animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{t('bookings.selectDate', 'Select Date')}</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={getSafeDate(form.bookingDate)}
                    mode="date"
                    display="inline"
                    minimumDate={new Date()}
                    textColor={isDarkMode ? '#FFFFFF' : '#000000'}
                    onChange={(event, date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        setForm(prev => ({ ...prev, bookingDate: `${year}-${month}-${day}` }));
                      }
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={[styles.modalConfirmBtn, { backgroundColor: colors.accent }]}
                  >
                    <Text style={styles.modalConfirmBtnText}>{t('common.done', 'Done')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          ) : (
            showDatePicker && (
              <DateTimePicker
                value={getSafeDate(form.bookingDate)}
                mode="date"
                display="default"
                minimumDate={new Date()}
                textColor={isDarkMode ? '#FFFFFF' : '#000000'}
                onChange={onDateChange}
              />
            )
          )}

          {showTimePicker && (
            <Modal transparent={true} visible={showTimePicker} animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{t('bookings.selectTime', 'Select Time')}</Text>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.columnsContainer}>
                    {/* Hour column */}
                    <View style={[styles.column, { borderColor: colors.border }]}>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((hr) => {
                          const isSel = tempHour === hr;
                          return (
                            <TouchableOpacity
                              key={hr}
                              onPress={() => setTempHour(hr)}
                              style={[styles.columnItem, isSel && { backgroundColor: colors.accent + '20' }]}
                            >
                              <Text style={[styles.columnItemText, { color: isSel ? colors.accent : colors.text }]}>
                                {hr}
                              </Text>
                            </TouchableOpacity>
                          );
                         })}
                      </ScrollView>
                    </View>

                    {/* Minute column */}
                    <View style={[styles.column, { borderColor: colors.border }]}>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((mn) => {
                          const isSel = tempMinute === mn;
                          return (
                            <TouchableOpacity
                              key={mn}
                              onPress={() => setTempMinute(mn)}
                              style={[styles.columnItem, isSel && { backgroundColor: colors.accent + '20' }]}
                            >
                              <Text style={[styles.columnItemText, { color: isSel ? colors.accent : colors.text }]}>
                                {mn}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* AM/PM column */}
                    <View style={[styles.column, { borderColor: colors.border }]}>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {['AM', 'PM'].map((pd) => {
                          const isSel = tempPeriod === pd;
                          return (
                            <TouchableOpacity
                              key={pd}
                              onPress={() => setTempPeriod(pd)}
                              style={[styles.columnItem, isSel && { backgroundColor: colors.accent + '20' }]}
                            >
                              <Text style={[styles.columnItemText, { color: isSel ? colors.accent : colors.text }]}>
                                {pd}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.modalButtonsRow}>
                    <TouchableOpacity
                      onPress={() => setShowTimePicker(false)}
                      style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.modalCancelBtnText, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={onCustomTimeConfirm}
                      style={[styles.modalConfirmBtn, { backgroundColor: colors.accent }]}
                    >
                      <Text style={styles.modalConfirmBtnText}>{t('common.confirm', 'Confirm')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    maxWidth: 340,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '850',
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 180,
    marginBottom: 18,
    gap: 10,
  },
  column: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  columnItem: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnItemText: {
    fontSize: 15,
    fontWeight: '750',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default BookingFormScreen;
