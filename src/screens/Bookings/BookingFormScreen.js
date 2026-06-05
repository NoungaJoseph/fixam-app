import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
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
    budget: String(task?.budgetMax || task?.budget || providerRate || 0),
    notes: task?.description || '',
  });
  const [submitting, setSubmitting] = useState(false);

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
          setForm(prev => ({ ...prev, location: formattedAddress }));
          return;
        }
      } catch (err) {
        console.log("Reverse geocode failed, using coordinates instead");
      }
      
      setForm(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
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
    try {
      setSubmitting(true);
      const bookingBudget = Number(String(form.budget || 0).replace(/[^\d.]/g, '')) || 0;
      const res = await api.post('/bookings', {
        providerId,
        taskId: task?.id,
        bookingDate: form.bookingDate,
        bookingTime: form.bookingTime,
        budget: bookingBudget,
        location: form.location || '',
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
      <StatusBar style={isDarkMode ? 'light' : 'dark'} translucent backgroundColor="transparent" />
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

            <TouchableOpacity onPress={submit} disabled={submitting} style={[styles.submitBtn, { opacity: submitting ? 0.65 : 1, marginTop: 12 }]}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#FFFFFF" />
              <Text style={styles.submitText}>{submitting ? t('bookings.scheduling') : t('bookings.confirm')}</Text>
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
});

export default BookingFormScreen;
