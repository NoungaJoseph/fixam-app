import React, { useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api, { getMediaUrl } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { translateStatus } from '../../i18n/translate';
import UserAvatar from '../../components/UserAvatar';

const JobStatusScreen = ({ route, navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [job, setJob] = useState(route.params?.job || {});

  const normalizedStatus = String(job.status || 'PENDING').toUpperCase();
  const displayStatus = translateStatus(normalizedStatus);
  const isBooking = Boolean(route.params?.isBooking || job?.isBooking || job?.bookingDate);
  const selectedAssignment = job.assignments?.find((assignment) => assignment.id === job.selectedAssignmentId) || job.assignments?.find((assignment) => assignment.status === 'ACCEPTED');
  const assignedProviderUser = job.provider || selectedAssignment?.provider?.user;
  const assignedProvider = assignedProviderUser ? {
    name: assignedProviderUser.fullName || assignedProviderUser.name || t('jobs.assignedProfessional'),
    id: assignedProviderUser.id,
    avatar: getMediaUrl(assignedProviderUser.avatar || assignedProviderUser.image),
  } : null;
  const steps = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
  const currentStep = Math.max(0, steps.indexOf(normalizedStatus));
  const hasLocationCoords = job.latitude != null && job.longitude != null;
  const canViewLocation = Boolean(job.selectedAssignmentId && hasLocationCoords);

  React.useEffect(() => {
    if (!route.params?.job?.id) return;
    if (route.params?.isBooking || route.params?.job?.isBooking) return;

    let isMounted = true;
    api.get(`/jobs/${route.params.job.id}`)
      .then((res) => {
        if (isMounted && res.data?.data) setJob(res.data.data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [route.params?.job?.id]);


  const chooseProvider = (assignment) => {
    const provider = getProviderFromAssignment(assignment);
    const providerName = provider?.user?.fullName || provider?.user?.name || t('jobs.thisProvider');
    Alert.alert(
      t('jobs.chooseProviderQuestion'),
      t('jobs.chooseProviderBody', { name: providerName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              const res = await api.post(`/jobs/${job.id}/applications/${assignment.id}/select`);
              setJob(res.data.data);
              Alert.alert(t('jobs.providerSelected'), t('jobs.providerSelectedBody', { name: providerName }), [
                { text: t('common.close') },
                { text: t('jobs.trackProvider'), onPress: () => navigation.navigate('LiveTaskMap', { task: res.data.data }) }
              ]);
            } catch (error) {
              Alert.alert(t('jobs.couldNotChooseProvider'), error.response?.data?.message || t('common.tryAgain'));
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      

      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('jobs.jobTracking')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.jobHero}>
            <View style={[styles.idBadge, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : colors.accentSoft }]}>
              <Text style={[styles.idText, { color: colors.accent, fontWeight: '800' }]}>#{job.id?.slice(-6) || t('jobs.task')}</Text>
            </View>
            <Text style={[styles.jobTitle, { color: colors.text }]}>{isBooking ? (job.notes || t('jobs.scheduledServiceBooking')) : (job.title || t('jobs.taskDetails'))}</Text>
            <View style={[styles.statusChip, { backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.1)' : '#EFF6FF' }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.statusChipText, { color: colors.accent }]}>{displayStatus}</Text>
            </View>
          </View>

          <View style={styles.trackerContainer}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('jobs.serviceProgress')}</Text>
            <View style={styles.tracker}>
              {steps.map((step, i) => (
                <React.Fragment key={step}>
                  <View style={styles.stepContainer}>
                    <View style={[styles.stepDot, { backgroundColor: i <= currentStep ? colors.accent : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6'), borderColor: i <= currentStep ? colors.accent : colors.border }]}>
                      {i < currentStep ? <MaterialCommunityIcons name="check" size={16} color="#FFF" /> : <View style={[styles.innerDot, { backgroundColor: i === currentStep ? colors.card : colors.placeholder }]} />}
                    </View>
                    <Text style={[styles.stepText, { color: i <= currentStep ? colors.text : colors.textSecondary, fontWeight: i <= currentStep ? '800' : '600' }]}>{translateStatus(step)}</Text>
                  </View>
                  {i < steps.length - 1 && <View style={[styles.stepLine, { backgroundColor: i < currentStep ? colors.accent : (isDarkMode ? 'rgba(255,255,255,0.05)' : colors.border) }]} />}
                </React.Fragment>
              ))}
            </View>
          </View>

          {job.assignments?.length > 0 && normalizedStatus === 'PENDING' && (
            <View style={styles.applicationsSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('jobs.applicationsCount', { count: job.assignments.length })}</Text>
              {job.assignments.map((assignment) => {
                const provider = getProviderFromAssignment(assignment);
                const providerUser = provider?.user || {};
                return (
                  <View key={assignment.id} style={[styles.applicationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity 
                      style={styles.applicationInfoRow}
                      onPress={() => navigation.navigate('ProviderProfile', { provider })}
                    >
                      <UserAvatar uri={providerUser.avatar} name={providerUser.fullName || t('common.provider')} size={56} radius={8} style={styles.applicationAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.applicationName, { color: colors.text }]}>{providerUser.fullName || 'Provider'}</Text>
                        <View style={styles.ratingRow}>
                          <MaterialCommunityIcons name="star" size={14} color="#FBBF24" />
                          <Text style={[styles.applicationMeta, { color: colors.textSecondary }]}>
                            {t('jobs.ratingValue', { rating: Number(provider?.rating || 0).toFixed(1) })}
                          </Text>
                          {provider?.jobsCompleted !== undefined && (
                            <>
                              <Text style={{ color: colors.textSecondary, marginHorizontal: 4 }}>•</Text>
                              <MaterialCommunityIcons name="briefcase-outline" size={14} color={colors.textSecondary} style={{ marginRight: 2 }} />
                              <Text style={[styles.applicationMeta, { color: colors.textSecondary }]}>
                                {provider.jobsCompleted}
                              </Text>
                            </>
                          )}
                        </View>
                        {provider?.rate ? (
                          <Text style={[styles.applicationMeta, { color: colors.accent, marginTop: 4, fontWeight: '800' }]}>
                            {Number(provider.rate).toLocaleString()} FCFA
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                    
                    <View style={styles.applicationActionRow}>
                      <TouchableOpacity style={[styles.outlineBtn, { borderColor: colors.border, flex: 1 }]} onPress={() => navigation.navigate('ProviderProfile', { provider })}>
                        <Text style={[styles.outlineBtnText, { color: colors.text }]}>{t('profile.viewProfile')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.solidBtn, { backgroundColor: colors.accent, flex: 1.5 }]} onPress={() => chooseProvider(assignment)}>
                        <Text style={styles.solidBtnText}>{t('jobs.hireNow')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.detailsList}>
            <View style={[styles.detailItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.detailIconWrap, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : colors.accentSoft }]}>
                <MaterialCommunityIcons name="account-hard-hat" size={24} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('jobs.assignedProfessional')}</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{assignedProvider?.name || t('jobs.searchingProviders')}</Text>
              </View>
              {assignedProvider && (
                <TouchableOpacity
                  style={[styles.chatBtn, { backgroundColor: colors.accent }]}
                  onPress={() => navigation.navigate('Chat', { receiverId: assignedProvider.id, userName: assignedProvider.name, avatar: assignedProvider.avatar, task: job })}
                >
                  <MaterialCommunityIcons name="message-text" size={22} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>

            <Detail icon="map-marker-radius" label={t('jobs.location')} value={job.location || t('jobs.onSite')} colors={colors} isDarkMode={isDarkMode} />
            <Detail icon="calendar-clock" label={t('jobs.scheduled')} value={isBooking ? `${new Date(job.bookingDate).toLocaleDateString()} ${job.bookingTime}` : (job.scheduledTime ? new Date(job.scheduledTime).toLocaleString() : t('jobs.asap'))} colors={colors} isDarkMode={isDarkMode} />
            <Detail icon="text-box-outline" label={t('jobs.description')} value={(isBooking ? job.notes : job.description) || t('jobs.noAdditionalDetails')} colors={colors} isDarkMode={isDarkMode} />
          </View>

          <View style={[styles.costCard, { backgroundColor: colors.accent }]}>
            <Text style={styles.costLabel}>{t('jobs.totalEstimatedBudget')}</Text>
            <Text style={styles.costValue}>{Number(job.budget || 0).toLocaleString()} XAF</Text>
          </View>

          <View style={styles.actions}>
            {canViewLocation && (
              <TouchableOpacity style={[styles.secondaryActionBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => navigation.navigate('LiveTaskMap', { task: job })}>
                <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.accent} />
                <Text style={[styles.secondaryActionText, { color: colors.text }]}>{t('jobs.viewLocation')}</Text>
              </TouchableOpacity>
            )}

            {user?.role === 'CLIENT' && assignedProvider && normalizedStatus !== 'COMPLETED' && (
              <TouchableOpacity
                style={[styles.mainActionBtn, { backgroundColor: colors.success }]}
                onPress={() => Alert.alert(
                  t('jobs.markCompleted'),
                  t('jobs.completeAndFinalizeBody'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                      text: t('jobs.completeAndRate'),
                      onPress: async () => {
                        try {
                          const endpoint = isBooking ? `/bookings/${job.id}/status` : `/jobs/${job.id}/status`;
                          await api.put(endpoint, { status: 'COMPLETED' });
                          navigation.navigate('Rating', {
                            jobId: job.id,
                            targetUser: assignedProviderUser,
                            mode: 'rate_provider',
                          });
                        } catch (err) {
                          Alert.alert(t('common.error'), err.response?.data?.message || t('jobs.updateFailedClient'));
                        }
                      }
                    }
                  ]
                )}
              >
                <MaterialCommunityIcons name="check-decagram" size={22} color="#FFF" />
                <Text style={styles.mainActionText}>{t('jobs.markCompletedAndRate')}</Text>
              </TouchableOpacity>
            )}

            {job.status === 'PENDING' && (
              <TouchableOpacity 
                style={[styles.cancelBtn, { borderColor: colors.error }]}
                onPress={() => {
                  Alert.alert(
                    t('jobs.cancelTaskRequest'),
                    t('jobs.cancelConfirm', 'Are you sure you want to cancel? Your coins will be refunded.'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('common.yes', 'Yes'),
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const endpoint = isBooking ? `/bookings/${job.id}/status` : `/jobs/${job.id}/status`;
                            await api.patch(endpoint, { status: 'CANCELLED' });
                            setJob({ ...job, status: 'CANCELLED' });
                            Alert.alert(t('common.success'), t('jobs.cancelledSuccess', 'Task cancelled successfully.'));
                          } catch (err) {
                            Alert.alert(t('common.error'), err.response?.data?.message || t('jobs.updateFailedClient'));
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={[styles.cancelBtnText, { color: colors.error }]}>{t('jobs.cancelTaskRequest')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const Detail = ({ icon, label, value, colors, isDarkMode }) => (
  <View style={[styles.detailItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.detailIconWrap, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : colors.accentSoft }]}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.accent} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { paddingBottom: 60 },
  jobHero: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 25 },
  idBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, marginBottom: 15 },
  idText: { fontSize: 12, textTransform: 'uppercase' },
  jobTitle: { fontSize: 28, fontWeight: '900', marginBottom: 20, textAlign: 'center', lineHeight: 36 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusChipText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  trackerContainer: { paddingHorizontal: 25, marginBottom: 40 },
  sectionLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 25, letterSpacing: 1 },
  tracker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepContainer: { alignItems: 'center', width: 70 },
  stepDot: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  innerDot: { width: 10, height: 10, borderRadius: 5 },
  stepLine: { flex: 1, height: 3, marginHorizontal: -15, marginBottom: 22 },
  stepText: { fontSize: 11, marginTop: 10, textAlign: 'center' },
  detailsList: { paddingHorizontal: 25, marginBottom: 35 },
  applicationsSection: { paddingHorizontal: 25, marginBottom: 35 },
  applicationCard: { padding: 20, borderRadius: 8, borderWidth: 1.5, marginBottom: 15 },
  applicationInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  applicationAvatar: { width: 56, height: 56, borderRadius: 8 },
  applicationName: { fontSize: 17, fontWeight: '900' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  applicationMeta: { fontSize: 13, fontWeight: '700' },
  applicationActionRow: { flexDirection: 'row', gap: 12 },
  outlineBtn: { height: 48, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  outlineBtnText: { fontSize: 14, fontWeight: '800' },
  solidBtn: { height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  solidBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  detailItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 8, marginBottom: 15, gap: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0)' },
  detailIconWrap: { width: 50, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  detailLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  detailValue: { fontSize: 15, fontWeight: '700', marginTop: 4, lineHeight: 22 },
  chatBtn: { width: 50, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  costCard: { marginHorizontal: 25, padding: 30, borderRadius: 8, alignItems: 'center', marginBottom: 40, elevation: 8, shadowOpacity: 0.3, shadowRadius: 15 },
  costLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' },
  costValue: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  actions: { paddingHorizontal: 25, gap: 15 },
  mainActionBtn: { height: 60, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 12, elevation: 4 },
  mainActionText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  secondaryActionBtn: { height: 60, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 12, borderWidth: 1 },
  secondaryActionText: { fontSize: 16, fontWeight: '800' },
  cancelBtn: { height: 60, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  cancelBtnText: { fontSize: 16, fontWeight: '800' },
});

export default JobStatusScreen;
