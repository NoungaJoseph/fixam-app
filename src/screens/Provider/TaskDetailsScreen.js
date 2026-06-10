import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Image, StatusBar, Modal, Alert, Share
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import api, { getMediaUrl } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { translateService } from '../../i18n/translate';
import UserAvatar from '../../components/UserAvatar';

const formatDate = (value, locale = 'en') => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
};

const TaskDetailsScreen = ({ route, navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const task = route.params?.task || route.params?.job || {};
  const { walletBalance, appliedJobIds, markJobApplied, favoriteJobIds, toggleFavoriteJob } = useAppContext();
  const { user } = useAuth();
  const { on } = useSocket();
  const { t, locale } = useLanguage();
  const insets = useSafeAreaInsets();
  const [showConfirm, setShowConfirm] = useState(false);
  const [applicationCount, setApplicationCount] = useState(task.assignments?.length || task.proposals || 0);
  const [applied, setApplied] = useState(false);
  const coinCost = 1;
  const isFavorite = favoriteJobIds?.includes(task.id);
  const clientName = typeof task.client === 'object' ? (task.client?.fullName || t('common.client')) : (task.client || t('common.client'));
  const clientId = typeof task.client === 'object' ? task.client?.id : task.clientId;
  const clientAvatar = getMediaUrl(typeof task.client === 'object' ? task.client?.avatar : null);
  const isClientVerified = task.client?.isVerified === true || task.clientVerified === true || task.client?.providerProfile?.verification === 'VERIFIED';
  const budgetMin = Number(task.budgetMin || task.budget || 0);
  const budgetMax = Number(task.budgetMax || task.budget || 0);
  const budget = budgetMax;
  const budgetLabel = budgetMin && budgetMax && budgetMin !== budgetMax
    ? `${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()} XAF`
    : `${budget.toLocaleString()} XAF`;
  const photos = task.photos?.length ? task.photos.map((photo) => (typeof photo === 'string' ? { uri: getMediaUrl(photo) } : photo)) : [];
  const fallbackIcon = CATEGORY_ICONS[String(task.category || '').toUpperCase()] || 'briefcase-outline';
  const postedOn = formatDate(task.createdAt, locale);
  const preferredDate = formatDate(task.scheduledTime, locale);
  const hasApplied = applied || appliedJobIds?.includes(task.id) || task.assignments?.some((assignment) => (
    assignment.providerId === user?.providerProfile?.id ||
    assignment.provider?.userId === user?.id ||
    assignment.provider?.user?.id === user?.id
  ));
  const providerAssignment = task.assignments?.find((assignment) => (
    assignment.providerId === user?.providerProfile?.id ||
    assignment.provider?.userId === user?.id ||
    assignment.provider?.user?.id === user?.id ||
    assignment.id === task.assignmentId
  ));
  const assignmentStatus = String(task.assignmentStatus || providerAssignment?.status || '').toUpperCase();
  const canMessageClient = assignmentStatus === 'ACCEPTED' && ['ASSIGNED', 'IN_PROGRESS'].includes(String(task.status || '').toUpperCase());
  const hasLocationCoords = task.latitude != null && task.longitude != null;
  const canViewLocation = canMessageClient && ['ASSIGNED', 'IN_PROGRESS'].includes(String(task.status || '').toUpperCase()) && hasLocationCoords;

  React.useEffect(() => {
    const off = on('job:application-count', ({ jobId, applicationCount: count }) => {
      if (jobId === task.id) setApplicationCount(count);
    });
    return () => off?.();
  }, [on, task.id]);

  const goToCoins = () => {
    navigation.getParent()?.getParent()?.navigate('Wallet', { screen: 'CoinSystem' });
  };

  const handleAccept = () => {
    if (hasApplied) {
      Alert.alert(t('jobs.alreadyApplied'), t('jobs.alreadyAppliedBody'));
      return;
    }
    if (walletBalance < coinCost) {
      Alert.alert(t('jobs.insufficientCoins'), t('jobs.needCoinsToApply', { count: coinCost }), [
        { text: t('common.cancel') },
        { text: t('jobs.buyCoins'), onPress: goToCoins }
      ]);
      return;
    }
    setShowConfirm(true);
  };

  const confirmAccept = async () => {
    try {
      setShowConfirm(false);
      const res = await api.post(`/jobs/${task.id}/apply`);
      setApplied(true);
      await markJobApplied?.(task.id);
      setApplicationCount(res.data.applicationCount || applicationCount + 1);
      Alert.alert(t('jobs.proposalSent'), t('jobs.proposalSentBody'), [
        { text: t('common.close') }
      ]);
    } catch (error) {
      const message = error.response?.data?.message || t('common.tryAgain');
      Alert.alert(t('jobs.couldNotApply'), message);
    }
  };

  const openClientChat = async () => {
    try {
      const res = await api.post('/chat/conversations', { participantId: clientId });
      const conversation = res.data.data;
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        receiverId: clientId,
        userName: clientName,
        avatar: clientAvatar,
        otherParticipant: conversation.participants?.[0] || { id: clientId, role: 'CLIENT' },
        isSupportConversation: conversation.isSystem,
        task,
      });
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('messages.sendFailed'));
    }
  };

  const openJobLocation = () => {
    navigation.navigate('LiveTaskMap', {
      task: {
        ...task,
        latitude: task.latitude,
        longitude: task.longitude,
        location: task.location,
      },
    });
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://fixam.app/job/${task.id}`;
      const message = `${task.title || t('jobs.taskDetails')}\n\n${task.description ? task.description.slice(0, 100) + '...' : ''}\n\n${t('jobs.checkOutThisJob', 'Check out this job on Fixam:')} ${shareUrl}`;
      
      await Share.share({
        message: message,
        url: shareUrl,
        title: task.title || t('jobs.taskDetails')
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('jobs.taskDetails')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIcon} onPress={handleShare}>
            <MaterialCommunityIcons name="share-variant-outline" size={21} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={() => toggleFavoriteJob?.(task.id)}>
            <MaterialCommunityIcons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#EF4444' : colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            {task.category ? <View style={styles.badge}><Text style={styles.badgeText}>{translateService(task.category)}</Text></View> : <View />}
            {postedOn ? (
              <View style={styles.postedBadge}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#0D9488" />
                <Text style={styles.postedText}>{postedOn}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.jobTitle, { color: colors.text }]}>{task.title || t('jobs.taskDetails')}</Text>
          {task.description ? (
            <Text style={[styles.jobSummary, { color: colors.textSecondary }]}>{task.description}</Text>
          ) : null}
          <View style={styles.heroBottom}>
            <View style={styles.locationLine}>
              <MaterialCommunityIcons name="map-marker" size={25} color="#0D9488" />
              <Text style={[styles.locationText, { color: colors.text }]}>{task.location || t('jobs.locationNotShared')}</Text>
            </View>
            {budget > 0 ? (
              <View style={styles.priceBlock}>
                <Text style={styles.priceText}>{budgetLabel}</Text>
                <Text style={styles.priceBadge}>{budgetMin !== budgetMax ? t('jobs.budgetRange').toUpperCase() : t('jobs.fixedPrice').toUpperCase()}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.clientCard, { borderColor: colors.border }]}>
          <UserAvatar uri={clientAvatar} name={clientName} size={58} radius={8} style={styles.clientAvatar} />
          <View style={styles.clientInfo}>
            <Text style={[styles.clientRole, { color: colors.textSecondary }]}>{t('common.client')}</Text>
            <View style={styles.clientNameRow}>
              <Text style={[styles.clientName, { color: colors.text }]} numberOfLines={1}>{clientName}</Text>
              {isClientVerified && <MaterialCommunityIcons name="check-decagram" size={20} color="#0D9488" />}
            </View>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{t('jobs.taskOwner')}</Text>
          </View>
          {canMessageClient && (
            <TouchableOpacity style={styles.clientAction} onPress={openClientChat}>
              <MaterialCommunityIcons name="message-text-outline" size={23} color={colors.text} />
              <Text style={[styles.clientActionText, { color: colors.text }]}>{t('tabs.messages')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.overviewCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('jobs.overview')}</Text>
          <View style={styles.inlineFacts}>
            {task.id ? <Fact icon="clipboard-text-outline" label={t('jobs.jobId')} value={`#JOB-${String(task.id).slice(-7)}`} colors={colors} /> : null}
            {postedOn ? <Fact icon="calendar-month-outline" label={t('jobs.posted')} value={postedOn} colors={colors} /> : null}
            {preferredDate ? <Fact icon="clock-outline" label={t('jobs.preferred')} value={preferredDate} colors={colors} /> : null}
            <Fact icon="star-cog-outline" label={t('jobs.proposals')} value={t('jobs.receivedCount', { count: applicationCount })} colors={colors} />
          </View>

          {task.description ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('jobs.description')}</Text>
              <Text style={[styles.longText, { color: colors.textSecondary }]}>{task.description}</Text>
              <TouchableOpacity style={[styles.shareJobBtn, { borderColor: colors.border, backgroundColor: isDarkMode ? '#134E4A' : '#E6FDF3' }]} onPress={handleShare}>
                <MaterialCommunityIcons name="share-variant" size={20} color="#0D9488" />
                <Text style={[styles.shareJobText, { color: colors.text }]}>{t('jobs.shareJob', 'Share this job')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.shareJobBtn, { borderColor: colors.border, backgroundColor: isDarkMode ? '#134E4A' : '#E6FDF3', marginTop: 16 }]} onPress={handleShare}>
              <MaterialCommunityIcons name="share-variant" size={20} color="#0D9488" />
              <Text style={[styles.shareJobText, { color: colors.text }]}>{t('jobs.shareJob', 'Share this job')}</Text>
            </TouchableOpacity>
          )}

          {task.whatNeedsDone ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('jobs.whatNeedsDone')}</Text>
              <View style={[styles.todoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#0D9488" />
                <Text style={[styles.todoText, { color: colors.textSecondary }]}>{task.whatNeedsDone}</Text>
              </View>
            </>
          ) : null}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('jobs.photos')}</Text>
          <View style={styles.photoRow}>
            {photos.length > 0 ? (
              <>
                {photos.slice(0, 4).map((uri, index) => (
                  <View key={`${uri.uri || index}-${index}`} style={[styles.photoWrap, { backgroundColor: colors.border }]}>
                    <Image source={uri} style={styles.photo} />
                    {index === 3 && photos.length > 4 && <Text style={styles.morePhotos}>+{photos.length - 4}</Text>}
                  </View>
                ))}
              </>
            ) : (
              <View style={[styles.photoFallback, { backgroundColor: isDarkMode ? 'rgba(13,148,136,0.16)' : '#E6FDF3', borderColor: colors.border }]}>
                <MaterialCommunityIcons name={fallbackIcon} size={38} color={colors.accent} />
                <Text style={[styles.photoFallbackText, { color: colors.textSecondary }]}>{translateService(task.category || t('jobs.taskDetails'))}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('jobs.details')}</Text>
          <View style={styles.detailList}>
            {task.category ? <DetailLine label={t('jobs.category')} value={translateService(task.category)} colors={colors} /> : null}
            {task.serviceType ? <DetailLine label={t('jobs.serviceType')} value={translateService(task.serviceType)} colors={colors} /> : null}
            {budget > 0 ? <DetailLine label={t('jobs.budget')} value={budgetLabel} colors={colors} /> : null}
            {task.materialsProvider ? <DetailLine label={t('jobs.materials')} value={task.materialsProvider === 'client' ? t('jobs.clientWillProvide') : t('jobs.professionalWillProvide')} colors={colors} /> : null}
            {task.duration ? <DetailLine label={t('jobs.duration')} value={task.duration} colors={colors} /> : null}
          </View>
          {canViewLocation && (
            <TouchableOpacity style={[styles.viewLocationBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={openJobLocation}>
              <MaterialCommunityIcons name="map-marker" size={21} color={colors.accent} />
              <Text style={[styles.viewLocationText, { color: colors.text }]}>{t('jobs.viewLocation')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { bottom: Math.max(insets.bottom, 12) + 25 }]}>
        {canMessageClient && (
          <TouchableOpacity style={styles.footerIcon} onPress={openClientChat}>
            <MaterialCommunityIcons name="message-text-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.proposalBtn, hasApplied && styles.proposalBtnDisabled]} onPress={handleAccept} disabled={hasApplied}>
          <Text style={styles.proposalTitle}>{hasApplied ? t('jobs.alreadyApplied') : t('jobs.sendProposal')}</Text>
          <Text style={styles.proposalSub}>{t('wallet.coinCount', { count: coinCost })}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerIcon} onPress={() => toggleFavoriteJob?.(task.id)}>
          <MaterialCommunityIcons name={isFavorite ? 'heart' : 'heart-outline'} size={25} color={isFavorite ? '#EF4444' : colors.text} />
        </TouchableOpacity>
      </View>
      <View style={[styles.secureFooter, { bottom: Math.max(insets.bottom, 8) }]}>
        <MaterialCommunityIcons name="lock" size={18} color="#64748B" />
        <Text style={[styles.secureText, { color: colors.textSecondary }]}>{t('jobs.proposalSecure')}</Text>
      </View>

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('jobs.sendProposalQuestion')}</Text>
            <Text style={styles.modalText}>{t('jobs.applyCoinNotice', { count: coinCost })}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowConfirm(false)}>
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmAccept}>
                <Text style={styles.confirmBtnText}>{t('jobs.yesApply')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const Fact = ({ icon, label, value, colors }) => (
  <View style={[styles.factItem, { borderColor: colors.border, backgroundColor: colors.card }]}>
    <MaterialCommunityIcons name={icon} size={20} color="#0D9488" />
    <View>
      <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.factValue, { color: colors.text }]}>{value}</Text>
    </View>
  </View>
);

const DetailLine = ({ label, value, colors }) => (
  <View style={[styles.detailLine, { borderBottomColor: colors.border }]}>
    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
    <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 58, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#071936', fontSize: 21, fontWeight: '900' },
  headerActions: { flexDirection: 'row', gap: 6 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 138 },
  heroCard: { paddingVertical: 18, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  badge: { backgroundColor: '#DFFAF5', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 8 },
  badgeText: { color: '#0D9488', fontSize: 13, fontWeight: '900' },
  postedBadge: { backgroundColor: '#DFFAF5', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
  postedText: { color: '#0D9488', fontSize: 13, fontWeight: '900' },
  jobTitle: { color: '#071936', fontSize: 26, fontWeight: '900', marginBottom: 14 },
  jobSummary: { color: '#10213D', fontSize: 17, lineHeight: 27, fontWeight: '600' },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18, gap: 10 },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, flexWrap: 'wrap' },
  locationText: { color: '#071936', fontSize: 16, fontWeight: '900' },
  vDivider: { width: 1, height: 22, backgroundColor: '#CBD5E1' },
  distanceText: { color: '#0D9488', fontSize: 14, fontWeight: '900' },
  priceBlock: { alignItems: 'flex-end' },
  priceText: { color: '#06B85F', fontSize: 26, fontWeight: '900' },
  priceBadge: { color: '#0D9488', backgroundColor: '#DFFAF5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, fontWeight: '900', marginTop: 8 },
  addressCard: { minHeight: 80, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  cardTitle: { color: '#071936', fontSize: 16, fontWeight: '900', marginBottom: 5 },
  cardSub: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  clientCard: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, borderBottomWidth: 1 },
  clientAvatar: { width: 58, height: 58, borderRadius: 8 },
  clientInfo: { flex: 1, minWidth: 0 },
  clientRole: { color: '#64748B', fontSize: 14, fontWeight: '700', marginBottom: 3 },
  clientNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clientName: { color: '#071936', fontSize: 17, fontWeight: '900', flexShrink: 1 },
  clientAction: { alignItems: 'center', gap: 5, paddingHorizontal: 4 },
  clientActionText: { color: '#071936', fontSize: 12, fontWeight: '800' },
  overviewCard: { paddingHorizontal: 2, paddingTop: 8, marginBottom: 16 },
  sectionTitle: { color: '#071936', fontSize: 18, fontWeight: '900', marginTop: 10, marginBottom: 16 },
  inlineFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  factItem: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  factLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  factValue: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  longText: { color: '#334155', fontSize: 16, lineHeight: 25, fontWeight: '600' },
  seeLess: { color: '#0D9488', fontSize: 15, fontWeight: '900', marginTop: 12, marginBottom: 14 },
  todoBox: { backgroundColor: '#F8FAFC', borderRadius: 9, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, borderWidth: 1 },
  todoText: { color: '#334155', fontSize: 14, lineHeight: 22, fontWeight: '700', flex: 1 },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  photoWrap: { flex: 1, aspectRatio: 1.35, borderRadius: 9, overflow: 'hidden', backgroundColor: '#E2E8F0' },
  photo: { width: '100%', height: '100%' },
  photoFallback: { width: '100%', minHeight: 112, borderRadius: 0, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoFallbackText: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  morePhotos: { position: 'absolute', right: 10, bottom: 10, color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  detailList: { marginBottom: 24 },
  detailLine: { minHeight: 48, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  detailLabel: { color: '#071936', fontSize: 13, fontWeight: '800' },
  detailValue: { color: '#334155', fontSize: 14, fontWeight: '800', flex: 1, textAlign: 'right' },
  viewLocationBtn: { minHeight: 54, borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, marginBottom: 18 },
  viewLocationText: { fontSize: 15, fontWeight: '900' },
  shareJobBtn: { minHeight: 50, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, marginBottom: 8 },
  shareJobText: { fontSize: 15, fontWeight: '800' },
  prefRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  prefChip: { backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 12, height: 42, flexDirection: 'row', alignItems: 'center', gap: 7 },
  prefText: { color: '#334155', fontSize: 12, fontWeight: '900' },
  footer: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  proposalBtn: { flex: 1, height: 56, borderRadius: 8, backgroundColor: '#0D9488', alignItems: 'center', justifyContent: 'center' },
  proposalBtnDisabled: { backgroundColor: '#94A3B8' },
  proposalTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  proposalSub: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginTop: 3 },
  secureFooter: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secureText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalContent: { width: '100%', borderRadius: 24, padding: 26, alignItems: 'center', backgroundColor: '#FFFFFF' },
  modalTitle: { color: '#071936', fontSize: 22, fontWeight: '900', marginBottom: 10 },
  modalText: { color: '#64748B', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalActions: { width: '100%', gap: 12 },
  confirmBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D9488' },
  confirmBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  cancelBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  cancelBtnText: { color: '#64748B', fontSize: 15, fontWeight: '700' },
});

export default TaskDetailsScreen;
