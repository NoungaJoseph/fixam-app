import React, { useState, useEffect, useCallback } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, Alert, ActivityIndicator, TextInput, Modal, TouchableWithoutFeedback, Keyboard, Linking, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getCurrencyForUser } from '../../constants/countries';
import api, { getMediaUrl } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { translateStatus } from '../../i18n/translate';
import UserAvatar from '../../components/UserAvatar';
import { useAppContext } from '../../context/AppContext';
import { translateApiError } from '../../utils/eligibilityMessages';
import MaterialsListDisplay from '../../components/MaterialsListDisplay';
import DisputeModal from '../../components/DisputeModal';
import DisputeDetailsCard from '../../components/DisputeDetailsCard';
import ServiceAgreementCard from '../../components/ServiceAgreementCard';

const getProviderFromAssignment = (assignment) => {
  if (!assignment) return null;
  if (assignment.provider?.user) return assignment.provider;
  if (assignment.provider) {
    return {
      ...assignment.provider,
      user: assignment.provider.user || assignment.provider,
    };
  }
  if (assignment.providerUser) {
    return { user: assignment.providerUser };
  }
  return null;
};

const JobStatusScreen = ({ route, navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { fetchAppData } = useAppContext();
  const incomingJob = route.params?.job || {};
  const currentJobId = incomingJob.id || route.params?.jobId || route.params?.id;
  const isBooking = Boolean(route.params?.isBooking || incomingJob.isBooking || incomingJob.bookingDate);

  const [job, setJob] = useState(incomingJob);
  const [hasReviewedLocally, setHasReviewedLocally] = useState(false);
  const [selectingAssignmentId, setSelectingAssignmentId] = useState(null);
  const [activeDispute, setActiveDispute] = useState(incomingJob.disputes?.[0] || null);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState(null);

  const handleOpenAttachment = async (mediaUrl, isPdf) => {
    try {
      if (isPdf) {
        const canOpen = await Linking.canOpenURL(mediaUrl).catch(() => true);
        if (canOpen) {
          await Linking.openURL(mediaUrl);
        } else {
          Alert.alert(t('common.error'), t('jobs.cannotOpenFile', 'Unable to open file link.'));
        }
      } else {
        setPreviewImageUri(mediaUrl);
      }
    } catch (err) {
      console.error('Error opening attachment:', err);
      Linking.openURL(mediaUrl).catch(() => {
        Alert.alert(t('common.error'), t('jobs.cannotOpenFile', 'Unable to open file link.'));
      });
    }
  };

  // Sync state whenever the active job ID or incoming job changes
  useEffect(() => {
    if (incomingJob && incomingJob.id) {
      setJob(incomingJob);
      setHasReviewedLocally(false);
      setActiveDispute(incomingJob.disputes?.[0] || null);
    }

    if (currentJobId && !isBooking) {
      api.get(`/jobs/${currentJobId}`)
        .then((res) => {
          if (res.data?.data) {
            setJob(res.data.data);
            if (res.data.data.disputes?.[0]) {
              setActiveDispute(res.data.data.disputes[0]);
            }
          }
        })
        .catch((err) => console.log('[JobStatusScreen] Could not fetch fresh job details:', err?.message));
    }
  }, [currentJobId, isBooking]);

  const normalizedStatus = String(job.status || 'PENDING').toUpperCase();
  const displayStatus = translateStatus(normalizedStatus);

  const isReviewed = hasReviewedLocally ||
    job.isReviewed ||
    job.hasReviewed ||
    Boolean(Array.isArray(job.reviews) && job.reviews.some(r => (r.reviewerId && r.reviewerId === user?.id) || (r.userId && r.userId === user?.id)));

  useEffect(() => {
    if (currentJobId) {
      const endpoint = isBooking ? `/disputes?bookingId=${currentJobId}` : `/disputes?jobId=${currentJobId}`;
      api.get(endpoint)
        .then(res => {
          if (res.data?.data && res.data.data.length > 0) {
            setActiveDispute(res.data.data[0]);
          }
        })
        .catch(() => {});
    }
  }, [currentJobId, isBooking]);
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

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const updateStatus = async (nextStatus) => {
    try {
      setUpdatingStatus(true);
      const endpoint = isBooking ? `/bookings/${job.id}/status` : `/jobs/${job.id}/status`;
      const res = isBooking
        ? await api.patch(endpoint, { status: nextStatus })
        : await api.put(endpoint, { status: nextStatus });
        
      if (res.data?.data) {
        setJob(res.data.data);
      } else {
        setJob(prev => ({ ...prev, status: nextStatus }));
      }
      await fetchAppData?.(true);
      
      if (nextStatus === 'ACCEPTED') {
        Alert.alert(t('common.success'), t('booking.bookings.counterAcceptedSuccess', 'Counter offer accepted successfully.'));
      } else if (nextStatus === 'REJECTED' || nextStatus === 'CANCELLED') {
        Alert.alert(t('common.success'), t('booking.bookings.bookingCancelledSuccess', 'Booking request cancelled.'));
      }
    } catch (err) {
      Alert.alert(t('common.error'), translateApiError(err, t, 'jobs.updateFailedClient'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRespondMaterials = async (action) => {
    try {
      setUpdatingStatus(true);
      const endpoint = isBooking ? `/bookings/${job.id}/materials/respond` : `/jobs/${job.id}/materials/respond`;
      const res = await api.post(endpoint, { action });
      if (res.data?.data) {
        setJob(res.data.data);
      }
      Alert.alert(t('common.success'), action === 'ACCEPT' ? 'Materials list accepted!' : 'Materials proposal rejected.');
      await fetchAppData?.(true);
    } catch (err) {
      Alert.alert(t('common.error'), translateApiError(err, t));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [counterBudget, setCounterBudget] = useState('');
  const [counterNotes, setCounterNotes] = useState('');

  const handleOpenProviderCounterModal = () => {
    setCounterBudget(String(job.budget || ''));
    setCounterNotes('');
    setCounterModalVisible(true);
  };

  const submitCounterOffer = async () => {
    if (!counterBudget || isNaN(Number(counterBudget)) || Number(counterBudget) <= 0) {
      Alert.alert(t('common.error'), t('jobs.invalidBudget', 'Please enter a valid budget greater than 0'));
      return;
    }
    try {
      setUpdatingStatus(true);
      const res = await api.post(`/bookings/${job.id}/counter`, {
        counterBudget: Number(counterBudget),
        counterNotes: counterNotes
      });
      setCounterModalVisible(false);
      if (res.data?.data) {
        setJob(res.data.data);
      }
      Alert.alert(t('common.success'), t('booking.bookings.counterOfferSent', 'Counter-offer sent successfully.'));
      await fetchAppData?.(true);
    } catch (error) {
      Alert.alert(t('common.error'), translateApiError(error, t, 'jobs.updateFailedClient'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const refreshJobDetails = useCallback(async () => {
    const targetId = currentJobId;
    if (!targetId) return;

    try {
      if (isBooking) {
        const res = await api.get(`/bookings/check?id=${targetId}`);
        if (res.data?.data) {
          setJob(res.data.data);
          const rList = res.data.data.reviews || [];
          if (res.data.data.isReviewed || res.data.data.hasReviewed || rList.some(r => r.reviewerId === user?.id || r.userId === user?.id)) {
            setHasReviewedLocally(true);
          }
        }
      } else {
        const res = await api.get(`/jobs/${targetId}`);
        if (res.data?.data) {
          setJob(res.data.data);
          const rList = res.data.data.reviews || [];
          if (res.data.data.isReviewed || res.data.data.hasReviewed || rList.some(r => r.reviewerId === user?.id || r.userId === user?.id)) {
            setHasReviewedLocally(true);
          }
        }
      }
    } catch (_) {}
  }, [currentJobId, isBooking, user?.id]);

  useFocusEffect(
    useCallback(() => {
      refreshJobDetails();
    }, [refreshJobDetails])
  );


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
            setSelectingAssignmentId(assignment.id);
            try {
              const res = await api.post(`/jobs/${job.id}/applications/${assignment.id}/select`);
              setJob(res.data.data);
              await fetchAppData?.(true);
              Alert.alert(t('jobs.providerSelected'), t('jobs.providerSelectedBody', { name: providerName }), [
                { text: t('common.close') }
              ]);
            } catch (error) {
              Alert.alert(t('jobs.couldNotChooseProvider'), translateApiError(error, t));
            } finally {
              setSelectingAssignmentId(null);
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
          {isBooking && ['URGENT', 'EMERGENCY'].includes(job.urgencyLevel) && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: job.urgencyLevel === 'EMERGENCY' ? (isDarkMode ? '#451A0320' : '#FEF2F2') : (isDarkMode ? '#451A0310' : '#FFF7ED'),
              borderBottomWidth: 1.5,
              borderColor: job.urgencyLevel === 'EMERGENCY' ? '#FEE2E2' : '#FFEDD5',
              paddingHorizontal: 20,
              paddingVertical: 14,
              gap: 12
            }}>
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: job.urgencyLevel === 'EMERGENCY' ? '#EF4444' : '#F97316',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <MaterialCommunityIcons
                  name={job.urgencyLevel === 'EMERGENCY' ? 'alert-decagram' : 'alert-circle'}
                  size={20}
                  color="#FFF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '900',
                  color: job.urgencyLevel === 'EMERGENCY' ? '#EF4444' : '#F97316',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  {job.urgencyLevel === 'EMERGENCY' ? t('bookings.emergencyUrgency', 'Emergency Request') : t('bookings.urgentUrgency', 'Urgent Request')}
                </Text>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.textSecondary,
                  marginTop: 2
                }}>
                  {job.urgencyLevel === 'EMERGENCY' 
                    ? t('bookings.emergencyBannerDesc', 'This is a high-priority emergency. Response required immediately.')
                    : t('bookings.urgentBannerDesc', 'This is a high-priority urgent request.')}
                </Text>
              </View>
            </View>
          )}

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

          <MaterialsListDisplay
            materialsList={job.materialsList}
            materialsStatus={job.materialsStatus}
            materialsVersion={job.materialsVersion}
            requiresDiagnosis={job.requiresDiagnosis}
            agreements={job.agreements || []}
            isClient={true}
            isProvider={false}
            onAcceptProposal={() => handleRespondMaterials('ACCEPT')}
            onRejectProposal={() => handleRespondMaterials('REJECT')}
          />

          {job.assignments?.length > 0 && normalizedStatus === 'PENDING' && (
            <View style={styles.applicationsSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('jobs.applicationsCount', { count: job.assignments.length })}</Text>
              {job.assignments.map((assignment) => {
                const provider = getProviderFromAssignment(assignment);
                const providerUser = provider?.user || {};
                return (
                  <TouchableOpacity
                    key={assignment.id}
                    style={[styles.proposalSummaryRow, { borderBottomColor: colors.border }]}
                    activeOpacity={0.6}
                    onPress={() => navigation.navigate('ProposalDetail', { assignment, provider, providerUser, job, chooseProvider })}
                  >
                    <UserAvatar uri={providerUser.avatar} name={providerUser.fullName || t('common.provider')} size={48} radius={24} />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.applicationName, { color: colors.text, fontSize: 15 }]}>{providerUser.fullName || 'Provider'}</Text>
                        {assignment.boostCoins > 0 && (
                          <View style={styles.boostBadge}>
                            <MaterialCommunityIcons name="rocket-launch" size={10} color="#0D9488" />
                          </View>
                        )}
                      </View>
                      <View style={[styles.ratingRow, { marginTop: 3 }]}>
                        <MaterialCommunityIcons name="star" size={13} color="#FBBF24" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                          {Number(provider?.rating || 0).toFixed(1)}
                        </Text>
                        {provider?.jobsCompleted !== undefined && (
                          <>
                            <Text style={{ color: colors.textSecondary, marginHorizontal: 3, fontSize: 10 }}>•</Text>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                              {provider.jobsCompleted} {t('jobs.jobsDone', 'jobs')}
                            </Text>
                          </>
                        )}
                      </View>
                      {Boolean(assignment.proposedBudget) && (
                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.accent, marginTop: 4 }}>
                          {Number(assignment.proposedBudget).toLocaleString()} {getCurrencyForUser(job.country || user?.country || 'Cameroon')}
                        </Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.detailsList}>
            <View style={[styles.flatDetailRow, { borderBottomColor: colors.border }]}>
              <MaterialCommunityIcons name="account-hard-hat" size={22} color={colors.accent} style={{ marginRight: 14, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.flatDetailLabel, { color: colors.textSecondary }]}>{t('jobs.assignedProfessional')}</Text>
                <Text style={[styles.flatDetailValue, { color: colors.text }]}>{assignedProvider?.name || t('jobs.searchingProviders')}</Text>
              </View>
              {assignedProvider && (
                <TouchableOpacity
                  style={[styles.chatBtn, { backgroundColor: colors.accent }]}
                  onPress={() => navigation.navigate('Chat', { receiverId: assignedProvider.id, userName: assignedProvider.name, avatar: assignedProvider.avatar, phone: assignedProviderUser?.phone || assignedProviderUser?.phoneNumber || '', task: job })}
                >
                  <MaterialCommunityIcons name="message-text" size={22} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>

            <Detail icon="map-marker-radius" label={t('jobs.location')} value={job.location || job.address || t('jobs.onSite')} colors={colors} isDarkMode={isDarkMode} />
            <Detail icon="calendar-clock" label={t('jobs.scheduled')} value={isBooking ? `${new Date(job.bookingDate).toLocaleDateString()} ${job.bookingTime || ''}` : (job.scheduledTime ? new Date(job.scheduledTime).toLocaleString() : t('jobs.asap'))} colors={colors} isDarkMode={isDarkMode} />
            {(job.bookingDuration || job.duration) ? (
              <Detail icon="timer-outline" label={t('jobs.duration', 'Duration')} value={job.bookingDuration || job.duration} colors={colors} isDarkMode={isDarkMode} />
            ) : null}
            {job.urgencyLevel ? (
              <Detail icon="alert-circle-outline" label={t('jobs.urgency', 'Urgency')} value={job.urgencyLevel} colors={colors} isDarkMode={isDarkMode} />
            ) : null}
            <Detail icon="text-box-outline" label={t('jobs.description')} value={(isBooking ? job.notes : job.description) || t('jobs.noAdditionalDetails')} colors={colors} isDarkMode={isDarkMode} />
            {job.importantDetails ? (
              <Detail icon="alert-decagram-outline" label={t('jobs.importantDetails')} value={job.importantDetails} colors={colors} isDarkMode={isDarkMode} />
            ) : null}
            {job.whatNeedsDone ? (
              <Detail icon="check-circle-outline" label={t('jobs.whatNeedsDone')} value={job.whatNeedsDone} colors={colors} isDarkMode={isDarkMode} />
            ) : null}
          </View>

          {user?.role === 'CLIENT' && isBooking && normalizedStatus === 'COUNTER_PROPOSED' && (
            <View style={[styles.counterCard, { backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.08)' : '#F5F3FF', borderColor: '#8B5CF6' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <MaterialCommunityIcons name="cash-multiple" size={24} color="#8B5CF6" />
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#8B5CF6' }}>
                  {t('booking.bookings.counterOfferReceived', 'Counter-Offer Received!')}
                </Text>
              </View>
              
              <Text style={[styles.counterValue, { color: colors.text }]}>
                {Number(job.counterBudget || 0).toLocaleString()} {getCurrencyForUser(job.country || user?.country || 'Cameroon')}
              </Text>

              {job.counterNotes ? (
                <Text style={[styles.counterNotes, { color: colors.textSecondary }]}>
                  "{job.counterNotes}"
                </Text>
              ) : null}

              <View style={styles.counterActionRow}>
                <TouchableOpacity
                  style={[styles.counterDeclineBtn, { borderColor: '#EF4444' }]}
                  onPress={() => updateStatus('REJECTED')}
                  disabled={updatingStatus}
                >
                  <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 13 }}>
                    {t('common.decline', 'Decline')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.counterAcceptBtn, { backgroundColor: '#8B5CF6' }]}
                  onPress={() => updateStatus('ACCEPTED')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13 }}>
                      {t('common.accept', 'Accept')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {user?.role === 'PROVIDER' && isBooking && normalizedStatus === 'COUNTER_PROPOSED' && (
            <View style={[styles.counterCard, { backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.08)' : '#F5F3FF', borderColor: '#8B5CF6' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <MaterialCommunityIcons name="cash-multiple" size={24} color="#8B5CF6" />
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#8B5CF6' }}>
                  {t('booking.bookings.yourProposedCounter', 'Your Proposed Counter:')}
                </Text>
              </View>
              
              <Text style={[styles.counterValue, { color: colors.text }]}>
                {Number(job.counterBudget || 0).toLocaleString()} {getCurrencyForUser(job.country || user?.country || 'Cameroon')}
              </Text>

              {job.counterNotes ? (
                <Text style={[styles.counterNotes, { color: colors.textSecondary }]}>
                  "{job.counterNotes}"
                </Text>
              ) : null}
              
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 10 }}>
                {t('booking.bookings.waitingForClient', 'Waiting for client to accept or decline...')}
              </Text>
            </View>
          )}

          {(() => {
            const hasNoBudget = !job.budget || job.budget === 0;
            const isUrgentOrEmergency = ['URGENT', 'EMERGENCY'].includes(job.urgencyLevel);
            const displayCost = (hasNoBudget && isUrgentOrEmergency)
              ? t('bookings.toBeQuoted', 'To be quoted')
              : `${Number(job.budget || 0).toLocaleString()} ${getCurrencyForUser(job.country || user?.country || 'Cameroon')}`;
            const cardBgColor = isUrgentOrEmergency 
              ? (job.urgencyLevel === 'EMERGENCY' ? '#EF4444' : '#F97316') 
              : colors.accent;
            return (
              <View style={[styles.costCard, { backgroundColor: cardBgColor }]}>
                <Text style={styles.costLabel}>{t('jobs.totalEstimatedBudget')}</Text>
                <Text style={styles.costValue}>{displayCost}</Text>
              </View>
            );
          })()}

          <View style={styles.actions}>
            {user?.role === 'CLIENT' && assignedProvider && ['ACCEPTED', 'IN_PROGRESS'].includes(normalizedStatus) && (
              <View style={{ gap: 8, width: '100%' }}>
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
                            await updateStatus('COMPLETED');
                            navigation.navigate('Rating', {
                              jobId: job.id,
                              targetUser: assignedProviderUser,
                              mode: 'rate_provider',
                              onReviewSuccess: () => {
                                setHasReviewedLocally(true);
                                refreshJobDetails();
                              }
                            });
                          } catch (err) {
                            // Handled by helper
                          }
                        }
                      }
                    ]
                  )}
                >
                  <MaterialCommunityIcons name="check-decagram" size={22} color="#FFF" />
                  <Text style={styles.mainActionText}>{t('bookings.acceptAndComplete', 'Accept & Complete')}</Text>
                </TouchableOpacity>

                {!activeDispute && (
                  <TouchableOpacity
                    style={[styles.secondaryActionBtn, { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]}
                    onPress={() => setDisputeModalVisible(true)}
                  >
                    <MaterialCommunityIcons name="alert-decagram-outline" size={20} color="#EF4444" />
                    <Text style={[styles.secondaryActionText, { color: '#EF4444', fontWeight: '700' }]}>
                      {t('bookings.reportProblem', 'Report a Problem')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {(Boolean(job.serviceAgreement || (job.serviceAgreements && job.serviceAgreements[0]) || (job.agreements && job.agreements[0])) || ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(normalizedStatus)) && (
              <ServiceAgreementCard
                agreement={job.serviceAgreement || (job.serviceAgreements && job.serviceAgreements[0]) || (job.agreements && job.agreements[0])}
                booking={job}
                isClient={user?.role === 'CLIENT'}
                isProvider={user?.role === 'PROVIDER'}
                onRefresh={async () => {
                  try {
                    const res = await api.get(`/bookings/${job.id}`);
                    if (res.data?.data) setJob(res.data.data);
                  } catch (_) {}
                }}
              />
            )}

            {Boolean(activeDispute) && (
              <DisputeDetailsCard
                dispute={activeDispute}
                isClient={user?.role === 'CLIENT'}
                isProvider={user?.role === 'PROVIDER'}
                onRefresh={async () => {
                  try {
                    const res = await api.get(`/disputes/${activeDispute.id}`);
                    if (res.data?.data) setActiveDispute(res.data.data);
                  } catch (_) {}
                }}
              />
            )}

            <DisputeModal
              visible={disputeModalVisible}
              onClose={() => setDisputeModalVisible(false)}
              bookingId={job.id}
              onSuccess={(newDispute) => {
                setActiveDispute(newDispute);
              }}
            />

            {user?.role === 'CLIENT' && job.status === 'PENDING' && (
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
                            await updateStatus('CANCELLED');
                          } catch (err) {
                            // Handled by helper
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

            {user?.role === 'CLIENT' && normalizedStatus === 'COMPLETED' && (
              !isReviewed ? (
                <TouchableOpacity
                  style={[styles.mainActionBtn, { backgroundColor: '#F59E0B' }]}
                  onPress={() => {
                    navigation.navigate('Rating', {
                      jobId: job.id,
                      targetUser: assignedProviderUser || job.provider,
                      mode: 'rate_provider',
                      onReviewSuccess: () => {
                        setHasReviewedLocally(true);
                        refreshJobDetails();
                      }
                    });
                  }}
                >
                  <MaterialCommunityIcons name="star-outline" size={22} color="#FFF" />
                  <Text style={styles.mainActionText}>{t('reviews.leaveReview', 'Leave a Review')}</Text>
                </TouchableOpacity>
              ) : (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDarkMode ? '#064E3B20' : '#ECFDF5',
                  borderWidth: 1.5,
                  borderColor: '#10B981',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  gap: 10,
                  width: '100%',
                  marginTop: 6
                }}>
                  <MaterialCommunityIcons name="star-check" size={24} color="#10B981" />
                  <Text style={{
                    color: '#10B981',
                    fontSize: 15,
                    fontWeight: '800'
                  }}>
                    {t('reviews.reviewSubmittedBadge', 'Review submitted successfully ⭐')}
                  </Text>
                </View>
              )
            )}

            {user?.role === 'PROVIDER' && isBooking && normalizedStatus === 'PENDING' && (
              <View style={{ flexDirection: 'row', width: '100%', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: '#EF4444', flex: 1 }]}
                  disabled={updatingStatus}
                  onPress={() => Alert.alert(
                    t('jobs.reject'),
                    t('jobs.rejectConfirm', 'Are you sure you want to decline this booking request?'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      { text: t('jobs.reject'), onPress: () => updateStatus('REJECTED'), style: 'destructive' }
                    ]
                  )}
                >
                  <Text style={[styles.cancelBtnText, { color: '#EF4444' }]}>{t('jobs.reject')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: '#8B5CF6', flex: 1 }]}
                  disabled={updatingStatus}
                  onPress={handleOpenProviderCounterModal}
                >
                  <Text style={[styles.cancelBtnText, { color: '#8B5CF6' }]}>{t('booking.bookings.counter', 'Counter')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mainActionBtn, { backgroundColor: colors.accent, flex: 1.5 }]}
                  disabled={updatingStatus}
                  onPress={() => updateStatus('ACCEPTED')}
                >
                  {updatingStatus ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.mainActionText}>{t('jobs.accept')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={counterModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCounterModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t('booking.bookings.proposeCounter', 'Propose Counter-Offer')}</Text>
                  <TouchableOpacity onPress={() => setCounterModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('booking.bookings.proposedBudget', 'Proposed Budget')}</Text>
                  <View style={[styles.modalInputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <MaterialCommunityIcons name="cash" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.modalTextInput, { color: colors.text }]}
                      keyboardType="numeric"
                      value={counterBudget}
                      onChangeText={setCounterBudget}
                      placeholder="e.g. 15000"
                      placeholderTextColor={colors.placeholder}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>{t('booking.bookings.explanation', 'Message / Explanation')}</Text>
                  <View style={[styles.modalInputContainer, { borderColor: colors.border, backgroundColor: colors.background, height: 'auto', minHeight: 90, alignItems: 'flex-start', paddingTop: 8, marginBottom: 24 }]}>
                    <TextInput
                      style={[styles.modalTextInput, { color: colors.text, height: '100%', textAlignVertical: 'top' }]}
                      multiline
                      numberOfLines={3}
                      value={counterNotes}
                      onChangeText={setCounterNotes}
                      placeholder={t('booking.bookings.counterNotesPlaceholder', 'Why are you countering? (e.g. materials needed)')}
                      placeholderTextColor={colors.placeholder}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: colors.border }]} onPress={() => setCounterModalVisible(false)}>
                    <Text style={[styles.modalCancelBtnText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
                    onPress={submitCounterOffer}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.modalSubmitBtnText}>{t('common.submit', 'Submit')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Fullscreen Photo Preview Modal */}
      <Modal visible={Boolean(previewImageUri)} transparent animationType="fade" onRequestClose={() => setPreviewImageUri(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setPreviewImageUri(null)}
          >
            <MaterialCommunityIcons name="close" size={26} color="#FFF" />
          </TouchableOpacity>
          {previewImageUri && (
            <Image
              source={{ uri: previewImageUri }}
              style={{ width: '100%', height: '80%', resizeMode: 'contain' }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const Detail = ({ icon, label, value, colors, isDarkMode }) => (
  <View style={[styles.flatDetailRow, { borderBottomColor: colors.border }]}>
    <MaterialCommunityIcons name={icon} size={22} color={colors.accent} style={{ marginRight: 14, marginTop: 2 }} />
    <View style={{ flex: 1 }}>
      <Text style={[styles.flatDetailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.flatDetailValue, { color: colors.text }]}>{value}</Text>
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
  proposalSummaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  applicationName: { fontSize: 17, fontWeight: '900' },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  flatDetailRow: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1 },
  flatDetailLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  flatDetailValue: { fontSize: 15, fontWeight: '700', marginTop: 5, lineHeight: 23 },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '90%', maxWidth: 400, borderRadius: 12, borderWidth: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalBody: { marginBottom: 20 },
  modalInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 46 },
  modalTextInput: { flex: 1, fontSize: 14, fontWeight: '600', padding: 0, height: '100%' },
  modalFooter: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  modalSubmitBtn: { minWidth: 100, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  modalSubmitBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  modalCancelBtn: { minWidth: 100, height: 42, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  modalCancelBtnText: { fontSize: 13, fontWeight: '900' },
  counterCard: { marginHorizontal: 25, padding: 20, borderRadius: 8, borderWidth: 1.5, marginBottom: 20 },
  counterValue: { fontSize: 24, fontWeight: '950', marginBottom: 4 },
  counterNotes: { fontSize: 13, fontWeight: '600', fontStyle: 'italic', marginBottom: 16 },
  counterActionRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 12, alignItems: 'center' },
  counterDeclineBtn: { flex: 1, height: 44, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  counterAcceptBtn: { flex: 1.5, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

});

export default JobStatusScreen;
