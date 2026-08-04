import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Share,
  Platform,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getCurrencyForUser } from '../../constants/countries';
import UserAvatar from '../../components/UserAvatar';
import api, { getMediaUrl } from '../../services/api';
import VerificationRequiredModal from '../../components/VerificationRequiredModal';
import { isIdentityVerified, getVerificationMessageKey, translateApiError } from '../../utils/eligibilityMessages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProjectDetailScreen = ({ route, navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { favoriteProviderIds, toggleFavoriteProvider, toggleLikeProject } = useAppContext();
  const insets = useSafeAreaInsets();

  const project = route.params?.project || {};
  const provider = route.params?.provider || project.provider || {};
  const currentUserId = String(user?.id || user?._id || user?.userId || '');
  const currentProviderProfileId = String(user?.providerProfile?.id || user?.provider?.id || '');

  const projectUserId = String(
    project.providerId ||
    project.provider?.user?.id ||
    project.provider?.id ||
    provider?.user?.id ||
    provider?.userId ||
    provider?.id ||
    ''
  );
  const providerUserId = projectUserId;
  const projectProviderProfileId = String(
    project.provider?.id ||
    provider?.id ||
    ''
  );

  const isOwner = Boolean(
    (currentUserId && projectUserId && currentUserId === projectUserId) ||
    (currentProviderProfileId && projectProviderProfileId && currentProviderProfileId === projectProviderProfileId)
  );

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [expressAddon, setExpressAddon] = useState(false);
  const [faqExpanded, setFaqExpanded] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const [videoBuffering, setVideoBuffering] = useState({});
  const [fullscreenMediaVisible, setFullscreenMediaVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const fullScreenScrollRef = useRef(null);

  // Media list for carousel (Multiple Videos + Images)
  const images = (Array.isArray(project.images) && project.images.length > 0)
    ? project.images
    : (project.imageUrl ? [project.imageUrl] : []);

  const videoList = Array.isArray(project.videos) && project.videos.length > 0
    ? project.videos
    : (project.video ? [project.video] : []);

  const mediaList = [
    ...videoList.map(v => ({ type: 'video', uri: v })),
    ...images.map(img => ({ type: 'image', uri: img }))
  ];

  if (mediaList.length === 0) {
    mediaList.push({ type: 'image', uri: provider?.user?.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' });
  }

  const isFavorite = favoriteProviderIds?.includes(provider?.id);
  const currencyStr = getCurrencyForUser(provider.user?.country || user?.country || 'Cameroon');
  const baseRate = Number(project.price || provider.rate || 40);

  // Resolve Real Pricing Tiers from project.packages
  const resolveTiers = () => {
    if (project.packages) {
      const parsed = [];
      ['basic', 'standard', 'premium'].forEach((key) => {
        const pkg = project.packages[key];
        if (pkg && (pkg.enabled || pkg.price)) {
          parsed.push({
            id: key,
            name: key.toUpperCase(),
            label: pkg.summary || pkg.label || '',
            price: Number(pkg.price || 0),
            deliveryDays: Number(pkg.deliveryDays || 1),
            revisions: Number(pkg.revisions || 0),
            expressDeliveryEnabled: pkg.expressDeliveryEnabled !== undefined ? Boolean(pkg.expressDeliveryEnabled) : true,
            expressDeliveryDays: pkg.expressDeliveryDays ? Number(pkg.expressDeliveryDays) : 4,
            expressDeliveryPrice: pkg.expressDeliveryPrice ? Number(pkg.expressDeliveryPrice) : Math.round(Number(pkg.price || 0) * 0.3),
            features: Array.isArray(pkg.features) && pkg.features.length > 0
              ? pkg.features.filter(f => f && f.trim())
              : []
          });
        }
      });
      if (parsed.length > 0) return parsed;
    }
    return [
      {
        id: 'standard',
        name: 'STANDARD',
        label: '',
        price: baseRate,
        deliveryDays: 3,
        revisions: 1,
        expressDeliveryEnabled: true,
        expressDeliveryDays: 4,
        expressDeliveryPrice: Math.round(baseRate * 0.3),
        features: []
      }
    ];
  };

  const tiers = resolveTiers();
  const activeTier = tiers[selectedTierIndex] || tiers[0];
  const expressAddonPrice = Number(activeTier.expressDeliveryPrice || Math.round(activeTier.price * 0.3));
  const expressDays = Number(activeTier.expressDeliveryDays || 4);
  const finalPrice = activeTier.price + (expressAddon ? expressAddonPrice : 0);

  // Share project handler
  const handleShare = async () => {
    try {
      const url = `https://usefixam.com/project/${project.id || provider.id}`;
      await Share.share({
        title: project.title || 'Project Details',
        message: `${project.title || 'Check out this project on Fixam'}: ${url}`,
      });
    } catch (_) {}
  };

  // Book Project / Send Proposal handler (Client view)
  const handleBook = () => {
    if (user?.isBlocked) {
      Alert.alert(t('common.error'), t('eligibility.accountBlocked'));
      return;
    }
    if (!isIdentityVerified(user)) {
      setVerificationMessage(t(getVerificationMessageKey(user, 'booking')));
      setShowVerificationModal(true);
      return;
    }
    navigation.navigate('ProjectProposal', {
      project: {
        ...project,
        selectedTier: activeTier,
        price: finalPrice,
      },
      provider,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#0F172A' : '#FAFAFA' }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Top Hero Media Gallery Carousel (Video + Images) */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              if (slide !== activeImageIndex) setActiveImageIndex(slide);
            }}
            scrollEventThrottle={16}
          >
            {mediaList.map((media, idx) => (
              <View key={`${media.uri}-${idx}`} style={{ width: SCREEN_WIDTH, height: 320, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                {media.type === 'video' ? (
                  <>
                    <Video
                      source={{ uri: getMediaUrl(media.uri) }}
                      rate={1.0}
                      volume={1.0}
                      isMuted={false}
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={activeImageIndex === idx}
                      useNativeControls
                      onLoadStart={() => setVideoBuffering(prev => ({ ...prev, [idx]: true }))}
                      onReadyForDisplay={() => setVideoBuffering(prev => ({ ...prev, [idx]: false }))}
                      onError={(err) => { console.log('[Video Play Error - Detail]:', err); setVideoBuffering(prev => ({ ...prev, [idx]: false })); }}
                      style={{ width: SCREEN_WIDTH, height: 320, backgroundColor: '#000' }}
                    />
                    {videoBuffering[idx] && (
                      <View style={{ position: 'absolute', alignSelf: 'center' }}>
                        <ActivityIndicator size="large" color="#0D9488" />
                      </View>
                    )}
                  </>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{ width: SCREEN_WIDTH, height: 320 }}
                    onPress={() => {
                      setFullscreenIndex(idx);
                      setFullscreenMediaVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri: getMediaUrl(media.uri) }}
                      style={{ width: SCREEN_WIDTH, height: 320 }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Top Floating Header Bar */}
          <View style={[styles.topActionsBar, { paddingTop: Math.max(insets.top + 6, 12) }]}>
            <TouchableOpacity
              style={[styles.floatingCircleBtn, { backgroundColor: isDarkMode ? 'rgba(30,41,59,0.85)' : '#FFFFFF' }]}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
            </TouchableOpacity>

            {/* If Owner: Show Likes Count & Edit Button. If Client: Show Share & Heart */}
            {isOwner ? (
              <View style={styles.topRightGroup}>
                <View style={[styles.likesPill, { backgroundColor: isDarkMode ? 'rgba(30,41,59,0.9)' : '#FFFFFF' }]}>
                  <MaterialCommunityIcons name="heart" size={18} color="#EF4444" />
                  <Text style={[styles.likesPillText, { color: colors.text }]}>{project.likesCount || 0} Likes</Text>
                </View>

                <TouchableOpacity
                  style={[styles.editCircleBtn, { backgroundColor: colors.accent }]}
                  onPress={() => navigation.navigate('PostProject', { editProject: project })}
                >
                  <MaterialCommunityIcons name="pencil" size={18} color="#FFF" />
                  <Text style={styles.editBtnText}>{t('common.edit', 'Edit')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.topRightGroup}>
                <TouchableOpacity
                  style={[styles.floatingCircleBtn, { backgroundColor: isDarkMode ? 'rgba(30,41,59,0.85)' : '#FFFFFF' }]}
                  onPress={() => {
                    if (project.id) toggleLikeProject(project.id);
                    toggleFavoriteProvider?.(provider?.id);
                  }}
                >
                  <MaterialCommunityIcons
                    name={project.isLikedByMe || isFavorite ? 'heart' : 'heart-outline'}
                    size={22}
                    color={project.isLikedByMe || isFavorite ? '#EF4444' : (isDarkMode ? '#FFFFFF' : '#0F172A')}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.floatingCircleBtn, { backgroundColor: isDarkMode ? 'rgba(30,41,59,0.85)' : '#FFFFFF' }]}
                  onPress={handleShare}
                >
                  <MaterialCommunityIcons name="dots-horizontal" size={24} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Floating Media Counter Pill */}
          {mediaList.length > 1 && (
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {activeImageIndex + 1} of {mediaList.length}
              </Text>
            </View>
          )}
        </View>

        {/* Provider Profile Info Row (Client view only) */}
        {!isOwner && (
          <TouchableOpacity
            style={[styles.providerHeaderCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}
            onPress={() => navigation.navigate('ProviderProfile', { provider })}
            activeOpacity={0.8}
          >
            <UserAvatar uri={getMediaUrl(provider.user?.avatar)} name={provider.user?.fullName} size={46} radius={23} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.providerNameText, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>
                {provider.user?.fullName || 'Professional Provider'}
              </Text>
              <View style={styles.levelBadgeRow}>
                <Text style={styles.levelBadgeText}>Level 2 ♦♦♦</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
          </TouchableOpacity>
        )}

        {/* Project Title & Short Description */}
        <View style={styles.contentSection}>
          <Text style={[styles.projectTitleText, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>
            {project.title || 'Custom Professional Service & Deliverable Project'}
          </Text>

          <Text style={[styles.descriptionText, { color: isDarkMode ? '#CBD5E1' : '#475569' }]} numberOfLines={showFullDesc ? undefined : 3}>
            {project.description ||
              `Hi there! As a dedicated professional with extensive experience, I deliver high-quality custom project solutions tailored specifically to your requirements. Fast delivery and 100% satisfaction guaranteed.`}
          </Text>

          {!showFullDesc && (
            <TouchableOpacity onPress={() => setShowFullDesc(true)}>
              <Text style={styles.moreLink}>{t('common.more', 'More')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pricing Tiers Selector Tabs */}
        <View style={styles.tiersTabContainer}>
          <View style={[styles.tiersTabBar, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
            {tiers.map((tier, idx) => {
              const isSelected = selectedTierIndex === idx;
              return (
                <TouchableOpacity
                  key={tier.id}
                  style={[
                    styles.tierTabItem,
                    isSelected && [styles.tierTabItemActive, { backgroundColor: isDarkMode ? '#334155' : '#FFFFFF' }]
                  ]}
                  onPress={() => setSelectedTierIndex(idx)}
                >
                  <Text style={[styles.tierTabPriceText, { color: isSelected ? '#0D9488' : (isDarkMode ? '#94A3B8' : '#64748B') }]}>
                    {currencyStr} {tier.price}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Active Tier Details Card */}
          <View style={[styles.tierDetailCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: isDarkMode ? '#1F2937' : '#E2E8F0' }]}>
            <Text style={[styles.tierTitleText, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>
              {activeTier.name}
            </Text>

            {activeTier.label ? (
              <Text style={[styles.tierSubtitleText, { color: isDarkMode ? '#CBD5E1' : '#475569', marginTop: 4, fontWeight: '700' }]}>
                {activeTier.label}
              </Text>
            ) : null}

            {/* Package Details Table Rows */}
            <View style={{ marginTop: 12, marginBottom: 8, gap: 10 }}>
              <View style={styles.tableRowItem}>
                <Text style={[styles.tableRowLabel, { color: isDarkMode ? '#94A3B8' : '#475569' }]}>Delivery days</Text>
                <Text style={[styles.tableRowValue, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>{activeTier.deliveryDays} Days</Text>
              </View>

              <View style={styles.tableRowItem}>
                <Text style={[styles.tableRowLabel, { color: isDarkMode ? '#94A3B8' : '#475569' }]}>Revisions</Text>
                <Text style={[styles.tableRowValue, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>{activeTier.revisions}</Text>
              </View>
            </View>

            {/* Features Checkmarks List */}
            {activeTier.features.length > 0 && (
              <View style={styles.featuresList}>
                {activeTier.features.map((feat, fIdx) => (
                  <View key={fIdx} style={styles.featureRow}>
                    <Text style={[styles.featureText, { color: isDarkMode ? '#E2E8F0' : '#334155' }]}>{feat}</Text>
                    <MaterialCommunityIcons name="check" size={18} color={isDarkMode ? '#FFFFFF' : '#0F172A'} />
                  </View>
                ))}
              </View>
            )}

            {/* Optional Express Delivery Add-on */}
            {activeTier.expressDeliveryEnabled !== false && (
              <TouchableOpacity
                style={[styles.addonRow, { borderColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
                onPress={() => setExpressAddon(!expressAddon)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={expressAddon ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={20}
                  color={expressAddon ? colors.accent : '#94A3B8'}
                />
                <Text style={[styles.addonText, { color: isDarkMode ? '#E2E8F0' : '#334155' }]}>
                  Express delivery in {expressDays} days
                </Text>
                <Text style={styles.addonPriceText}>+{currencyStr} {expressAddonPrice}</Text>
              </TouchableOpacity>
            )}

            {/* Main CTA Button (Only for Client View) */}
            {!isOwner && (
              <TouchableOpacity
                style={[styles.continueBtn, { backgroundColor: colors.accent }]}
                onPress={handleBook}
              >
                <Text style={styles.continueBtnText}>
                  {t('common.continue', 'Continue')} ({currencyStr} {finalPrice})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* My Portfolio Section */}
        {images.length > 0 && (
          <View style={styles.contentSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeadingText, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>
                {t('profileDetail.portfolio', 'My portfolio')}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('PortfolioDetails', { items: project.images || [], type: 'projects' })}>
                <Text style={styles.seeAllLink}>{t('common.seeAll', 'See All')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {images.map((img, i) => (
                <Image key={i} source={{ uri: getMediaUrl(img) }} style={styles.portfolioThumbImage} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Seller Rating Breakdown */}
        <View style={styles.contentSection}>
          <View style={styles.overallRatingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <MaterialCommunityIcons key={s} name="star" size={20} color="#F59E0B" />
              ))}
              <Text style={[styles.overallRatingScoreText, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>
                {Number(provider.rating || 4.7).toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={styles.breakdownList}>
            {[
              {
                label: t('project.communicationLevel', 'Seller communication level'),
                score: Math.min(5.0, Number(((provider.rating || 4.7) * 1.01).toFixed(1))).toFixed(1)
              },
              {
                label: t('project.qualityOfDelivery', 'Quality of delivery'),
                score: Number((provider.rating || 4.7).toFixed(1)).toFixed(1)
              },
              {
                label: t('project.valueOfDelivery', 'Value of delivery'),
                score: Math.max(1.0, Number(((provider.rating || 4.7) * 0.96).toFixed(1))).toFixed(1)
              },
            ].map((item) => (
              <View key={item.label} style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: isDarkMode ? '#E2E8F0' : '#0F172A' }]}>
                  {item.label}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                  <Text style={[styles.breakdownScore, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>
                    {item.score}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Client Reviews Section */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeadingText, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>
              {provider.reviewCount || (provider.reviews?.length || 0)} {t('profile.reviews', 'reviews')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Reviews', { userId: providerUserId, role: 'PROVIDER' })}>
              <Text style={styles.seeAllLink}>{t('common.seeAll', 'See All')}</Text>
            </TouchableOpacity>
          </View>

          {Array.isArray(provider.reviews) && provider.reviews.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {provider.reviews.map((rev) => (
                <View
                  key={rev.id || Math.random().toString()}
                  style={[
                    styles.reviewCardHorizontal,
                    { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: isDarkMode ? '#1F2937' : '#E2E8F0' }
                  ]}
                >
                  <View style={styles.reviewUserRow}>
                    <UserAvatar uri={getMediaUrl(rev.reviewer?.avatar || rev.job?.client?.avatar)} name={rev.reviewer?.fullName || 'Client'} size={36} radius={18} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.reviewUserNameText, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>
                        {rev.reviewer?.fullName || 'Client'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.reviewCommentBody, { color: isDarkMode ? '#CBD5E1' : '#334155' }]} numberOfLines={3}>
                    {rev.comment || rev.content || 'Great service delivery!'}
                  </Text>

                  <View style={styles.reviewFooterRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                      <Text style={[styles.reviewRatingValText, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>
                        {Number(rev.rating || 5).toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={{ color: isDarkMode ? '#94A3B8' : '#64748B', fontSize: 13, fontStyle: 'italic', marginVertical: 8 }}>
              {t('project.noReviewsYet', 'No reviews for this provider yet.')}
            </Text>
          )}
        </View>

      </ScrollView>

      {/* Floating Chat Button on Bottom Right (Matching Screenshots 1, 2 & 3) */}
      {!isOwner && providerUserId && (
        <TouchableOpacity
          style={[styles.floatingChatPill, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}
          onPress={async () => {
            try {
              const convRes = await api.post('/chat/conversations', { participantId: providerUserId });
              const conversation = convRes.data.data;
              navigation.navigate('Chat', {
                conversationId: conversation.id,
                receiverId: providerUserId,
                userName: provider.user?.fullName || 'Provider',
                avatar: getMediaUrl(provider.user?.avatar),
                otherParticipant: conversation.participants?.[0] || { id: providerUserId, role: 'PROVIDER' },
              });
            } catch (err) {
              Alert.alert(t('common.error'), translateApiError(err, t));
            }
          }}
          activeOpacity={0.88}
        >
          <UserAvatar uri={getMediaUrl(provider.user?.avatar)} name={provider.user?.fullName || 'Provider'} size={32} radius={16} />
          <Text style={[styles.floatingChatPillText, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>
            {t('common.chat', 'Chat')}
          </Text>
        </TouchableOpacity>
      )}

      <VerificationRequiredModal
        visible={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        message={verificationMessage || t('verification.bookingRequired')}
        isProvider={false}
      />

      {/* Fullscreen Media Viewer Modal (Images + Videos) */}
      <Modal
        visible={fullscreenMediaVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setFullscreenMediaVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          {/* Top Floating Control Bar */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: Math.max(insets.top + 10, 20),
              paddingHorizontal: 16,
              paddingBottom: 12,
              zIndex: 50,
              backgroundColor: 'rgba(0,0,0,0.65)',
            }}
          >
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => setFullscreenMediaVisible(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>
                {fullscreenIndex + 1} of {mediaList.length}
              </Text>
            </View>
          </View>

          {/* Fullscreen Swipeable Media List */}
          <ScrollView
            ref={fullScreenScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: fullscreenIndex * SCREEN_WIDTH, y: 0 }}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              if (slide !== fullscreenIndex) setFullscreenIndex(slide);
            }}
            scrollEventThrottle={16}
            style={{ flex: 1 }}
          >
            {mediaList.map((media, idx) => (
              <View key={`full-${media.uri}-${idx}`} style={{ width: SCREEN_WIDTH, height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                {media.type === 'video' ? (
                  <View style={{ width: SCREEN_WIDTH, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <Video
                      source={{ uri: getMediaUrl(media.uri) }}
                      rate={1.0}
                      volume={1.0}
                      isMuted={false}
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={fullscreenMediaVisible && fullscreenIndex === idx}
                      useNativeControls
                      onLoadStart={() => setVideoBuffering(prev => ({ ...prev, [`full-${idx}`]: true }))}
                      onReadyForDisplay={() => setVideoBuffering(prev => ({ ...prev, [`full-${idx}`]: false }))}
                      onError={(err) => { console.log('[Video Play Error - Fullscreen]:', err); setVideoBuffering(prev => ({ ...prev, [`full-${idx}`]: false })); }}
                      style={{ width: SCREEN_WIDTH, height: '80%' }}
                    />
                    {videoBuffering[`full-${idx}`] && (
                      <View style={{ position: 'absolute', alignSelf: 'center' }}>
                        <ActivityIndicator size="large" color="#0D9488" />
                      </View>
                    )}
                  </View>
                ) : (
                  <Image
                    source={{ uri: getMediaUrl(media.uri) }}
                    style={{ width: SCREEN_WIDTH, height: '100%' }}
                    resizeMode="contain"
                  />
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  galleryContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  topActionsBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topRightGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  floatingCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  counterBadge: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  providerHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  providerNameText: {
    fontSize: 15,
    fontWeight: '800',
  },
  levelBadgeRow: {
    marginTop: 2,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },

  contentSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  projectTitleText: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  moreLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textDecorationLine: 'underline',
    marginTop: 4,
  },

  tiersTabContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  tiersTabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tierTabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 9,
  },
  tierTabItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tierTabPriceText: {
    fontSize: 15,
    fontWeight: '900',
  },
  tierDetailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  tierTitleText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tierSubtitleText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
  },
  tierMetaRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 14,
  },
  tierMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierMetaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tableRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  tableRowLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  tableRowValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  featuresList: {
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 16,
    gap: 8,
  },
  addonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  addonPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D9488',
  },
  continueBtn: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionHeadingText: {
    fontSize: 18,
    fontWeight: '900',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textDecorationLine: 'underline',
  },
  portfolioThumbImage: {
    width: 170,
    height: 110,
    borderRadius: 10,
  },

  overallRatingRow: {
    marginBottom: 14,
  },
  overallRatingScoreText: {
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 6,
  },
  breakdownList: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownScore: {
    fontSize: 14,
    fontWeight: '800',
  },

  reviewCardHorizontal: {
    width: 250,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  reviewUserNameText: {
    fontSize: 14,
    fontWeight: '800',
  },
  reviewUserCountryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reviewCommentBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  reviewFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewRatingValText: {
    fontSize: 13,
    fontWeight: '900',
  },
  reviewTimeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  floatingChatContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 99,
  },
  floatingChatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingChatText: {
    fontSize: 15,
    fontWeight: '900',
  },
  floatingChatPillText: {
    fontSize: 14,
    fontWeight: '900',
  },

  likesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  likesPillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  editCircleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default ProjectDetailScreen;
