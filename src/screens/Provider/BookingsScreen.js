import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { translateApiError } from '../../utils/eligibilityMessages';

const statusMeta = {
  PENDING: { icon: 'clock-outline', color: '#F59E0B', label: 'Pending' },
  ACCEPTED: { icon: 'calendar-check-outline', color: '#0D9488', label: 'Accepted' },
  IN_PROGRESS: { icon: 'progress-clock', color: '#2563EB', label: 'In progress' },
  COMPLETED: { icon: 'check-circle-outline', color: '#22C55E', label: 'Completed' },
  REJECTED: { icon: 'close-circle-outline', color: '#EF4444', label: 'Rejected' },
  CANCELLED: { icon: 'close-circle-outline', color: '#EF4444', label: 'Cancelled' },
};

const hasUserReviewed = (booking, userId) => {
  if (!userId) return false;
  return (booking.reviews || []).some((review) => review.reviewerId === userId);
};

const BookingsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { myBookingsList } = useAppContext();
  const { on } = useSocket();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [bookings, setBookings] = useState(myBookingsList || []);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const handleSafeGoBack = () => {
    navigation.goBack();
  };

  const fetchBookings = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/bookings/mine?role=PROVIDER');
      setBookings(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (myBookingsList && myBookingsList.length > 0) {
      setBookings(myBookingsList);
    }
  }, [myBookingsList]);

  useEffect(() => {
    fetchBookings(true);
  }, [fetchBookings]);

  useEffect(() => {
    const off = on('booking:update', () => fetchBookings(true));
    return () => off?.();
  }, [fetchBookings, on]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }, [bookings]);

  const updateStatus = async (bookingId, status) => {
    try {
      setUpdatingId(bookingId);
      await api.patch(`/bookings/${bookingId}/status`, { status });
      await fetchBookings();
    } catch (error) {
      Alert.alert(t('common.error'), translateApiError(error, t, 'jobs.updateFailed'));
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmStatus = (booking, status, title, body) => {
    Alert.alert(title, body, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm', 'Confirm'), onPress: () => updateStatus(booking.id, status) },
    ]);
  };

  const renderBooking = useCallback(({ item }) => {
    const status = String(item.status || 'PENDING').toUpperCase();
    const meta = statusMeta[status] || statusMeta.PENDING;
    const date = item.bookingDate ? new Date(item.bookingDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US') : t('jobs.asap');
    const reviewed = hasUserReviewed(item, user?.id);
    const isUpdating = updatingId === item.id;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? 'rgba(13,148,136,0.16)' : '#E6FDF3' }]}>
            <MaterialCommunityIcons name="calendar-clock" size={24} color={colors.accent} />
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {item.notes || t('jobs.scheduledServiceBooking')}
            </Text>
            <Text style={[styles.client, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.client?.fullName || t('common.client')}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${meta.color}18` }]}>
            <MaterialCommunityIcons name={meta.icon} size={13} color={meta.color} />
            <Text style={[styles.statusText, { color: meta.color }]}>{t(`jobs.status_${status.toLowerCase()}`, meta.label || status)}</Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <Detail icon="calendar" label={date} colors={colors} />
          <Detail icon="clock-outline" label={item.bookingTime || t('jobs.asap')} colors={colors} />
          <Detail icon="map-marker-outline" label={item.location || t('jobs.onSite')} colors={colors} />
          <Detail icon="cash" label={`${Number(item.budget || 0).toLocaleString()} FCFA`} colors={colors} />
        </View>

        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          {['ACCEPTED', 'IN_PROGRESS'].includes(status) ? (
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={() => navigation.navigate('Chat', {
                receiverId: item.clientId,
                userName: item.client?.fullName || t('common.client'),
                avatar: item.client?.avatar,
                task: item,
              })}
            >
              <MaterialCommunityIcons name="message-text-outline" size={16} color={colors.accent} />
              <Text style={[styles.secondaryText, { color: colors.accent }]}>{t('tabs.messages')}</Text>
            </TouchableOpacity>
          ) : null}

          {status === 'PENDING' ? (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              disabled={isUpdating}
              onPress={() => updateStatus(item.id, 'ACCEPTED')}
            >
              {isUpdating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryText}>{t('jobs.accept')}</Text>}
            </TouchableOpacity>
          ) : null}

          {status === 'ACCEPTED' ? (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              disabled={isUpdating}
              onPress={() => confirmStatus(item, 'IN_PROGRESS', t('jobs.startJob'), t('jobs.startJobBody'))}
            >
              {isUpdating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryText}>{t('jobs.startJob')}</Text>}
            </TouchableOpacity>
          ) : null}

          {status === 'IN_PROGRESS' ? (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: '#22C55E' }]}
              disabled={isUpdating}
              onPress={() => confirmStatus(item, 'COMPLETED', t('jobs.markComplete'), t('jobs.markCompleteBody'))}
            >
              {isUpdating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryText}>{t('jobs.markCompleted')}</Text>}
            </TouchableOpacity>
          ) : null}

          {status === 'COMPLETED' && !reviewed ? (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={() => navigation.navigate('ReviewTask', {
                task: item,
                provider: { id: item.clientId, fullName: item.client?.fullName || t('common.client') },
              })}
            >
              <MaterialCommunityIcons name="star-outline" size={15} color="#FFF" />
              <Text style={styles.primaryText}>{t('jobs.rateClient')}</Text>
            </TouchableOpacity>
          ) : null}

          {status === 'COMPLETED' && reviewed ? (
            <View style={[styles.reviewedPill, { backgroundColor: isDarkMode ? 'rgba(34,197,94,0.14)' : '#F0FDF4' }]}>
              <MaterialCommunityIcons name="star-check" size={16} color="#16A34A" />
              <Text style={styles.reviewedText}>{t('jobs.reviewSubmitted', 'Review submitted')}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }, [colors, isDarkMode, locale, t, updatingId, user?.id, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleSafeGoBack}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('jobs.bookings', 'Bookings')}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{t('jobs.bookingRequestsSubtitle', 'Review direct booking requests')}</Text>
        </View>
      </View>

      <FlatList
        data={sortedBookings}
        keyExtractor={(item, index) => item?.id || item?._id || index.toString()}
        renderItem={renderBooking}
        refreshing={loading}
        onRefresh={() => fetchBookings(false)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={56} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('jobs.noBookings', 'No bookings yet')}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t('jobs.bookingRequestsAppearHere', 'New client booking requests will appear here.')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const Detail = ({ icon, label, colors }) => (
  <View style={styles.detail}>
    <MaterialCommunityIcons name={icon} size={15} color={colors.textSecondary} />
    <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10 },
  backBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '900' },
  headerSub: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  list: { padding: 18, paddingBottom: 110 },
  card: { borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitleWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: '900' },
  client: { fontSize: 13, fontWeight: '700', marginTop: 3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '900' },
  detailGrid: { gap: 8, marginTop: 14 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  detailText: { flex: 1, fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 9, borderTopWidth: 1, marginTop: 14, paddingTop: 12 },
  primaryBtn: { flex: 1, minHeight: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 10 },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  secondaryBtn: { flex: 1, minHeight: 42, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 10 },
  secondaryText: { fontSize: 13, fontWeight: '900' },
  reviewedPill: { flex: 1, minHeight: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 10 },
  reviewedText: { color: '#16A34A', fontSize: 13, fontWeight: '900' },
  empty: { alignItems: 'center', paddingTop: 90, paddingHorizontal: 22 },
  emptyTitle: { fontSize: 18, fontWeight: '900', marginTop: 14 },
  emptySub: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 6 },
});

export default BookingsScreen;
