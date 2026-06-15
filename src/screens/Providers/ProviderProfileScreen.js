import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Linking, Share, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAppContext } from '../../context/AppContext';
import api, { getMediaUrl } from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import { StatusBar } from 'expo-status-bar';

const ProviderProfileScreen = ({ route, navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const { favoriteProviderIds, toggleFavoriteProvider } = useAppContext();
  const provider = route.params?.provider || null;
  const providerUserId = provider?.user?.id || provider?.userId;
  const insets = useSafeAreaInsets();
  const [pastHeader, setPastHeader] = React.useState(false);
  const [reviews, setReviews] = React.useState([]);
  const [hasBooking, setHasBooking] = React.useState(false);
  const [existingBooking, setExistingBooking] = React.useState(null);



  React.useEffect(() => {
    const userId = provider?.user?.id;
    if (!userId) return;
    api.get(`/reviews/users/${userId}`)
      .then((res) => setReviews(res.data.data || []))
      .catch(() => setReviews([]));
  }, [provider?.user?.id]);

  React.useEffect(() => {
    const checkBookingStatus = async () => {
      try {
        if (!providerUserId) return;
        const res = await api.get(`/bookings/check?providerId=${providerUserId}`);
        setHasBooking(res.data.data?.hasBooking || false);
        if (res.data.data?.hasBooking) {
          setExistingBooking(res.data.data.booking);
        }
      } catch (error) {
        setHasBooking(false);
        setExistingBooking(null);
      }
    };

    if (providerUserId) {
      checkBookingStatus();
    }
  }, [providerUserId]);

  if (!provider) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, textAlign: 'center' }]}>{t('profile.providerUnavailable')}</Text>
        <Text style={[styles.aboutText, { color: colors.textSecondary, textAlign: 'center', marginBottom: 18 }]}>{t('profile.providerUnavailableDesc')}</Text>
        <TouchableOpacity style={[styles.bookButton, { backgroundColor: colors.accent, flex: 0, paddingHorizontal: 20 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.bookButtonText}>{t('common.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Pure dynamic data binding from DB
  const fullName = provider.user?.fullName || t('common.provider');
  const avatarUri = getMediaUrl(provider.user?.avatar);

  const numericRating = Number(provider.rating || 0);
  const ratingVal = numericRating > 0 ? numericRating.toFixed(1) : '0.0';
  const reviewCountVal = Number(provider.reviewCount || reviews.length || 0);
  const jobsCompletedCount = Number(provider.jobsCompleted || 0);
  const positiveReviewCount = reviews.filter(r => Number(r.rating || 0) >= 4).length;
  const successRate = jobsCompletedCount > 0 && reviewCountVal > 0
    ? Math.round((positiveReviewCount / reviewCountVal) * 100)
    : null;
  const experienceLevel = provider.experienceLevel || t('profile.standardLevel');
  const bio = provider.bio || t('profile.noBiography');
  const serviceArea = provider.serviceArea || 'Douala, Cameroon';
  const isOnline = provider.user?.isOnline || false;
  const isFavorite = favoriteProviderIds?.includes(provider.id);

  const ratePrice = provider.rate
    ? `${provider.rate.toLocaleString()} FCFA`
    : t('profile.contactForPrice');

  const skills = provider.skills && provider.skills.length > 0
    ? provider.skills
    : [];

  const socialLinks = provider.socialLinks || {};
  const hasSocialLinks = Object.values(socialLinks).some(Boolean);
  const portfolio = Array.isArray(provider.portfolio) ? provider.portfolio.filter(item => Object.values(item || {}).some(Boolean)) : [];
  const certificates = Array.isArray(provider.certificates) ? provider.certificates.filter(item => Object.values(item || {}).some(Boolean)) : [];
  const employmentHistory = Array.isArray(provider.employmentHistory) ? provider.employmentHistory.filter(item => Object.values(item || {}).some(Boolean)) : [];
  const earnedHighlights = [
    provider.verification === 'VERIFIED' ? {
      icon: 'shield-check',
      color: '#10B981',
      bg: isDarkMode ? '#115E5920' : '#ECFDF5',
      title: t('profile.backgroundVerified'),
      detail: t('profile.verifiedProfessional'),
    } : null,
    successRate !== null ? {
      icon: 'trophy-outline',
      color: '#2563EB',
      bg: isDarkMode ? '#1E3A8A20' : '#EFF6FF',
      title: `${successRate}% ${t('profile.jobSuccess')}`,
      detail: `${jobsCompletedCount} ${t('home.jobsCompleted')}`,
    } : null,
    jobsCompletedCount > 0 && numericRating >= 4 ? {
      icon: 'clock-outline',
      color: '#8B5CF6',
      bg: isDarkMode ? '#5B21B620' : '#F3E8FF',
      title: t('profile.onTimeCompletion'),
      detail: 'Based on client reviews',
    } : null,
    reviewCountVal >= 3 && numericRating >= 4.8 ? {
      icon: 'thumb-up-outline',
      color: '#F97316',
      bg: isDarkMode ? '#7C2D1220' : '#FFF7ED',
      title: t('profile.topRatedProvider'),
      detail: `${ratingVal} ${t('profile.rating')}`,
    } : null,
  ].filter(Boolean);

  const joinedDate = provider.user?.createdAt
    ? new Date(provider.user.createdAt).toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })
    : t('common.recent');

  const handleShare = async () => {
    try {
      const uid = providerUserId;
      const url = uid ? `https://fixam.app/profile/${uid}` : 'https://fixam.app/download';
      await Share.share({
        title: `${fullName} profile`,
        message: `Book ${fullName} on Fixam: ${url}`,
        ...(Platform.OS === 'ios' ? { url } : {}),
      });
    } catch (_) { }
  };

  const handleMessageProvider = async () => {
    if (!hasBooking) {
      Alert.alert(t('common.error'), t('profile.bookBeforeMessaging'));
      return;
    }

    try {
      if (!providerUserId) {
        Alert.alert(t('common.error'), t('profile.providerUnavailable'));
        return;
      }

      const res = await api.post('/chat/conversations', { participantId: providerUserId });
      const conversation = res.data.data;
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        receiverId: providerUserId,
        userName: fullName,
        avatar: avatarUri,
        otherParticipant: conversation.participants?.[0] || { id: providerUserId, role: 'PROVIDER' },
        isSupportConversation: conversation.isSystem,
      });
    } catch (error) {
      if (error.response?.status === 403) {
        Alert.alert(t('common.error'), t('profile.bookBeforeMessaging'));
        return;
      }
      Alert.alert(t('common.error'), error.response?.data?.message || t('common.tryAgain'));
    }
  };

  // Expertise styling
  const getSkillStyles = (skill) => {
    const s = skill.toLowerCase();
    if (s.includes('plumbing')) {
      return { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', icon: 'filter-variant' };
    }
    if (s.includes('pipe') || s.includes('install')) {
      return { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', icon: 'hammer-wrench' };
    }
    if (s.includes('repair')) {
      return { bg: '#F3E8FF', border: '#E9D5FF', text: '#5B21B6', icon: 'wrench' };
    }
    return { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412', icon: 'cog-outline' };
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#0F172A' : '#FAFAFA' }]}>
      

      {/* Persistent status bar background so time/battery are always visible */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: pastHeader ? (isDarkMode ? '#0F172A' : '#FAFAFA') : '#0E7490',
        zIndex: 50,
      }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 36 }}
        onScroll={(e) => setPastHeader(e.nativeEvent.contentOffset.y > 80)}
        scrollEventThrottle={16}
      >

        {/* Curved Gradient Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#0E7490', '#0D9488']}
            style={styles.curvedHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF' }]}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color={isDarkMode ? '#FFF' : '#0F172A'} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('profile.providerProfile')}</Text>
                <TouchableOpacity onPress={handleShare} style={[styles.headerBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF' }]}>
                  <MaterialCommunityIcons name="share-variant-outline" size={20} color={isDarkMode ? '#FFF' : '#0F172A'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleFavoriteProvider?.(provider.id)} style={[styles.headerBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF' }]}>
                  <MaterialCommunityIcons name={isFavorite ? 'heart' : 'heart-outline'} size={21} color={isFavorite ? '#EF4444' : (isDarkMode ? '#FFF' : '#0F172A')} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Hanging Avatar */}
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarBorderShadow, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF' }]}>
              <UserAvatar uri={avatarUri} name={fullName} size={102} />
              {provider.verification === 'VERIFIED' && (
                <View style={styles.verifiedOverlay}>
                  <MaterialCommunityIcons name="check" size={16} color="#FFF" />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Profile Details */}
        <View style={styles.profileDetailsSection}>
          <View style={styles.nameRow}>
            <Text style={[styles.heroName, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{fullName}</Text>
            {provider.verification === 'VERIFIED' && (
              <MaterialCommunityIcons name="check-decagram" size={22} color="#0D9488" />
            )}
          </View>

          {/* Verified Professional Badge */}
          {provider.verification === 'VERIFIED' && (
            <View style={styles.badgeWrapper}>
              <View style={[styles.verifiedProfessionalBadge, { backgroundColor: isDarkMode ? '#115E5920' : '#ECFDF5', borderColor: isDarkMode ? '#115E59' : '#A7F3D0' }]}>
                <MaterialCommunityIcons name="shield-check" size={14} color="#0D9488" style={{ marginRight: 4 }} />
                <Text style={styles.verifiedProfessionalText}>{t('profile.verifiedProfessional')}</Text>
              </View>
            </View>
          )}

          {/* Location */}
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#0D9488" />
            <Text style={[styles.locationText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{t('profile.nearby', { area: serviceArea })}</Text>
          </View>

          {/* Availability */}
          <View style={styles.availabilityRow}>
            <View style={[styles.greenDot, { backgroundColor: isOnline ? '#22C55E' : '#94A3B8' }]} />
            <Text style={[styles.availabilityText, { color: isOnline ? '#22C55E' : '#94A3B8' }]}>
              {isOnline ? t('profile.availableForWork') : t('home.offline')}
            </Text>
          </View>
        </View>

        {/* Stats Row Container Card */}
        <View style={styles.statsCardContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statRow}>
              {/* Rating */}
              <View style={[styles.statItem, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
                <View style={styles.statIconValRow}>
                  <View style={[styles.statIconWrap, { backgroundColor: isDarkMode ? '#78350F40' : '#FEF3C7' }]}>
                    <MaterialCommunityIcons name="star" size={17} color="#F59E0B" />
                  </View>
                  <Text style={[styles.statVal, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{ratingVal}</Text>
                </View>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#CBD5E1' : '#475569' }]} numberOfLines={1}>{t('profile.rating')}</Text>
                <Text style={[styles.statSubLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>{reviewCountVal} {t('profile.reviews')}</Text>
              </View>

              {/* Reviews */}
              <View style={[styles.statItem, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
                <View style={styles.statIconValRow}>
                  <View style={[styles.statIconWrap, { backgroundColor: isDarkMode ? '#1E3A8A40' : '#DBEAFE' }]}>
                    <MaterialCommunityIcons name="message-star-outline" size={17} color="#2563EB" />
                  </View>
                  <Text style={[styles.statVal, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{reviewCountVal}</Text>
                </View>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#CBD5E1' : '#475569' }]} numberOfLines={1}>{t('profile.reviews')}</Text>
                <Text style={[styles.statSubLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>{reviewCountVal > 0 ? t('common.recent') : t('profile.noReviews')}</Text>
              </View>
            </View>

            <View style={styles.statRow}>
              {/* Jobs Completed */}
              <View style={[styles.statItem, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
                <View style={styles.statIconValRow}>
                  <View style={[styles.statIconWrap, { backgroundColor: isDarkMode ? '#064E3B40' : '#D1FAE5' }]}>
                    <MaterialCommunityIcons name="briefcase-outline" size={17} color="#10B981" />
                  </View>
                  <Text style={[styles.statVal, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{jobsCompletedCount}</Text>
                </View>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#CBD5E1' : '#475569' }]} numberOfLines={1}>{t('home.jobsCompleted')}</Text>
                <Text style={[styles.statSubLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>{successRate !== null ? `${successRate}% success` : 'No completed jobs yet'}</Text>
              </View>

              {/* Level */}
              <View style={[styles.statItem, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
                <View style={styles.statIconValRow}>
                  <View style={[styles.statIconWrap, { backgroundColor: isDarkMode ? '#4C1D9540' : '#EDE9FE' }]}>
                    <MaterialCommunityIcons name="chart-bar" size={17} color="#8B5CF6" />
                  </View>
                  <Text style={[styles.statVal, { color: isDarkMode ? '#FFF' : '#0F172A' }]} numberOfLines={1}>{experienceLevel}</Text>
                </View>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#CBD5E1' : '#475569' }]} numberOfLines={1}>{t('home.levelLabel')}</Text>
                <Text style={[styles.statSubLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>{serviceArea}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* About Me Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{t('profile.aboutMe')}</Text>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutText, { color: isDarkMode ? '#94A3B8' : '#475569' }]}>{bio}</Text>

            {/* Joined Card */}
            <View style={[styles.joinedCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
              <MaterialCommunityIcons name="calendar-check-outline" size={24} color="#0D9488" />
              <Text style={styles.joinedTitle}>{t('profile.joined')}</Text>
              <Text style={[styles.joinedSub, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{joinedDate}</Text>
            </View>
          </View>
        </View>

        {/* Expertise Section */}
        {skills.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{t('profile.expertise')}</Text>
            <View style={styles.skillsList}>
              {skills.slice(0, 4).map((skill, i) => {
                const itemStyles = getSkillStyles(skill);
                return (
                  <View
                    key={i}
                    style={[
                      styles.skillTag,
                      { backgroundColor: isDarkMode ? '#1E293B' : itemStyles.bg, borderColor: isDarkMode ? '#1F2937' : itemStyles.border }
                    ]}
                  >
                    <MaterialCommunityIcons name={itemStyles.icon} size={15} color={isDarkMode ? '#2563EB' : itemStyles.text} style={{ marginRight: 5 }} />
                    <Text style={[styles.skillTagText, { color: isDarkMode ? '#FFF' : itemStyles.text }]}>{skill}</Text>
                  </View>
                );
              })}
              {skills.length > 4 && (
                <View style={[styles.skillTagMore, { backgroundColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
                  <Text style={[styles.skillTagMoreText, { color: isDarkMode ? '#FFF' : '#475569' }]}>+{skills.length - 4}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Highlights Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{t('profile.highlights')}</Text>
          {earnedHighlights.length > 0 ? (
            <View style={styles.highlightsGrid}>
              {earnedHighlights.map((item) => (
                <View key={item.title} style={[styles.highlightCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
                  <View style={[styles.highlightIconWrap, { backgroundColor: item.bg }]}>
                    <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.highlightText, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{item.title}</Text>
                  <Text style={[styles.highlightDetail, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{item.detail}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyProfileCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
              <MaterialCommunityIcons name="progress-clock" size={24} color="#94A3B8" />
              <Text style={[styles.emptyProfileText, { color: isDarkMode ? '#CBD5E1' : '#64748B' }]}>This provider is still building verified highlights.</Text>
            </View>
          )}
        </View>

        {portfolio.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Projects</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectScroll}>
              {portfolio.map((item, index) => (
                <View key={`${item.title || 'project'}-${index}`} style={[styles.projectCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.projectImage} />
                  ) : (
                    <View style={[styles.projectImage, styles.projectImageFallback]}>
                      <MaterialCommunityIcons name="image-outline" size={28} color="#94A3B8" />
                    </View>
                  )}
                  <Text style={[styles.projectTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]} numberOfLines={1}>{item.title || 'Project'}</Text>
                  {item.description ? <Text style={[styles.projectDesc, { color: isDarkMode ? '#CBD5E1' : '#64748B' }]} numberOfLines={3}>{item.description}</Text> : null}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {certificates.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Certificates</Text>
            {certificates.map((item, index) => (
              <View key={`${item.title || 'certificate'}-${index}`} style={[styles.credentialRow, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
                <View style={styles.credentialIcon}>
                  <MaterialCommunityIcons name="certificate-outline" size={22} color="#0D9488" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.credentialTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{item.title || 'Certificate'}</Text>
                  <Text style={[styles.credentialMeta, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{[item.issuer, item.year].filter(Boolean).join(' | ') || 'Credential added'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {employmentHistory.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Work history</Text>
            {employmentHistory.map((item, index) => (
              <View key={`${item.title || item.company || 'work'}-${index}`} style={[styles.credentialRow, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
                <View style={styles.credentialIcon}>
                  <MaterialCommunityIcons name="briefcase-outline" size={22} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.credentialTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{item.title || item.company || 'Work experience'}</Text>
                  <Text style={[styles.credentialMeta, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{[item.company, item.period].filter(Boolean).join(' | ')}</Text>
                  {item.description ? <Text style={[styles.credentialDesc, { color: isDarkMode ? '#CBD5E1' : '#64748B' }]}>{item.description}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Linked Accounts Section - Render dynamic accounts only */}
        {hasSocialLinks && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{t('profile.linkedAccounts')}</Text>
            {Object.keys(socialLinks).filter(key => socialLinks[key]).map((key) => {
              const label = key === 'tiktok' ? 'TikTok' : key === 'linkedin' ? 'LinkedIn' : key === 'facebook' ? 'Facebook' : 'Instagram';

              // Branded Social Media Logo URLs
              const logoUrls = {
                tiktok: 'https://cdn-icons-png.flaticon.com/512/3046/3046124.png',
                linkedin: 'https://cdn-icons-png.flaticon.com/512/174/174857.png',
                facebook: 'https://cdn-icons-png.flaticon.com/512/124/124010.png',
                instagram: 'https://cdn-icons-png.flaticon.com/512/174/174855.png'
              };

              const cleanUrl = socialLinks[key];

              // Robust handle extractor
              let handleText = cleanUrl;
              if (cleanUrl.includes('/')) {
                const parts = cleanUrl.replace(/\/$/, '').split('/');
                handleText = parts[parts.length - 1] || cleanUrl;
              }
              handleText = handleText.replace(/^@/, '');

              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.linkedAccountCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9', marginBottom: 8 }]}
                  onPress={() => Linking.openURL(cleanUrl)}
                >
                  <Image source={{ uri: logoUrls[key] }} style={{ width: 22, height: 22, resizeMode: 'contain' }} />
                  <Text style={[styles.linkedAccountLabel, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{label}</Text>
                  <Text style={styles.linkedAccountUser} numberOfLines={1}>@{handleText}</Text>
                  <MaterialCommunityIcons name="open-in-new" size={18} color="#94A3B8" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Dynamic Reviews Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.reviewsHeaderRow}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{t('profile.recentReviews')}</Text>
            {reviews.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('HelpCenter' /* or proper reviews navigation */)}>
                <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {reviews.length === 0 ? (
            <View style={[styles.reviewCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9', paddingVertical: 24, alignItems: 'center' }]}>
              <MaterialCommunityIcons name="star-outline" size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
              <Text style={[styles.reviewComment, { color: colors.textSecondary, textAlign: 'center' }]}>
                {t('profile.noReviews')}
              </Text>
            </View>
          ) : (
            reviews.slice(0, 3).map((review, i) => {
              const reviewerName = review.job?.client?.fullName || t('profile.verifiedClient');
              const reviewerAvatarUri = getMediaUrl(review.job?.client?.avatar);
              const reviewDateText = review.createdAt
                ? new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : t('common.recent');

              return (
                <View
                  key={review.id || i}
                  style={[styles.reviewCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9', marginBottom: 12 }]}
                >
                  <View style={styles.reviewTopRow}>
                    <UserAvatar uri={reviewerAvatarUri} name={reviewerName} size={44} radius={14} style={styles.reviewAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={styles.reviewerNameRow}>
                        <Text style={[styles.reviewerName, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{reviewerName}</Text>
                        <View style={[styles.verifiedClientBadge, { backgroundColor: isDarkMode ? '#1E3A8A40' : '#EFF6FF' }]}>
                          <Text style={styles.verifiedClientText}>{t('profile.verifiedClient')}</Text>
                        </View>
                      </View>
                      <View style={styles.reviewRatingRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <MaterialCommunityIcons
                            key={star}
                            name={star <= (review.rating || 5) ? "star" : "star-outline"}
                            size={14}
                            color="#F59E0B"
                            style={{ marginRight: 2 }}
                          />
                        ))}
                        <Text style={[styles.reviewRatingText, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>
                          {(review.rating || 5).toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>{reviewDateText}</Text>
                  </View>
                  <Text style={[styles.reviewComment, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>
                    {review.comment || t('profile.reviewFallback')}
                  </Text>
                </View>
              );
            })
          )}

          {/* Dynamic Dots Indicator based on review list count */}
          {reviews.length > 1 && (
            <View style={styles.dotsContainer}>
              {reviews.slice(0, 3).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx === 0 ? styles.dotActive : null,
                    { backgroundColor: idx === 0 ? '#0D9488' : (isDarkMode ? '#475569' : '#CBD5E1') }
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {existingBooking && (
          <View style={styles.sectionContainer}>
            <View style={[styles.activeBookingCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <MaterialCommunityIcons name="calendar-check-outline" size={22} color="#0D9488" style={{ marginRight: 8 }} />
                <Text style={[styles.activeBookingTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Active Booking</Text>
              </View>
              <Text style={[styles.activeBookingText, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>Duration: {existingBooking.bookingDuration || 'DAY'}</Text>
              <Text style={[styles.activeBookingText, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>Type: {existingBooking.urgencyLevel || 'NORMAL'}</Text>
              <Text style={[styles.activeBookingText, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>
                Date: {existingBooking.bookingDate ? new Date(existingBooking.bookingDate).toLocaleDateString() : 'Not set'}
              </Text>
              <Text style={[styles.activeBookingText, { color: isDarkMode ? '#CBD5E1' : '#475569', fontWeight: '700', marginTop: 4 }]}>
                Status: {existingBooking.status}
              </Text>
            </View>
          </View>
        )}

        {hasBooking && (
          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={[styles.messageUnlockedButton, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}
              onPress={handleMessageProvider}
            >
              <MaterialCommunityIcons name="message-text-outline" size={22} color="#0D9488" />
              <Text style={[styles.messageUnlockedText, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Message provider</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Booking CTA */}
        <View style={styles.staticBookingContainer}>
          <TouchableOpacity
            style={[styles.staticBookButton, { backgroundColor: colors.accent, opacity: providerUserId ? 1 : 0.55 }]}
            disabled={!providerUserId}
            onPress={() => navigation.navigate('BookingForm', { providerId: providerUserId, providerName: fullName, providerRate: provider.rate || 0 })}
          >
            <MaterialCommunityIcons name="calendar-check" size={22} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.staticBookButtonText}>{t('profile.bookNow')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Curved Header Styles
  headerContainer: {
    position: 'relative',
    height: 190,
    marginBottom: 65,
  },
  curvedHeader: {
    height: 140,
    borderBottomLeftRadius: 160,
    borderBottomRightRadius: 160,
    transform: [{ scaleX: 1.15 }],
    overflow: 'hidden',
  },
  headerSafeArea: {
    flex: 1,
    transform: [{ scaleX: 0.87 }], // Counteract scaleX stretch for layout items
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 64,
    gap: 10,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },

  // Hanging Avatar Styles
  avatarWrapper: {
    position: 'absolute',
    top: 92,
    left: '50%',
    marginLeft: -55,
    marginTop: 16,
    zIndex: 10,
  },
  avatarBorderShadow: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  heroAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  verifiedOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },

  // Profile Details Styles
  profileDetailsSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
  },
  badgeWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  verifiedProfessionalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  verifiedProfessionalText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Stats Card Styles
  statsCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 26,
  },
  statsGrid: {
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 112,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  statIconValRow: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    marginBottom: 10,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBookingCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  activeBookingTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  activeBookingText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  statVal: {
    flex: 1,
    minWidth: 0,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '900',
  },
  statLabel: {
    width: '100%',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  statSubLabel: {
    width: '100%',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    marginTop: 4,
  },

  // Section Standard Container
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },

  // About Me Section Styles
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  aboutText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  joinedCard: {
    width: 96,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  joinedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 6,
    marginBottom: 2,
  },
  joinedSub: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Expertise Section Styles
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  skillTagText: {
    fontSize: 13,
    fontWeight: '700',
  },
  skillTagMore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillTagMoreText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Highlights Section Styles
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  highlightCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 12,
  },
  highlightIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  highlightDetail: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    marginTop: 5,
  },
  highlightCheckDot: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyProfileCard: {
    minHeight: 86,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  emptyProfileText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  projectScroll: {
    gap: 12,
    paddingRight: 20,
  },
  projectCard: {
    width: 190,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  projectImage: {
    width: '100%',
    height: 112,
    backgroundColor: '#E2E8F0',
  },
  projectImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  projectDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 14,
  },
  credentialRow: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  credentialIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  credentialTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
  },
  credentialMeta: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  credentialDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 7,
  },

  // Linked Accounts Styles
  linkedAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 1,
  },
  linkedAccountLabel: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 10,
  },
  linkedAccountUser: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 12,
    flex: 1,
  },

  // Recent Reviews Styles
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D9488',
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  reviewerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '800',
  },
  verifiedClientBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedClientText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  reviewDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 14,
  },

  staticBookingContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  messageUnlockedButton: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  messageUnlockedText: {
    fontSize: 15,
    fontWeight: '900',
  },
  staticBookButton: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  staticBookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  bookButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default ProviderProfileScreen;
