import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Linking, Image, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getCurrencyForUser } from '../../constants/countries';
import { getMediaUrl } from '../../services/api';
import api from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { useAppContext } from '../../context/AppContext';
import { translateApiError } from '../../utils/eligibilityMessages';

const ProposalDetailScreen = ({ route, navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { fetchAppData } = useAppContext();

  const { assignment, provider, providerUser, job } = route.params || {};
  const [selectingAssignment, setSelectingAssignment] = useState(false);
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

  const chooseProvider = () => {
    const providerName = providerUser?.fullName || providerUser?.name || t('jobs.thisProvider');
    Alert.alert(
      t('jobs.chooseProviderQuestion'),
      t('jobs.chooseProviderBody', { name: providerName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            setSelectingAssignment(true);
            try {
              const res = await api.post(`/jobs/${job.id}/applications/${assignment.id}/select`);
              await fetchAppData?.(true);
              Alert.alert(t('jobs.providerSelected'), t('jobs.providerSelectedBody', { name: providerName }), [
                { text: t('common.close'), onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert(t('jobs.couldNotChooseProvider'), translateApiError(error, t));
            } finally {
              setSelectingAssignment(false);
            }
          }
        }
      ]
    );
  };

  // Parse media list
  let mediaList = [];
  if (Array.isArray(assignment?.proposalMedia)) {
    mediaList = assignment.proposalMedia;
  } else if (typeof assignment?.proposalMedia === 'string') {
    try {
      mediaList = JSON.parse(assignment.proposalMedia);
    } catch (_) {}
  }

  const jobCurrency = getCurrencyForUser(job?.country || user?.country || 'Cameroon');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('jobs.proposalDetails', 'Proposal Details')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Provider Info */}
          <View style={styles.providerSection}>
            <UserAvatar uri={providerUser?.avatar} name={providerUser?.fullName || t('common.provider')} size={72} radius={36} />
            <View style={{ marginTop: 14, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.providerName, { color: colors.text }]}>
                  {providerUser?.fullName || 'Provider'}
                </Text>
                {assignment?.boostCoins > 0 && (
                  <View style={styles.boostBadge}>
                    <MaterialCommunityIcons name="rocket-launch" size={12} color="#0D9488" />
                    <Text style={styles.boostBadgeText}>
                      {t('profile.boostedBadge', { coins: assignment.boostCoins })}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="star" size={16} color="#FBBF24" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>
                  {Number(provider?.rating || 0).toFixed(1)}
                </Text>
                {provider?.jobsCompleted !== undefined && (
                  <>
                    <Text style={{ color: colors.textSecondary, marginHorizontal: 6 }}>•</Text>
                    <MaterialCommunityIcons name="briefcase-outline" size={16} color={colors.textSecondary} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginLeft: 3 }}>
                      {provider.jobsCompleted} {t('jobs.jobsDone', 'jobs')}
                    </Text>
                  </>
                )}
              </View>
              {provider?.rate ? (
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.accent, marginTop: 6 }}>
                  {t('jobs.rateLabel', 'Rate')}: {Number(provider.rate).toLocaleString()} {getCurrencyForUser(provider.user?.country || user?.country || 'Cameroon')}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Proposed Budget */}
          {Boolean(assignment?.proposedBudget) && (
            <View style={[styles.budgetSection, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t('jobs.proposedPrice', 'Proposed Price')}
              </Text>
              <Text style={[styles.budgetValue, { color: colors.accent }]}>
                {Number(assignment.proposedBudget).toLocaleString()} {jobCurrency}
              </Text>
            </View>
          )}

          {/* Cover Letter */}
          {assignment?.coverLetter ? (
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t('jobs.proposalPitchLabel', 'Proposal Pitch / Cover Note')}
              </Text>
              <Text style={[styles.coverLetterText, { color: colors.text }]}>
                {assignment.coverLetter}
              </Text>
            </View>
          ) : null}

          {/* Attached Documents */}
          {mediaList.length > 0 && (
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t('jobs.attachedDocuments', 'Attached CV / Portfolio / Documents')}
              </Text>
              <View style={{ gap: 10, marginTop: 8 }}>
                {mediaList.map((media, idx) => {
                  const rawUrl = media?.url || (typeof media === 'string' ? media : '');
                  const mediaUrl = getMediaUrl(rawUrl);
                  const isPdf = (media?.type && media.type.includes('pdf')) || (media?.name && media.name.toLowerCase().endsWith('.pdf')) || rawUrl.toLowerCase().endsWith('.pdf');
                  const fileName = media?.name || (isPdf ? 'PDF Resume / CV' : `Photo Attachment ${idx + 1}`);

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.mediaItem, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: colors.border }]}
                      onPress={() => handleOpenAttachment(mediaUrl, isPdf)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={isPdf ? 'file-pdf-box' : 'file-image'}
                        size={26}
                        color={isPdf ? '#EF4444' : '#0D9488'}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.mediaItemName, { color: colors.text }]} numberOfLines={1}>
                          {fileName}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                          {isPdf ? t('jobs.tapToOpenPdf', 'Tap to open & view PDF document') : t('jobs.tapToViewPhoto', 'Tap to view full image')}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="open-in-new" size={18} color={colors.accent} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* About the Job */}
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {t('jobs.forJob', 'For Job')}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 4 }}>
              {job?.title || t('jobs.taskDetails')}
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actionsFooter, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('ProviderProfile', { provider, task: job, assignment })}
          >
            <MaterialCommunityIcons name="account-outline" size={18} color={colors.text} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>{t('profile.viewProfile')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.accent, backgroundColor: isDarkMode ? 'rgba(13,148,136,0.1)' : '#F0FDFA' }]}
            onPress={() => navigation.navigate('Chat', {
              receiverId: providerUser?.id,
              userName: providerUser?.fullName || t('common.provider'),
              avatar: providerUser?.avatar,
              task: job
            })}
          >
            <MaterialCommunityIcons name="chat-outline" size={18} color={colors.accent} />
            <Text style={[styles.actionBtnText, { color: colors.accent }]}>{t('chat.message', 'Message')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.hireBtn, { backgroundColor: colors.accent }]}
            onPress={chooseProvider}
            disabled={selectingAssignment}
          >
            {selectingAssignment ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-bold" size={18} color="#FFF" />
                <Text style={styles.hireBtnText}>{t('jobs.hireNow')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 120 },
  providerSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  providerName: { fontSize: 22, fontWeight: '900' },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  boostBadgeText: {
    color: '#0D9488',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  budgetSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  budgetValue: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coverLetterText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
    marginTop: 10,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  mediaItemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionsFooter: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  hireBtn: {
    flex: 1.3,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    elevation: 4,
  },
  hireBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
  },
});

export default ProposalDetailScreen;
