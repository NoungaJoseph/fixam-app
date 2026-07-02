import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, Platform, Image, Dimensions, Switch, Modal, ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getCurrencyForUser } from '../../constants/countries';
import { useLanguage } from '../../context/LanguageContext';
import { getProviderProgress } from '../../utils/providerProgress';
import { translateService } from '../../i18n/translate';
import WelcomeModal from '../../components/Common/WelcomeModal';
import ProviderTour from '../../components/Common/ProviderTour';
import NewsTicker from '../../components/NewsTicker';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'view-grid' },
  { id: 'plumbing', label: 'Plumbing', aliases: ['plumbing', 'plomberie'], icon: 'water-pump' },
  { id: 'electrical', label: 'Electrical', aliases: ['electrical', 'electrician', 'electricite', '├®lectricit├®'], icon: 'lightning-bolt' },
  { id: 'cleaning', label: 'Cleaning', aliases: ['cleaning', 'house cleaning', 'office cleaning', 'nettoyage', 'menage', 'm├®nage'], icon: 'broom' },
  { id: 'delivery', label: 'Delivery Driver', aliases: ['delivery', 'delivery driver', 'livraison', 'coursier'], icon: 'bike' },
];

const LEARN_CARDS = [
  {
    id: '1',
    step: 'STEP 1',
    title: 'Complete\nyour profile',
    desc: 'Get verified and get\nmore jobs',
    image: require('../../../assets/onboarding/learn_step1.png'),
    colors: ['#0D9488', '#14B8A6']
  },
  {
    id: '2',
    step: 'STEP 2',
    title: 'Accept booked\nservices',
    desc: 'Review the date, place,\nand agreed budget',
    image: require('../../../assets/onboarding/learn_step2.png'),
    colors: ['#2563EB', '#2563EB']
  },
  {
    id: '3',
    step: 'STEP 3',
    title: 'Agree and\ndeliver',
    desc: 'Confirm expectations,\nthen complete the work',
    image: require('../../../assets/onboarding/learn_step3.png'),
    colors: ['#8B5CF6', '#A78BFA']
  },
  {
    id: '4',
    step: 'TIPS',
    title: 'Pay on delivery\nworkflow',
    desc: 'Clients pay when the\nservice is completed',
    image: require('../../../assets/onboarding/learn_tips.png'),
    colors: ['#F59E0B', '#FBBF24']
  }
];

const ProviderHomeScreen = ({ navigation }) => {
  const {
    isProviderOnline, updateProviderStatus,
    walletBalance, visibleJobs, notificationCount, unreadCount, isInitialLoad, myBookingsList
  } = useAppContext();
  const { user, isNewUser, clearNewUser } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [now, setNow] = useState(Date.now());
  const [slideIndex, setSlideIndex] = useState(0);
  const learnScrollRef = useRef(null);

  const [favorites, setFavorites] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [rankModalVisible, setRankModalVisible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Refs for tour highlights
  const topUpRef = useRef(null);
  const viewAllJobsRef = useRef(null);
  const onlineToggleRef = useRef(null);
  const findJobsRef = useRef(null);
  const myJobsRef = useRef(null);
  const providerMainScrollRef = useRef(null);

  const isNavigatingRef = useRef(false);
  const handleSafeNavigate = (route, params) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    navigation.navigate(route, params);
    setTimeout(() => { isNavigatingRef.current = false; }, 500);
  };

  const [myJobs, setMyJobs] = useState([]);

  const tourSteps = useMemo(() => [
    {
      ref: topUpRef,
      icon: 'wallet-plus-outline',
      title: t('tour.providerTopUpTitle'),
      text: t('tour.providerTopUpText'),
    },
    {
      ref: onlineToggleRef,
      icon: 'circle-slice-8',
      title: t('tour.providerOnlineTitle'),
      text: t('tour.providerOnlineText'),
    },
    {
      ref: findJobsRef,
      icon: 'briefcase-search-outline',
      title: t('tour.providerFindJobsTitle'),
      text: t('tour.providerFindJobsText'),
    },
    {
      ref: viewAllJobsRef,
      icon: 'fire',
      title: t('tour.providerViewAllTitle'),
      text: t('tour.providerViewAllText'),
    },
  ], [t]);

  useEffect(() => {
    if (isNewUser && !isInitialLoad) {
      const timer = setTimeout(() => setShowWelcome(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isNewUser, isInitialLoad]);

  const fetchMyJobs = React.useCallback(async () => {
    try {
      const { default: api } = await import('../../services/api');
      const [jobsRes, bookingsRes] = await Promise.allSettled([
        api.get('/jobs/my-jobs'),
        api.get('/bookings/mine?role=PROVIDER')
      ]);
      const jobs = jobsRes.status === 'fulfilled' ? (jobsRes.value.data.data || []) : [];
      const bookings = bookingsRes.status === 'fulfilled' ? (bookingsRes.value.data.data || []) : [];
      setMyJobs([...jobs, ...bookings]);
    } catch (e) {
      console.log('Failed to fetch my jobs for level progress', e);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchMyJobs);
    fetchMyJobs();
    return unsub;
  }, [fetchMyJobs, navigation]);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const favs = await AsyncStorage.getItem('@job_favorites');
        const dism = await AsyncStorage.getItem('@job_dismissed');
        if (favs) setFavorites(JSON.parse(favs));
        if (dism) setDismissed(JSON.parse(dism));
      } catch (e) {
        console.log('Failed to load preferences', e);
      }
    };
    loadPreferences();
  }, []);

  const toggleFavorite = async (jobId) => {
    try {
      let newFavs;
      if (favorites.includes(jobId)) {
        newFavs = favorites.filter(id => id !== jobId);
      } else {
        newFavs = [...favorites, jobId];
      }
      setFavorites(newFavs);
      await AsyncStorage.setItem('@job_favorites', JSON.stringify(newFavs));
    } catch (e) {
      console.log('Failed to save favorite', e);
    }
  };

  const dismissJob = async (jobId) => {
    try {
      const newDism = [...dismissed, jobId];
      setDismissed(newDism);
      await AsyncStorage.setItem('@job_dismissed', JSON.stringify(newDism));
    } catch (e) {
      console.log('Failed to dismiss job', e);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let timer;
    if (LEARN_CARDS.length > 0) {
      timer = setInterval(() => {
        setSlideIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % LEARN_CARDS.length;
          learnScrollRef.current?.scrollTo({
            x: nextIndex * (width - 70 + 12),
            animated: true
          });
          return nextIndex;
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, []);

  const getPostedAgo = (dateValue) => {
    if (!dateValue) return '10 min ago';
    const created = new Date(dateValue.endsWith('Z') ? dateValue : dateValue + 'Z');
    if (Number.isNaN(created.getTime())) return '10 min ago';
    const diffMs = Math.max(0, now - created.getTime());
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredJobs = visibleJobs.filter(job => {
    if (dismissed.includes(job.id)) return false;
    const q = search.toLowerCase();
    const category = String(job.category || '');
    const categoryText = category.toLowerCase();
    const translatedCategoryText = translateService(category).toLowerCase();
    const matchSearch = !q || job.title?.toLowerCase().includes(q)
      || categoryText.includes(q)
      || translatedCategoryText.includes(q)
      || job.location?.toLowerCase().includes(q);
    const activeCategoryConfig = CATEGORIES.find((cat) => cat.id === activeCategory);
    const matchCat = activeCategory === 'all'
      || activeCategoryConfig?.aliases?.some((alias) => categoryText.includes(alias) || translatedCategoryText.includes(alias));
    return matchSearch && matchCat;
  });

  // Sort: most recent first, high budget jobs bumped up if posted within 48h
  const prioritizedJobs = [...filteredJobs].sort((a, b) => {
    const ageA = now - new Date(a.createdAt || 0).getTime();
    const ageB = now - new Date(b.createdAt || 0).getTime();
    const recent48h = 48 * 60 * 60 * 1000;
    const aIsHighPriority = ageA < recent48h && (a.budget || 0) >= 25000;
    const bIsHighPriority = ageB < recent48h && (b.budget || 0) >= 25000;
    if (aIsHighPriority && !bIsHighPriority) return -1;
    if (!aIsHighPriority && bIsHighPriority) return 1;
    return ageA - ageB; // most recent first
  });

  const firstName = user?.fullName?.split(' ')[0] || t('common.provider');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('home.goodMorning') : hour < 17 ? t('home.goodAfternoon') : t('home.goodEvening');
  const progress = getProviderProgress(user, myJobs);
  const completedJobsCount = progress.completedCount;
  const providerStats = user?.providerProfile || {};
  const trustScore = Number(providerStats.rating || 0).toFixed(1);
  const skillRank = providerStats.skillRank || 'Newcomer';
  const rankStyle = {
    Newcomer: { bg: '#F1F5F9', color: '#64748B', icon: 'account-outline' },
    Beginner: { bg: '#ECFDF5', color: '#059669', icon: 'leaf' },
    'Rising Star': { bg: '#EFF6FF', color: '#2563EB', icon: 'star-outline' },
    Skilled: { bg: '#F3E8FF', color: '#7C3AED', icon: 'shield-check' },
    Expert: { bg: '#FFF7ED', color: '#EA580C', icon: 'medal-outline' },
    Master: { bg: '#FEF2F2', color: '#DC2626', icon: 'trophy-outline' },
    Elite: { bg: '#FEF3C7', color: '#B45309', icon: 'crown-outline' },
  }[skillRank] || { bg: '#F1F5F9', color: '#64748B', icon: 'account-outline' };
  const localizedLearnCards = LEARN_CARDS.map((card) => {
    const copy = {
      '1': [t('home.learn.step1'), t('home.learn.completeProfileTitle'), t('home.learn.completeProfileDesc')],
      '2': [t('home.learn.step2'), t('home.learn.acceptServicesTitle'), t('home.learn.acceptServicesDesc')],
      '3': [t('home.learn.step3'), t('home.learn.deliverTitle'), t('home.learn.deliverDesc')],
      '4': [t('home.learn.tips'), t('home.learn.paymentTitle'), t('home.learn.paymentDesc')],
    }[card.id];
    return { ...card, step: copy[0], title: copy[1], desc: copy[2] };
  });

  const handleScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / (width - 60));
    if (slide !== slideIndex) {
      setSlideIndex(slide);
    }
  };

  const JobCard = ({ item: job }) => {
    const isFav = favorites.includes(job.id);

    const getTags = (j) => {
      const tags = [];
      if (j.category) tags.push(translateService(j.category).toUpperCase());
      tags.push(t('home.experienced'));
      const titleWords = j.title?.split(' ') || [];
      if (titleWords.length > 0) tags.push(titleWords[0].toLowerCase());
      return tags.slice(0, 3);
    };

    return (
      <TouchableOpacity
        style={[styles.jobCard, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
        onPress={() => navigation.navigate('TaskDetails', { task: job, taskId: job.id })}
        activeOpacity={0.84}
      >

        {/* Title Row with Actions */}
        <View style={styles.jobTopRow}>
          <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={2}>{job.title || t('home.taskOpportunity')}</Text>
          <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => dismissJob(job.id)}>
              <MaterialCommunityIcons name="thumb-down-outline" size={26} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleFavorite(job.id)}>
              <MaterialCommunityIcons name={isFav ? "heart" : "heart-outline"} size={26} color={isFav ? "#EF4444" : colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Subtitle */}
        <Text style={[styles.jobSubtitle, { color: colors.textSecondary }]}>
          {t('home.fixedPrice')} - {(job.category || t('home.work')).toUpperCase()} - {t('home.estimatedBudget')}: {job.budget ? job.budget.toLocaleString() : '25,000'} {getCurrencyForUser(job.country || user?.country || 'Cameroon')}
        </Text>

        {/* Description */}
        <Text style={[styles.jobDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {job.description || t('home.jobFallbackDescription')}
          <Text style={styles.moreText}> {t('home.more')}</Text>
        </Text>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {getTags(job).map((tag, idx) => (
            <View key={idx} style={[styles.tagChip, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Stats / Time Row */}
        <View style={styles.statsRow}>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>
            {t('home.reviewsSpent', { reviews: job.clientReviewCount ?? 0, spent: job.clientSpendingTier || 'New client' })}
          </Text>
          {job.createdAt ? (
            <View style={styles.timeInline}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.timeInlineText, { color: colors.textSecondary }]}>{getPostedAgo(job.createdAt)}</Text>
            </View>
          ) : null}
        </View>

        {/* Bottom Row */}
        <View style={styles.jobBottomRow}>
          <View style={[styles.locationRow, { flex: 1, marginRight: 12 }]}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>{job.location || '4.1070, 9.7619'}</Text>
          </View>
          <TouchableOpacity style={styles.applyBtn} onPress={() => navigation.navigate('TaskDetails', { taskId: job.id })}>
            <Text style={styles.applyBtnText}>{t('home.apply')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (isInitialLoad) {
    return (
      <>
        <StatusBar style="light" backgroundColor="#14B8A6" />
        <SafeAreaView style={[styles.container, { backgroundColor: '#14B8A6' }]} edges={['top']}>
          <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text style={{ marginTop: 16, color: colors.text, fontSize: 16, fontWeight: '500' }}>{t('common.loading', 'Loading Fixam...')}</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }



  return (
    <>
      <StatusBar style="light" backgroundColor="#14B8A6" />
      <SafeAreaView style={[styles.container, { backgroundColor: '#14B8A6' }]} edges={['top']}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* FIXED FLOATING SEARCH/FILTER AT TOP */}
          <ScrollView ref={providerMainScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { backgroundColor: colors.background }]}>

        {/* ÔöÇÔöÇ 1. PREMIUM HEADER SECTION ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
        <View style={styles.headerTop}>
          {/* Hamburger circular menu */}
          <TouchableOpacity style={[styles.menuBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.openDrawer()}>
            <MaterialCommunityIcons name="menu" size={22} color={colors.text} />
          </TouchableOpacity>

          {/* Profile & Greeting Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileInfo}>
              <Text style={[styles.greetingText, { color: colors.textSecondary }]}>{greeting} 👋</Text>
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>{firstName}</Text>
                <View style={styles.levelBadge}>
                  <MaterialCommunityIcons name="star-circle" size={12} color="#0D9488" />
                  <Text style={styles.levelText}>{t('home.level', { level: progress.level })}</Text>
                </View>
              </View>
              <Text style={[styles.jobsNearText, { color: colors.textSecondary }]} numberOfLines={1}>
                <Text style={{ color: '#22C55E' }}>•</Text> {t('home.newJobsNearby', { count: filteredJobs.length })}
              </Text>
            </View>
          </View>

          {/* Bell Icon with badge */}
          <TouchableOpacity style={[styles.bellBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('Notifications')}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.text} />
            {notificationCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ÔöÇÔöÇ 2. SUB-HEADER PILLS ROW ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subHeaderScroll}
          style={{ flexGrow: 0, marginBottom: 16 }}
        >
          <TouchableOpacity style={[styles.subPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.subPillText, { color: colors.text }]}>📍 {user?.location || t('home.locationDefault') || 'Douala, Cameroon'}</Text>
            <MaterialCommunityIcons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.subPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.subPillText, { color: colors.text }]}>🔥 {t('home.dayStreak', { count: progress.dailyStreak })}</Text>
          </View>

          <View style={[styles.subPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="star" size={16} color="#22C55E" />
            <View style={styles.subPillCol}>
              <Text style={[styles.subPillVal, { color: colors.text }]}>{trustScore}</Text>
              <Text style={[styles.subPillSub, { color: colors.textSecondary }]}>{t('home.trustScore')}</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.subPill, { backgroundColor: rankStyle.bg, borderColor: colors.border }]} onPress={() => setRankModalVisible(true)}>
            <MaterialCommunityIcons name={rankStyle.icon} size={16} color={rankStyle.color} />
            <View style={styles.subPillCol}>
              <Text style={[styles.subPillVal, { color: rankStyle.color }]}>{t(`home.ranks.${skillRank}.name`)}</Text>
              <Text style={[styles.subPillSub, { color: colors.textSecondary }]}>{t('home.rank')}</Text>
            </View>
            <MaterialCommunityIcons name="information-outline" size={14} color={rankStyle.color} />
          </TouchableOpacity>
        </ScrollView>

        <View style={{ marginBottom: 16, marginTop: -6, zIndex: -1 }}>
          <NewsTicker />
        </View>

        {/* ÔöÇÔöÇ 3. PREMIUM BALANCE STATS CARD ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
        <LinearGradient
          ref={topUpRef}
          colors={['#1D4ED8', '#0D9488']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.statsCard}
        >
          {/* Column 1: Coins Balance */}
          <View style={styles.cardCol}>
            <Text style={styles.cardLabel}>{t('home.yourBalance')}</Text>
            <Text style={styles.cardValue}>{walletBalance} {t('payments.coins')}</Text>
            <TouchableOpacity
              style={styles.topUpBtn}
              onPress={() => navigation.getParent()?.getParent()?.navigate('Wallet', { screen: 'CoinSystem' })}
            >
              <Text style={styles.topUpText}>{t('home.topUp')}</Text>
              <MaterialCommunityIcons name="plus" size={14} color="#0D9488" />
            </TouchableOpacity>
          </View>

          <View style={styles.colDivider} />

          {/* Column 2: Jobs Completed */}
          <View style={[styles.cardCol, styles.jobsCompletedCol]}>
            <Text style={styles.cardLabel}>{t('home.jobsCompleted')}</Text>
            <Text style={styles.cardValue}>{completedJobsCount} {t('home.total')}</Text>

            {/* Vertical mini bars */}
            <View style={styles.miniBarRow}>
              {[18, 28, 16, 38, 26, 44, 32].map((height, index) => (
                <View key={index} style={[styles.miniBar, { height, backgroundColor: index === 5 ? '#FFF' : 'rgba(255, 255, 255, 0.45)' }]} />
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* ÔöÇÔöÇ 4. UNIFIED AVAILABILITY & QUICK NAV CARD ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
        <View style={[styles.levelProgressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.levelProgressTop}>
            <Text style={[styles.levelProgressTitle, { color: colors.text }]}>{t('home.level', { level: progress.level })}</Text>
            <Text style={[styles.levelProgressMeta, { color: colors.textSecondary }]}>{t('home.completedToday')}: {progress.completedToday}</Text>
          </View>
          <View style={[styles.levelProgressTrack, { backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
            <View style={[styles.levelProgressFill, { width: `${Math.round(progress.progress * 100)}%` }]} />
          </View>
          <Text style={[styles.levelProgressHint, { color: colors.textSecondary }]}>
            {t('home.nextLevel', { count: progress.remaining, level: progress.level + 1 })}
          </Text>
        </View>

        <View style={[styles.unifiedNavCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Top Section: Availability */}
          <View style={[styles.availSection, { borderBottomColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
            <View style={styles.availTextCol}>
              <Text style={[styles.availTitle, { color: colors.text }]}>{t('home.availableForWork')}</Text>
              <Text style={[styles.availSubText, { color: colors.textSecondary }]}>{t('home.availabilityState', { state: isProviderOnline ? t('home.onlineVisible') : t('home.offlineHidden') })}</Text>
              <View style={styles.onlinePillRow}>
                <View style={[styles.onlinePill, { borderColor: isProviderOnline ? '#10B981' : colors.border, backgroundColor: isDarkMode ? '#1E293B' : '#FFF' }]}>
                  <Text style={[styles.onlinePillText, { color: isProviderOnline ? '#10B981' : colors.textSecondary }]}>
                    {isProviderOnline ? t('home.online') : t('home.offline')}
                  </Text>
                </View>
              </View>
            </View>
            <Switch
              ref={onlineToggleRef}
              value={isProviderOnline}
              onValueChange={updateProviderStatus}
              trackColor={{ true: '#10B981', false: '#CBD5E1' }}
              thumbColor="#FFF"
            />
          </View>
          {/* Bottom Section: Quick Nav Grid */}
          <View style={styles.quickNavGridContainer}>
            {/* Bookings */}
            <TouchableOpacity ref={findJobsRef} style={styles.quickNavCard} onPress={() => handleSafeNavigate('BookingsList')}>
              <View style={[styles.quickNavIconWrap, { backgroundColor: '#E6FDF3' }]}>
                <MaterialCommunityIcons name="calendar-check-outline" size={24} color="#0D9488" />
                {myBookingsList?.filter(b => b.status === 'PENDING').length > 0 && (
                  <View style={styles.quickNavBadge}>
                    <Text style={styles.quickNavBadgeText}>{myBookingsList.filter(b => b.status === 'PENDING').length}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.quickNavCardLabel, { color: colors.text }]}>Bookings</Text>
            </TouchableOpacity>

            {/* Messages */}
            <TouchableOpacity ref={myJobsRef} style={styles.quickNavCard} onPress={() => handleSafeNavigate('Messages')}>
              <View style={[styles.quickNavIconWrap, { backgroundColor: '#F3E8FF' }]}>
                <MaterialCommunityIcons name="message-text" size={24} color="#7C3AED" />
                {unreadCount > 0 && (
                  <View style={styles.quickNavBadge}>
                    <Text style={styles.quickNavBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.quickNavCardLabel, { color: colors.text }]}>{t('tabs.messages')}</Text>
            </TouchableOpacity>

            {/* Wallet */}
            <TouchableOpacity style={styles.quickNavCard} onPress={() => {
              if (isNavigatingRef.current) return;
              isNavigatingRef.current = true;
              navigation.getParent()?.getParent()?.navigate('Wallet', { screen: 'CoinSystem' });
              setTimeout(() => { isNavigatingRef.current = false; }, 500);
            }}>
              <View style={[styles.quickNavIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="wallet" size={24} color="#D97706" />
              </View>
              <Text style={[styles.quickNavCardLabel, { color: colors.text }]}>{t('home.wallet')}</Text>
            </TouchableOpacity>

            {/* My Stats */}
            <TouchableOpacity style={styles.quickNavCard} onPress={() => handleSafeNavigate('Stats')}>
              <View style={[styles.quickNavIconWrap, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="chart-bar" size={24} color="#2563EB" />
              </View>
              <Text style={[styles.quickNavCardLabel, { color: colors.text }]}>{t('home.myStats')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ÔöÇÔöÇ 5. "LEARN FIXAM" SLIDER SECTION ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
        <View style={styles.learnHeader}>
          <Text style={[styles.learnTitle, { color: colors.text }]}>{t('home.learnFixam')}</Text>
        </View>

        {/* Step cards list */}
        <ScrollView
          ref={learnScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.learnScroll}
        >
          {localizedLearnCards.map((card) => (
            <LinearGradient
              key={card.id}
              colors={card.colors}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.learnCard}
            >
              <View style={styles.learnLeft}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{card.step}</Text>
                </View>
                <Text style={styles.learnCardTitle}>{card.title}</Text>
                <Text style={styles.learnCardDesc}>{card.desc}</Text>
              </View>
              <Image source={card.image} style={styles.learnCardImage} resizeMode="contain" />
            </LinearGradient>
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {localizedLearnCards.map((_, index) => (
            <View
              key={index}
              style={[
                styles.slideDot,
                slideIndex === index && styles.slideDotActive
              ]}
            />
          ))}
        </View>

        {/* ÔöÇÔöÇ 6. SEARCH BAR & CATEGORIES ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={colors.placeholder} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('home.searchJobs')}
              placeholderTextColor={colors.placeholder}
              value={search}
              onChangeText={setSearch}
              autoFocus={false}
              blurOnSubmit={true}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="tune-variant" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Categories Horizontal scrolling pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, {
                  backgroundColor: active ? '#0D9488' : colors.card,
                  borderColor: active ? '#0D9488' : colors.border,
                }]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <MaterialCommunityIcons name={cat.icon} size={16} color={active ? '#FFF' : colors.textSecondary} />
                <Text style={[styles.catText, { color: active ? '#FFF' : colors.text }]}>
                  {cat.id === 'all' ? t('notifications.all') : translateService(cat.label)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ÔöÇÔöÇ 7. "LIVE JOBS NEAR YOU" SECTION ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.liveDot, { backgroundColor: '#22C55E' }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.liveJobsNearYou')}</Text>
            <Text style={styles.liveCountText}>• {t('home.jobsAvailable', { count: filteredJobs.length })}</Text>
          </View>
          <TouchableOpacity ref={viewAllJobsRef} onPress={() => navigation.navigate('Find Jobs')}>
            <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
          </TouchableOpacity>
        </View>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="briefcase-search-outline" size={60} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('home.noJobsAvailable')}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t('home.newJobsRealtime')}</Text>
          </View>
        ) : (
          prioritizedJobs.slice(0, 5).map(item => <JobCard key={item.id} item={item} />)
        )}

        {/* Space at the bottom to avoid tabbar overlap */}
        <View style={{ height: 120 }} />
      </ScrollView>
      <Modal visible={rankModalVisible} transparent animationType="fade" onRequestClose={() => setRankModalVisible(false)}>
        <View style={styles.rankModalOverlay}>
          <View style={[styles.rankModalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.rankModalTitle, { color: colors.text }]}>{t('home.rankGuideTitle')}</Text>
            {['Newcomer', 'Beginner', 'Rising Star', 'Skilled', 'Expert', 'Master', 'Elite'].map((rank) => (
              <Text key={rank} style={[styles.rankModalText, { color: colors.textSecondary }]}>
                {t(`home.ranks.${rank}.description`)}
              </Text>
            ))}
            <TouchableOpacity style={[styles.rankModalClose, { backgroundColor: colors.accent }]} onPress={() => setRankModalVisible(false)}>
              <Text style={styles.rankModalCloseText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Welcome celebration modal */}
      <WelcomeModal
        visible={showWelcome}
        name={firstName}
        role={user?.role}
        onDone={() => {
          setShowWelcome(false);
          clearNewUser();
          setTimeout(() => setShowTour(true), 400);
        }}
      />

      {/* Provider quick tour */}
      <ProviderTour
        steps={tourSteps}
        userId={user?.id}
        visible={showTour}
        onDone={() => setShowTour(false)}
        scrollViewRef={providerMainScrollRef}
      />
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: '#FAFAFA' },

  // 1. Premium Header Top Style
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  profileSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  profileInfo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '900',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FDF3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
    marginLeft: 2,
  },
  jobsNearText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },

  // 2. Sub Header Pills Row
  subHeaderScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 8,
  },
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1.5,
  },
  subPillCol: {
    marginLeft: 2,
    justifyContent: 'center',
  },
  subPillVal: {
    fontSize: 12.5,
    fontWeight: '900',
    lineHeight: 14,
  },
  subPillSub: {
    fontSize: 8.5,
    fontWeight: '700',
    lineHeight: 10,
  },
  subPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rankModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  rankModalCard: { borderRadius: 18, padding: 20 },
  rankModalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  rankModalText: { fontSize: 13, lineHeight: 20, fontWeight: '600', marginBottom: 8 },
  rankModalClose: { height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  rankModalCloseText: { color: '#FFF', fontSize: 14, fontWeight: '900' },

  // 3. Premium Stats Dashboard Card
  statsCard: {
    marginHorizontal: 0,
    borderRadius: 0,
    paddingVertical: 22,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 0,
  },
  cardCol: {
    flex: 1,
    alignItems: 'center',
  },
  jobsCompletedCol: {
    flex: 1.45,
  },
  cardLabel: {
    fontSize: 9.5,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 6,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
  },
  topUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 12,
    minWidth: 96,
  },
  topUpText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0D9488',
  },
  colDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 14,
    height: '90%',
    alignSelf: 'center',
  },
  sparklineContainer: {
    marginTop: 8,
    width: '100%',
  },
  mockSparkline: {
    width: 60,
    height: 30,
    position: 'relative',
  },
  sparkPoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  sparkPointActive: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  sparkLineSegment: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  greenPercentage: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
  },
  miniBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 7,
    height: 50,
    marginTop: 14,
    width: '100%',
  },
  miniBar: {
    width: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  levelProgressCard: {
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    borderWidth: 1,
    padding: 16,
  },
  levelProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelProgressTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  levelProgressMeta: {
    fontSize: 12,
    fontWeight: '800',
  },
  levelProgressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0D9488',
  },
  levelProgressHint: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },

  // 4. Unified Availability & Quick Nav Container
  unifiedNavCard: {
    marginHorizontal: 0,
    borderRadius: 0,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
  },
  availSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  availTextCol: {
    flex: 1,
  },
  availTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  availSubText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
    marginBottom: 8,
  },
  onlinePillRow: {
    flexDirection: 'row',
  },
  onlinePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  onlinePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  quickNavGridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickNavCard: {
    flex: 1,
    alignItems: 'center',
  },
  quickNavIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  quickNavCardLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  quickNavBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickNavBadgeText: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: '900',
  },

  // 5. Learn Fixam step slider
  learnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  learnTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  seeAllText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  learnScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 12,
  },
  learnCard: {
    width: width - 70,
    height: 160,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  learnLeft: {
    flex: 1,
    justifyContent: 'space-between',
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  learnCardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
    lineHeight: 22,
  },
  learnCardDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  learnCardImage: {
    width: 100,
    height: 120,
    alignSelf: 'flex-end',
    backgroundColor: 'transparent',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 20,
  },
  slideDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  slideDotActive: {
    width: 18,
    backgroundColor: '#0D9488',
  },

  // 6. Search Bar & Categories
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  catScroll: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  catText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // 7. Live Jobs Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  liveCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
    marginLeft: 8,
  },
  viewAllText: {
    color: '#0D9488',
    fontSize: 13,
    fontWeight: '800',
  },

  // Job Cards list item
  jobCard: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  jobTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: '900',
    flex: 1,
    marginRight: 10,
    lineHeight: 28,
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  actionBtn: {
    padding: 2,
  },
  jobSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  jobDesc: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 16,
  },
  moreText: {
    color: '#2563EB',
    fontWeight: '800',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tagChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeInlineText: {
    fontSize: 13,
    fontWeight: '700',
  },
  jobBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  applyBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  timeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 13,
  },
});

export default ProviderHomeScreen;
