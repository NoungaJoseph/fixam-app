import React, { useCallback, useEffect, useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image, StatusBar, Platform, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { key: 'All Jobs', label: 'All Jobs', icon: 'all-inclusive' },
  { key: 'Booked', label: 'Booked Jobs', icon: 'calendar-clock' },
  { key: 'Active', label: 'In Progress', icon: 'progress-clock' },
  { key: 'Requests', label: 'Pending', icon: 'clock-outline' },
  { key: 'Completed', label: 'Completed', icon: 'check-circle-outline' },
  { key: 'Cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
];

const STATUS_CONFIG = {
  Requests:  { label: 'Pending',     color: '#F59E0B', bg: '#FFFBEB', icon: 'clock-outline' },
  Booked:    { label: 'Booked',      color: '#8B5CF6', bg: '#F5F3FF', icon: 'calendar-clock' },
  Active:    { label: 'In Progress', color: '#2563EB', bg: '#EFF6FF', icon: 'progress-clock' },
  Completed: { label: 'Completed',   color: '#22C55E', bg: '#F0FDF4', icon: 'check-circle' },
  Cancelled: { label: 'Cancelled',   color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle-outline' },
};

const CATEGORY_ICONS = {
  PLUMBING: 'pipe-wrench',
  ELECTRICAL: 'lightning-bolt-circle',
  CLEANING: 'broom',
  PAINTING: 'format-paint',
  CARPENTRY: 'hammer',
  GARDENING: 'flower',
  MOVING: 'truck-outline',
  APPLIANCE: 'fridge-outline',
  REPAIR: 'wrench',
  BOOKING: 'calendar-check-outline',
};

const hasUserReviewed = (item, userId) => {
  if (!userId) return false;
  return (item.rawJob?.reviews || []).some((review) => review.reviewerId === userId);
};

const MyJobsScreen = ({ navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { transactions, notificationCount, myTasksList, myBookingsList } = useAppContext();
  const { on } = useSocket();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [jobs, setJobs] = useState(myTasksList || []);
  const [bookings, setBookings] = useState(myBookingsList || []);
  const [activeTab, setActiveTab] = useState('All Jobs');
  const [loadingJobId, setLoadingJobId] = useState(null);

  const fetchMyJobs = useCallback(async () => {
    try {
      const [jobsRes, bookingsRes] = await Promise.allSettled([
        api.get('/jobs/my-jobs'),
        api.get('/bookings/mine?role=PROVIDER')
      ]);
      
      if (jobsRes.status === 'fulfilled') {
        setJobs(jobsRes.value.data?.data || []);
      }
      if (bookingsRes.status === 'fulfilled') {
        setBookings(bookingsRes.value.data?.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (myTasksList?.length) setJobs(myTasksList);
    if (myBookingsList?.length) setBookings(myBookingsList);
  }, [myTasksList, myBookingsList]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchMyJobs);
    fetchMyJobs();
    return unsub;
  }, [fetchMyJobs, navigation]);

  useEffect(() => {
    const off = on('booking:update', fetchMyJobs);
    return () => off?.();
  }, [fetchMyJobs, on]);

  const mappedJobs = jobs.map(job => {
    let statusVal = 'Active';
    if (job.status === 'COMPLETED') statusVal = 'Completed';
    else if (job.status === 'CANCELLED') statusVal = 'Cancelled';
    else if (job.status === 'SCHEDULED' || job.status === 'BOOKED' || (job.status === 'ASSIGNED' && job.scheduledTime)) statusVal = 'Booked';
    else if (job.assignmentStatus === 'PENDING' || job.status === 'PENDING') statusVal = 'Requests';
    return {
      id: job.id,
      title: job.title,
      status: statusVal,
      client: job.client?.fullName || t('common.client'),
      avatar: job.client?.avatar,
      time: job.scheduledTime ? new Date(job.scheduledTime).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US') : t('jobs.asap'),
      budget: Number(job.budgetMax || job.budget || 0),
      location: job.location || t('jobs.onSite'),
      description: job.description,
      category: job.category,
      image: job.photos?.[0] || job.image || null,
      updatedAt: job.updatedAt ? new Date(job.updatedAt).getTime() : 0,
      createdAt: job.createdAt ? new Date(job.createdAt).getTime() : 0,
      rawJob: job,
    };
  });
  const mappedBookings = bookings.map(booking => ({
    id: booking.id,
    title: booking.notes || t('jobs.scheduledServiceBooking'),
    status: booking.status === 'ACCEPTED' ? 'Booked' : booking.status === 'COMPLETED' ? 'Completed' : booking.status === 'REJECTED' || booking.status === 'CANCELLED' ? 'Cancelled' : booking.status === 'IN_PROGRESS' ? 'Active' : 'Requests',
    client: booking.client?.fullName || t('common.client'),
    avatar: booking.client?.avatar,
    time: `${new Date(booking.bookingDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')} ${booking.bookingTime}`,
    budget: Number(booking.budget || 0),
    location: booking.location || t('jobs.onSite'),
    description: booking.notes,
    category: 'booking',
    image: booking.image || null,
    updatedAt: booking.updatedAt ? new Date(booking.updatedAt).getTime() : 0,
    createdAt: booking.createdAt ? new Date(booking.createdAt).getTime() : 0,
    rawJob: booking,
    isBooking: true,
  }));
  const statusWeight = {
    'Requests': 1,
    'Booked': 2,
    'Active': 3,
    'Completed': 4,
    'Cancelled': 5
  };
  const mapped = [...mappedBookings, ...mappedJobs].sort((a, b) => {
    const weightA = statusWeight[a.status] || 99;
    const weightB = statusWeight[b.status] || 99;
    if (weightA !== weightB) return weightA - weightB;
    return b.createdAt - a.createdAt;
  });

  const totalJobs = mapped.length;
  const bookedCount = mapped.filter(j => j.status === 'Booked').length;
  const inProgress = mapped.filter(j => j.status === 'Active').length;
  const completed = mapped.filter(j => j.status === 'Completed').length;
  const totalEarned = mapped.filter(j => j.status === 'Completed').reduce((s, j) => s + j.budget, 0);
  const liveEarned = totalEarned > 0 ? totalEarned : transactions
    .filter(t => ['CREDIT', 'EARNING'].includes(t.type?.toUpperCase()))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const filtered = activeTab === 'All Jobs' ? mapped : mapped.filter(j => j.status === activeTab);

  const handleUpdateStatus = async (jobId, status, isBooking = false) => {
    setLoadingJobId(jobId);
    try {
      if (isBooking) {
        await api.patch(`/bookings/${jobId}/status`, { status });
      } else {
        await api.put(`/jobs/${jobId}/status`, { status });
      }
      await fetchMyJobs();
    } catch {
      alert(t('jobs.updateFailed'));
    } finally {
      setLoadingJobId(null);
    }
  };

  const StatCard = ({ icon, value, label, sub, color, bg }) => {
    // Use a dark-mode-aware icon background
    const iconBg = isDarkMode ? 'rgba(255,255,255,0.08)' : (bg || '#F0FDFA');
    return (
      <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
        <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color || colors.accent} />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        {sub && <Text style={[styles.statSub, { color: color || colors.accent }]}>{sub}</Text>}
      </View>
    );
  };

  const renderJob = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Requests;
    const statusLabel = t(`jobs.statusLabels.${item.status}`);
    const darkBg = isDarkMode ? 'rgba(255,255,255,0.06)' : cfg.bg;
    const canChat = ['Booked', 'Active'].includes(item.status);
    const reviewed = hasUserReviewed(item, user?.id);
    return (
      <View style={[styles.jobCard, { backgroundColor: colors.card, borderBottomColor: colors.border, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('TaskDetails', { task: item.rawJob, isBooking: item.isBooking })}
          activeOpacity={0.85}
        >
          <View style={styles.jobRow}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.jobImg} />
            ) : (
              <View style={[styles.jobImgFallback, { backgroundColor: isDarkMode ? 'rgba(13,148,136,0.16)' : '#E6FDF3' }]}>
                <MaterialCommunityIcons
                  name={CATEGORY_ICONS[String(item.category || '').toUpperCase()] || 'briefcase-outline'}
                  size={42}
                  color={colors.accent}
                />
              </View>
            )}
            <View style={styles.jobContent}>
              <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{item.location}</Text>
              </View>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.time}</Text>
              </View>
              <View style={styles.jobFooter}>
                <View style={[styles.budgetBox, { backgroundColor: isDarkMode ? 'rgba(13,148,136,0.15)' : '#F0FDFA' }]}>
                  <Text style={[styles.budgetText, { color: colors.accent }]}>
                    {item.budget.toLocaleString()} FCFA
                  </Text>
                  <Text style={[styles.estimatedText, { color: colors.textSecondary }]}>{t('jobs.estimated')}</Text>
                </View>
                <View>
                  <View style={[styles.statusBadge, { backgroundColor: darkBg }]}>
                    <MaterialCommunityIcons name={cfg.icon} size={11} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{statusLabel}</Text>
                  </View>
                  <Text style={[styles.statusSub, { color: colors.textSecondary }]}>{item.time}</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
          {canChat ? (
            <TouchableOpacity
              style={[styles.chatBtn, { borderColor: colors.border }]}
                onPress={() => navigation.navigate('Chat', {
                receiverId: item.isBooking ? item.rawJob.clientId : item.rawJob.clientId,
                userName: item.client,
                avatar: item.avatar,
                task: item.rawJob,
              })}
            >
              <MaterialCommunityIcons name="message-text-outline" size={16} color={colors.accent} />
              <Text style={[styles.chatBtnText, { color: colors.accent }]}>{t('tabs.messages')}</Text>
            </TouchableOpacity>
          ) : null}

          {item.status === 'Requests' && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={() => item.isBooking ? handleUpdateStatus(item.rawJob.id, 'ACCEPTED', true) : navigation.navigate('TaskDetails', { task: item.rawJob })}
              disabled={loadingJobId === item.id}
            >
              {loadingJobId === item.id ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryBtnText}>{item.isBooking ? t('jobs.accept') : t('jobs.review')}</Text>}
            </TouchableOpacity>
          )}
          {item.status === 'Booked' && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={() => Alert.alert(t('jobs.startJob'), t('jobs.startJobBody'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('jobs.start'), onPress: () => handleUpdateStatus(item.rawJob.id, 'IN_PROGRESS', item.isBooking) },
              ])}
              disabled={loadingJobId === item.rawJob.id}
            >
              {loadingJobId === item.rawJob.id ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryBtnText}>{t('jobs.startJob')}</Text>}
            </TouchableOpacity>
          )}
          {item.status === 'Active' && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: '#22C55E' }]}
              onPress={() => Alert.alert(t('jobs.markComplete'), t('jobs.markCompleteBody'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('jobs.complete'), onPress: () => handleUpdateStatus(item.rawJob.id, 'COMPLETED', item.isBooking) },
              ])}
              disabled={loadingJobId === item.rawJob.id}
            >
              {loadingJobId === item.rawJob.id ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryBtnText}>{t('jobs.markCompleted')}</Text>}
            </TouchableOpacity>
          )}
          {item.status === 'Completed' && !reviewed && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={() => navigation.navigate('ReviewTask', { task: item.rawJob, provider: { id: item.rawJob.clientId, fullName: item.client } })}
            >
              <MaterialCommunityIcons name="star-outline" size={13} color="#FFF" />
              <Text style={styles.primaryBtnText}>{t('jobs.rateClient')}</Text>
            </TouchableOpacity>
          )}
          {item.status === 'Completed' && reviewed && (
            <View style={[styles.reviewedPill, { backgroundColor: isDarkMode ? 'rgba(34,197,94,0.14)' : '#F0FDF4' }]}>
              <MaterialCommunityIcons name="star-check" size={14} color="#16A34A" />
              <Text style={styles.reviewedText}>{t('jobs.reviewSubmitted', 'Review submitted')}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      

      {/* Header Top Row */}
      <View style={styles.headerTop}>
        {/* Hamburger circular menu */}
        <TouchableOpacity style={[styles.menuBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.openDrawer()}>
          <MaterialCommunityIcons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Title Area */}
        <View style={styles.titleArea}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('jobs.myJobs')}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{t('jobs.manageJobsSubtitle')}</Text>
        </View>

      </View>

      {/* Stat Cards Grid (2-row grid for balance and breathing room) */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard icon="clipboard-check" value={totalJobs}    label={t('jobs.totalJobs')}    sub={t('jobs.allTime')}  color="#22C55E" bg="#E6FDF3" />
          <StatCard icon="calendar-clock"  value={bookedCount}   label={t('jobs.statusLabels.Booked')}        sub={t('jobs.scheduled')} color="#8B5CF6" bg="#F5F3FF" />
          <StatCard icon="clock"           value={inProgress}   label={t('jobs.statusLabels.Active')}  sub={t('jobs.activeNow')} color="#2563EB" bg="#EFF6FF" />
        </View>
        <View style={[styles.statsRow, { marginTop: 8 }]}>
          <StatCard icon="check-decagram"  value={completed}    label={t('jobs.statusLabels.Completed')}    sub={t('jobs.allTime')}  color="#F59E0B" bg="#FFFBEB" />
          <StatCard icon="wallet"          value={liveEarned.toLocaleString()} label={t('home.totalEarnings')} sub="FCFA" color="#0D9488" bg="#E6FDF3" />
        </View>
      </View>

      {/* Tabs Row */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            if (active) {
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabActive, { backgroundColor: isDarkMode ? 'rgba(13,148,136,0.15)' : '#E6FDF3' }]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <View style={styles.tabContent}>
                    <MaterialCommunityIcons name={tab.icon} size={14} color="#0D9488" />
                    <Text style={styles.tabTextActive}>{t(`jobs.tabs.${tab.key}`)}</Text>
                  </View>
                  <View style={styles.tabIndicator} />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setActiveTab(tab.key)}
              >
                <View style={styles.tabContent}>
                  <MaterialCommunityIcons name={tab.icon} size={14} color={colors.textSecondary} />
                  <Text style={[styles.tabText, { color: colors.textSecondary }]}>{t(`jobs.tabs.${tab.key}`)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderJob}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('jobs.noJobsFoundShort')}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t('jobs.jobsAppearAssigned')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  titleArea: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: { fontSize: 26, fontWeight: '900' },
  headerSub: { fontSize: 12, marginTop: 1, color: '#64748B' },

  // Stats
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 3,
    borderRadius: 14,
    padding: 8,
    justifyContent: 'space-between',
    height: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 0.5,
  },
  statIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 16, fontWeight: '900', marginTop: 8 },
  statLabel: { fontSize: 8.5, fontWeight: '800', marginTop: 1 },
  statSub: { fontSize: 8, fontWeight: '700', marginTop: 1 },

  // Tabs
  tabsContainer: {
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  tabsScroll: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabActive: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    position: 'relative',
  },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabText: { fontSize: 11, fontWeight: '700' },
  tabTextActive: { fontSize: 11, fontWeight: '900', color: '#0D9488' },
  tabIndicator: {
    position: 'absolute',
    bottom: -8,
    left: '30%',
    right: '30%',
    height: 2,
    backgroundColor: '#0D9488',
    borderRadius: 1,
  },

  // Jobs
  listContent: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 110 },
  jobCard: { borderRadius: 0, marginBottom: 0, overflow: 'hidden', shadowOpacity: 0, shadowRadius: 0, elevation: 0, borderBottomWidth: 1 },
  jobRow: { flexDirection: 'row' },
  jobImg: { width: 110, height: 130 },
  jobImgFallback: { width: 110, height: 130, alignItems: 'center', justifyContent: 'center' },
  jobContent: { flex: 1, padding: 12 },
  jobTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  metaText: { fontSize: 12, flex: 1 },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  budgetBox: { borderRadius: 0, padding: 6, alignItems: 'center' },
  budgetText: { fontSize: 13, fontWeight: '800' },
  estimatedText: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 0 },
  statusText: { fontSize: 10, fontWeight: '800' },
  statusSub: { fontSize: 10, textAlign: 'right', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1 },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 0, borderWidth: 1.5 },
  chatBtnText: { fontSize: 13, fontWeight: '700' },
  primaryBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 38, borderRadius: 0 },
  primaryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  reviewedPill: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 38, borderRadius: 0 },
  reviewedText: { color: '#16A34A', fontSize: 13, fontWeight: '800' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14 },
});

export default MyJobsScreen;
