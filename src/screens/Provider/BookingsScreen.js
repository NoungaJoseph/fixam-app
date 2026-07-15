import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, TextInput, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getCurrencyForUser } from '../../constants/countries';
import api from '../../services/api';
import { translateApiError } from '../../utils/eligibilityMessages';

const statusMeta = {
  PENDING: { icon: 'clock-outline', color: '#F59E0B', label: 'Pending' },
  ACCEPTED: { icon: 'calendar-check-outline', color: '#0D9488', label: 'Accepted' },
  IN_PROGRESS: { icon: 'progress-clock', color: '#2563EB', label: 'In progress' },
  COMPLETED: { icon: 'check-circle-outline', color: '#22C55E', label: 'Completed' },
  REJECTED: { icon: 'close-circle-outline', color: '#EF4444', label: 'Rejected' },
  CANCELLED: { icon: 'close-circle-outline', color: '#EF4444', label: 'Cancelled' },
  COUNTER_PROPOSED: { icon: 'cash-multiple', color: '#8B5CF6', label: 'Counter proposed' },
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

  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [counterBudget, setCounterBudget] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [submittingCounter, setSubmittingCounter] = useState(false);

  const handleOpenCounterModal = (booking) => {
    setSelectedBooking(booking);
    setCounterBudget(String(booking.budget || ''));
    setCounterNotes('');
    setCounterModalVisible(true);
  };

  const submitCounterOffer = async () => {
    if (!counterBudget || isNaN(Number(counterBudget)) || Number(counterBudget) <= 0) {
      Alert.alert(t('common.error'), t('jobs.invalidBudget', 'Please enter a valid budget greater than 0'));
      return;
    }
    try {
      setSubmittingCounter(true);
      await api.post(`/bookings/${selectedBooking.id}/counter`, {
        counterBudget: Number(counterBudget),
        counterNotes: counterNotes
      });
      setCounterModalVisible(false);
      Alert.alert(t('common.success'), t('booking.bookings.counterOfferSent', 'Counter-offer sent successfully.'));
      await fetchBookings();
    } catch (error) {
      Alert.alert(t('common.error'), translateApiError(error, t, 'jobs.updateFailed'));
    } finally {
      setSubmittingCounter(false);
    }
  };

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
    const urgencyWeight = {
      EMERGENCY: 3,
      URGENT: 2,
      NORMAL: 1,
      LOW: 1
    };
    return [...bookings].sort((a, b) => {
      const weightA = urgencyWeight[a.urgencyLevel] || 1;
      const weightB = urgencyWeight[b.urgencyLevel] || 1;
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
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

    const isUrgent = item.urgencyLevel === 'URGENT';
    const isEmergency = item.urgencyLevel === 'EMERGENCY';
    const highlightBorderColor = isEmergency ? '#EF4444' : (isUrgent ? '#F97316' : colors.border);
    const highlightBorderWidth = (isEmergency || isUrgent) ? 2 : 1;

    const hasNoBudget = !item.budget || item.budget === 0;
    const budgetLabel = (hasNoBudget && (isUrgent || isEmergency))
      ? t('bookings.toBeQuoted', 'To be quoted')
      : `${Number(item.budget || 0).toLocaleString()} ${getCurrencyForUser(item.country || user?.country || 'Cameroon')}`;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: highlightBorderColor, borderWidth: highlightBorderWidth }]}>
        {item.urgencyLevel && item.urgencyLevel !== 'NORMAL' && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 4,
            backgroundColor: isEmergency ? '#EF4444' : '#F97316',
            marginBottom: 10,
            gap: 4
          }}>
            <MaterialCommunityIcons
              name={isEmergency ? 'alert-decagram' : 'alert-circle'}
              size={14}
              color="#FFFFFF"
            />
            <Text style={{
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: '900',
              textTransform: 'uppercase'
            }}>
              {isEmergency ? t('bookings.emergencyUrgency', 'Emergency') : t('bookings.urgentUrgency', 'Urgent')}
            </Text>
          </View>
        )}

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
          <Detail icon="cash" label={budgetLabel} colors={colors} />
        </View>

        {status === 'COUNTER_PROPOSED' && (
          <View style={[styles.counterDetails, { backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.08)' : '#F5F3FF', borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <MaterialCommunityIcons name="cash-multiple" size={16} color="#8B5CF6" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#8B5CF6' }}>{t('booking.bookings.yourProposedCounter', 'Your Proposed Counter:')}</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text, marginTop: 4 }}>
              {Number(item.counterBudget || 0).toLocaleString()} {getCurrencyForUser(item.country || user?.country || 'Cameroon')}
            </Text>
            {item.counterNotes ? (
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' }}>
                "{item.counterNotes}"
              </Text>
            ) : null}
          </View>
        )}

        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          {['ACCEPTED', 'IN_PROGRESS', 'COUNTER_PROPOSED'].includes(status) ? (
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
            <>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: '#EF4444', flex: 1, marginRight: 2 }]}
                disabled={isUpdating}
                onPress={() => confirmStatus(item, 'REJECTED', t('jobs.reject'), t('jobs.rejectConfirm', 'Are you sure you want to decline this booking request?'))}
              >
                <Text style={[styles.secondaryText, { color: '#EF4444' }]}>{t('jobs.reject')}</Text>
              </TouchableOpacity>
              
              {['URGENT', 'EMERGENCY'].includes(item.urgencyLevel) && (!item.budget || item.budget === 0) ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: '#8B5CF6', flex: 2 }]}
                  disabled={isUpdating}
                  onPress={() => handleOpenCounterModal(item)}
                >
                  <Text style={styles.primaryText}>{t('bookings.quotePriceAccept', 'Quote Price')}</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { borderColor: '#8B5CF6', flex: 1, marginRight: 2 }]}
                    disabled={isUpdating}
                    onPress={() => handleOpenCounterModal(item)}
                  >
                    <Text style={[styles.secondaryText, { color: '#8B5CF6' }]}>{t('booking.bookings.counter', 'Counter')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: colors.accent, flex: 1.5 }]}
                    disabled={isUpdating}
                    onPress={() => updateStatus(item.id, 'ACCEPTED')}
                  >
                    {isUpdating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryText}>{t('jobs.accept')}</Text>}
                  </TouchableOpacity>
                </>
              )}
            </>
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

      <Modal
        visible={counterModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCounterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('booking.bookings.proposeCounter', 'Propose Counter-Offer')}</Text>
              <TouchableOpacity onPress={() => setCounterModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('booking.bookings.proposedBudget', 'Proposed Budget')}</Text>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <MaterialCommunityIcons name="cash" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  keyboardType="numeric"
                  value={counterBudget}
                  onChangeText={setCounterBudget}
                  placeholder="e.g. 15000"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>{t('booking.bookings.explanation', 'Message / Explanation')}</Text>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background, height: 'auto', minHeight: 90, alignItems: 'flex-start', paddingTop: 8, marginBottom: 24 }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text, height: '100%', textAlignVertical: 'top' }]}
                  multiline
                  numberOfLines={3}
                  value={counterNotes}
                  onChangeText={setCounterNotes}
                  placeholder={t('booking.bookings.counterNotesPlaceholder', 'Why are you countering? (e.g. materials needed)')}
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setCounterModalVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.accent }]}
                onPress={submitCounterOffer}
                disabled={submittingCounter}
              >
                {submittingCounter ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>{t('common.submit', 'Submit')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '90%', maxWidth: 400, borderRadius: 12, borderWidth: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalBody: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 46 },
  textInput: { flex: 1, fontSize: 14, fontWeight: '600', padding: 0 },
  modalFooter: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  submitBtn: { minWidth: 100, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  submitBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  cancelBtn: { minWidth: 100, height: 42, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  cancelBtnText: { fontSize: 13, fontWeight: '900' },
  counterDetails: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 12 },
  reviewedPill: { flex: 1, minHeight: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 10 },
  reviewedText: { color: '#16A34A', fontSize: 13, fontWeight: '900' },
  empty: { alignItems: 'center', paddingTop: 90, paddingHorizontal: 22 },
  emptyTitle: { fontSize: 18, fontWeight: '900', marginTop: 14 },
  emptySub: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 6 },
});

export default BookingsScreen;
