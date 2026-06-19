import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, Image, Dimensions, Platform, RefreshControl, ActivityIndicator,
  Animated, Easing, FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { translateService } from '../../i18n/translate';
import UserAvatar from '../../components/UserAvatar';
import WelcomeModal from '../../components/Common/WelcomeModal';
import ProviderTour from '../../components/Common/ProviderTour';
import { POPULAR_SERVICE_CATALOG, POPULAR_SERVICE_IMAGES } from '../../data/popularServices';

const { width } = Dimensions.get('window');

const POPULAR_SERVICES = POPULAR_SERVICE_CATALOG.slice(0, 15);

const LEARN_CARDS = [
  {
    id: '1',
    step: 'STEP 1',
    title: 'Post your task\nin seconds',
    desc: 'Describe what you need and set your budget',
    image: require('../../../assets/onboarding/learn_step1.png'),
    colors: ['#0D9488', '#14B8A6']
  },
  {
    id: '2',
    step: 'STEP 2',
    title: 'Receive competitive\noffers',
    desc: 'Expert providers will bid for your request',
    image: require('../../../assets/onboarding/learn_step2.png'),
    colors: ['#2563EB', '#2563EB']
  },
  {
    id: '3',
    step: 'STEP 3',
    title: 'Choose the best\nprofessional',
    desc: 'Check reviews, portfolios, and confirm the hire',
    image: require('../../../assets/onboarding/learn_step3.png'),
    colors: ['#8B5CF6', '#A78BFA']
  },
  {
    id: '4',
    step: 'TIPS',
    title: 'Release payment\nsafely',
    desc: 'Funds are secure until the task is completed',
    image: require('../../../assets/onboarding/learn_tips.png'),
    colors: ['#F59E0B', '#FBBF24']
  }
];
const MarqueeServices = ({ services, colors, isDarkMode, navigation, t }) => {
  const flatListRef = useRef(null);
  const scrollOffset = useRef(0);
  const isDragging = useRef(false);
  const timerRef = useRef(null);

  const extendedServices = useMemo(() => Array(100).fill(services).flat(), [services]);

  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!isDragging.current && flatListRef.current) {
        scrollOffset.current += 1.0;
        flatListRef.current.scrollToOffset({ offset: scrollOffset.current, animated: false });
      }
    }, 20);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    startAutoScroll();
    return stopAutoScroll;
  }, [startAutoScroll, stopAutoScroll]);

  const handleScroll = (event) => {
    if (isDragging.current) {
      scrollOffset.current = event.nativeEvent.contentOffset.x;
    }
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.popularCard, { backgroundColor: isDarkMode ? '#111827' : '#FFF', marginRight: 10 }]}
      onPress={() => navigation.navigate('ProviderList', { category: item.name })}
      activeOpacity={0.84}
    >
      <View style={styles.popularIconPanel}>
        <Image source={POPULAR_SERVICE_IMAGES[item.imageName]} style={styles.popularImage} resizeMode="cover" />
        <LinearGradient colors={['rgba(15,23,42,0.04)', 'rgba(15,23,42,0.22)']} style={StyleSheet.absoluteFill} />
      </View>
      <Text style={[styles.popularCardText, { color: colors.text }]} numberOfLines={2}>
        {translateService(item.name)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ paddingVertical: 8 }}>
      <FlatList
        ref={flatListRef}
        data={extendedServices}
        keyExtractor={(item, index) => `${index}-${item.name}`}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 18 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          isDragging.current = true;
          stopAutoScroll();
        }}
        onScrollEndDrag={() => {
          isDragging.current = false;
          startAutoScroll();
        }}
        onMomentumScrollEnd={() => {
          isDragging.current = false;
          startAutoScroll();
        }}
        getItemLayout={(data, index) => ({ length: 142, offset: 142 * index, index })}
        initialNumToRender={10}
        windowSize={5}
        removeClippedSubviews={false}
      />
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const { providers, walletBalance, walletDetails, transactions, unreadCount, jobs, fetchAppData, notificationCount, favoriteProviderIds, isInitialLoad, hasLoadedData } = useAppContext();
  const { user, isNewUser, clearNewUser } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const learnScrollRef = useRef(null);

  const topUpRef = useRef(null);
  const postTaskRef = useRef(null);
  const verifiedProsRef = useRef(null);
  const favoritesRef = useRef(null);
  const clientMainScrollRef = useRef(null);

  const tourSteps = useMemo(() => [
    {
      ref: topUpRef,
      icon: 'wallet-plus-outline',
      title: t('tour.clientTopUpTitle', 'Top Up Your Wallet 💰'),
      text: t('tour.clientTopUpText', 'Add coins to book providers and unlock direct messaging. MTN MoMo and Orange Money accepted.'),
    },
    {
      ref: postTaskRef,
      icon: 'clipboard-plus-outline',
      title: t('tour.clientPostTitle', 'Post a Task Here 📋'),
      text: t('tour.clientPostText', 'Tap this button to describe what you need, set your budget and location. Providers near you will respond fast.'),
    },
    {
      ref: verifiedProsRef,
      icon: 'check-decagram',
      title: t('tour.clientVerifiedTitle', 'Verified Pros ⭐'),
      text: t('tour.clientVerifiedText', 'Find top-rated professionals whose identities have been completely verified.'),
    },
    {
      ref: favoritesRef,
      icon: 'heart-outline',
      title: t('tour.clientFavoritesTitle', 'Your Favorites ❤️'),
      text: t('tour.clientFavoritesText', 'Quickly access the providers you have saved for future jobs.'),
    },
  ], [t]);

  useEffect(() => {
    if (isNewUser && !isInitialLoad) {
      const timer = setTimeout(() => setShowWelcome(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isNewUser, isInitialLoad]);

  useFocusEffect(
    useCallback(() => {
      // If we have data already (from cache or previous fetch), do a silent
      // background refresh without showing the full-screen spinner.
      // The 5-minute debounce in AppContext prevents unnecessary API calls.
      fetchAppData();
    }, [hasLoadedData])
  );

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

  const handleScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / (width - 60));
    if (slide !== slideIndex) {
      setSlideIndex(slide);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppData();
    setRefreshing(false);
  };

  const firstName = user?.fullName?.split(' ')[0] || t('common.user');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('home.goodMorning') : hour < 17 ? t('home.goodAfternoon') : t('home.goodEvening');

  // Real data counts
  const activeTaskCount = jobs?.filter(j => j.status === 'OPEN' || j.status === 'IN_PROGRESS').length || 0;
  const completedTaskCount = walletDetails?.completedTasks ?? (jobs?.filter(j => j.status === 'COMPLETED').length || 0);
  const savedCount = favoriteProviderIds?.length || 0;
  const txCount = walletDetails?.thisMonthTransactions ?? (transactions?.length || 0);

  // Level thresholds grow by 5 more tasks each level: 5, 15, 30, 50...
  const calculateLevel = (completedCount) => {
    let level = 1;
    while (level < 200 && completedCount >= getLevelThresholds(level).nextThreshold) {
      level += 1;
    }
    return level;
  };

  const getLevelThresholds = (level) => {
    const safeLevel = Math.min(Math.max(level, 1), 200);
    const currentThreshold = 5 * ((safeLevel - 1) * safeLevel) / 2;
    const nextThreshold = safeLevel >= 200 ? currentThreshold : 5 * (safeLevel * (safeLevel + 1)) / 2;
    return { currentThreshold, nextThreshold };
  };

  const currentLevel = calculateLevel(completedTaskCount);
  const { currentThreshold, nextThreshold } = getLevelThresholds(currentLevel);
  const tasksNeededForNextLevel = walletDetails?.nextLevelTasks ?? (nextThreshold - currentThreshold);
  const progressPercent = walletDetails?.progressPercent ?? Math.min(100, Math.round((completedTaskCount / tasksNeededForNextLevel) * 100));
  const nextRewardCoins = Math.min(currentLevel, 200);
  const localizedLearnCards = LEARN_CARDS.map((card) => {
    const copy = {
      '1': [t('home.learn.step1'), t('home.clientLearn.bookTitle'), t('home.clientLearn.bookDesc')],
      '2': [t('home.learn.step2'), t('home.clientLearn.agreeTitle'), t('home.clientLearn.agreeDesc')],
      '3': [t('home.learn.step3'), t('home.clientLearn.payTitle'), t('home.clientLearn.payDesc')],
      '4': [t('home.learn.tips'), t('home.clientLearn.releaseTitle'), t('home.clientLearn.releaseDesc')],
    }[card.id];
    return { ...card, step: copy[0], title: copy[1], desc: copy[2] };
  });

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
          {/* ═══ 1. HEADER with gradient ═══ */}
          <LinearGradient
        colors={isDarkMode ? ['#0F4C4A', '#1E3A5F'] : ['#0D9488', '#2563EB']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
            <MaterialCommunityIcons name="menu" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.greetText}>{greeting} 👋</Text>
            <Text style={styles.nameText}>{firstName}</Text>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationText}>{t('home.locationDefault')}</Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="rgba(255,255,255,0.8)" />
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="#FFF" />
            {notificationCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        ref={clientMainScrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} tintColor="#0D9488" />}
      >

        {/* ═══ 1.5. SEARCH BAR & FILTER ROW ═══ */}
        <LinearGradient
          colors={isDarkMode ? ['#071936', '#0F172A'] : ['#E6F7F5', '#DBEAFE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.searchBand}
        >
          <View style={styles.searchRow}>
            <TouchableOpacity 
              style={[styles.searchBar, { backgroundColor: isDarkMode ? '#0F172A' : '#FFF', borderColor: isDarkMode ? '#1E3A5F' : '#BDEBE5' }]}
              onPress={() => navigation.navigate('ProviderList')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="magnify" size={22} color={isDarkMode ? '#94A3B8' : '#0D9488'} />
              <Text style={[styles.searchInput, { color: isDarkMode ? '#64748B' : '#5B7C8A', paddingTop: Platform.OS === 'ios' ? 0 : 2 }]}>
                {t('home.searchProfessionals')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, { backgroundColor: isDarkMode ? '#0F172A' : '#FFF', borderColor: isDarkMode ? '#1E3A5F' : '#BDEBE5' }]}
              onPress={() => {
                navigation.navigate('ProviderList');
              }}
            >
              <MaterialCommunityIcons name="tune-variant" size={20} color={isDarkMode ? '#E2E8F0' : '#0D9488'} />
            </TouchableOpacity>
          </View>

          <View style={styles.popularHeader}>
            <Text style={[styles.popularTitle, { color: colors.text }]}>{t('home.popularCategories')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PopularServices')}>
              <Text style={styles.popularSeeAll}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          <MarqueeServices 
            services={POPULAR_SERVICES} 
            colors={colors} 
            isDarkMode={isDarkMode} 
            navigation={navigation} 
            t={t}
          />
        </LinearGradient>

        {/* ═══ 2. WALLET BALANCE CARD ═══ */}
        <TouchableOpacity
          ref={topUpRef}
          style={[styles.walletCard, { backgroundColor: isDarkMode ? '#134E4A' : '#0D9488' }]}
          onPress={() => navigation.getParent()?.getParent()?.navigate('Wallet', { screen: 'TopUp' })}
          activeOpacity={0.85}
        >
          {/* Left Column: Wallet Balance & Top Up stacked */}
          <View style={styles.walletLeftCol}>
            <View style={styles.walletHeaderRow}>
              <View style={styles.walletIconWrap}>
                <MaterialCommunityIcons name="wallet" size={20} color="#FFF" />
              </View>
              <Text style={styles.walletLabel}>{t('home.walletBalance')}</Text>
            </View>
            <Text style={styles.walletAmount} numberOfLines={1}>{(walletBalance || 0).toLocaleString()} {t('payments.coins')}</Text>
            
            <TouchableOpacity
              style={styles.topUpBtn}
              onPress={() => navigation.getParent()?.getParent()?.navigate('Wallet', { screen: 'TopUp' })}
            >
              <Text style={styles.topUpText}>{t('home.topUp')}</Text>
              <MaterialCommunityIcons name="plus" size={14} color="#0D9488" />
            </TouchableOpacity>
          </View>

          <View style={styles.walletDivider} />

          {/* Right Column: Transactions */}
          <View style={styles.walletRightCol}>
            <Text style={styles.walletLabel}>{t('payments.transactions').toUpperCase()}</Text>
            <Text style={styles.walletTxCount} numberOfLines={1}>{txCount}</Text>
            <Text style={styles.walletSub}>{t('home.thisMonth')}</Text>
          </View>
        </TouchableOpacity>

        {/* ═══ 3. PROGRESS CARD ═══ */}
        <LinearGradient
          colors={isDarkMode ? ['#1E293B', '#0F172A'] : ['#1E3A5F', '#0F172A']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.progressCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.progressTitle}>{t('home.doingGreat')} 🔥</Text>
            <Text style={styles.progressCount}>{t('home.tasksCompleted', { count: completedTaskCount })}</Text>
            <Text style={styles.progressSub}>{t('home.tasksToLevel', { count: Math.max(tasksNeededForNextLevel - completedTaskCount, 0) })}</Text>
            <View style={styles.progressBar}>
              {[1,2,3,4,5].map((i) => {
                const stepValue = (progressPercent / 100) * 5;
                return (
                  <View key={i} style={[styles.progressSegment, { backgroundColor: i <= stepValue ? '#0D9488' : 'rgba(255,255,255,0.15)' }]} />
                );
              })}
            </View>
          </View>
          <View style={styles.progressRight}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{t('home.level', { level: currentLevel })}</Text>
            </View>
            <Text style={styles.rewardLabel}>{t('home.nextReward')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MaterialCommunityIcons name="star-circle" size={16} color="#FBBF24" />
              <Text style={styles.rewardAmount}>{nextRewardCoins} {t('payments.coins')}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ═══ 4. CTA - "What do you need done?" ═══ */}
        <TouchableOpacity
          ref={postTaskRef}
          style={[styles.ctaCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
          onPress={() => navigation.navigate('Create Task', { screen: 'PostTask', params: { startOnPost: true } })}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.ctaTitle, { color: colors.text }]}>{t('home.whatNeedDone')}</Text>
            <Text style={[styles.ctaSub, { color: colors.textSecondary }]}>{t('home.postTaskOffers')}</Text>
            <LinearGradient colors={['#0D9488', '#14B8A6']} style={styles.ctaBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.ctaBtnText}>{t('home.postTask')}</Text>
              <MaterialCommunityIcons name="plus" size={16} color="#FFF" />
            </LinearGradient>
          </View>
          <Image
            source={require('../../../assets/done.png')}
            style={styles.ctaImg}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* ═══ 4.5. LEARN FIXAM CAROUSEL ═══ */}
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

        {/* ═══ 5. QUICK ACTIONS ═══ */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('My Tasks')}>
            <View style={[styles.quickIcon, { backgroundColor: isDarkMode ? '#134E4A' : '#E6F7F5' }]}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#0D9488" />
              {activeTaskCount > 0 && (
                <View style={[styles.quickBadge, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.quickBadgeText}>{activeTaskCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>{t('jobs.myTasks')}</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>{t('home.activeCount', { count: activeTaskCount })}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Messages')}>
            <View style={[styles.quickIcon, { backgroundColor: isDarkMode ? '#134E4A' : '#E6F7F5' }]}>
              <MaterialCommunityIcons name="chat-processing-outline" size={24} color="#0D9488" />
              {unreadCount > 0 && (
                <View style={[styles.quickBadge, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.quickBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>{t('tabs.messages')}</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>{t('home.unreadCount', { count: unreadCount })}</Text>
          </TouchableOpacity>

          <TouchableOpacity ref={favoritesRef} style={styles.quickItem} onPress={() => navigation.navigate('FavoriteProviders')}>
            <View style={[styles.quickIcon, { backgroundColor: isDarkMode ? '#422006' : '#FFF7ED' }]}>
              <MaterialCommunityIcons name="star" size={24} color="#F59E0B" />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>{t('home.favorites')}</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>{t('home.savedCount', { count: savedCount })}</Text>
          </TouchableOpacity>

          <TouchableOpacity ref={verifiedProsRef} style={styles.quickItem} onPress={() => navigation.navigate('ProviderList', { verifiedOnly: true })}>
            <View style={[styles.quickIcon, { backgroundColor: isDarkMode ? '#052E16' : '#ECFDF5' }]}>
              <MaterialCommunityIcons name="check-decagram" size={24} color="#22C55E" />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>{t('home.verifiedPros')}</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>{t('home.topRated')}</Text>
          </TouchableOpacity>
        </View>

        {/* ═══ 7. RECOMMENDED PROFESSIONALS ═══ */}
        {providers.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.recommendedProfessionals')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProviderList')}>
                <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.proScroll}>
              {providers.slice(0, 10).map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.proCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                  onPress={() => navigation.navigate('ProviderProfile', { provider: p })}
                  activeOpacity={0.8}
                >
                  <View style={styles.proImgWrap}>
                    <UserAvatar uri={p.user?.avatar} name={p.user?.fullName || t('common.provider')} size={64} style={styles.proImg} />
                    {p.verification === 'VERIFIED' && (
                      <View style={styles.proVerified}>
                        <MaterialCommunityIcons name="check-decagram" size={18} color="#22C55E" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.proName, { color: colors.text }]} numberOfLines={1}>{p.user?.fullName || t('common.provider')}</Text>
                  <Text style={[styles.proSkill, { color: colors.textSecondary }]} numberOfLines={1}>{p.skills?.[0] ? translateService(p.skills[0]) : t('home.expert')}</Text>
                  <View style={styles.proRatingRow}>
                    <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                    <Text style={[styles.proRating, { color: colors.text }]}>{p.rating || '0.0'}</Text>
                    <Text style={[styles.proReviews, { color: colors.textSecondary }]}>({p.reviewCount || 0})</Text>
                    <Text style={[styles.proDist, { color: colors.textSecondary }]}>{p.serviceArea ? `${p.serviceArea}` : '~ nearby'}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.viewProfileBtn, { borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                    onPress={() => navigation.navigate('ProviderProfile', { provider: p })}
                  >
                    <Text style={styles.viewProfileText}>{t('profile.viewProfile')}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* ═══ 8. INVITE & EARN BANNER ═══ */}
        <TouchableOpacity
          style={styles.promoFlyer}
          onPress={() => navigation.navigate('Invitation')}
          activeOpacity={0.9}
        >
          <LinearGradient 
            colors={isDarkMode ? ['#134E4A', '#064E3B'] : ['#FFF5F0', '#FFEDD5']} 
            style={styles.promoGradient}
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.promoTextContainer}>
              <Text style={[styles.promoTitle, { color: isDarkMode ? '#FFF' : '#F97316' }]}>
                {t('drawer.inviteTitle')}
              </Text>
              <Text style={[styles.promoSub, { color: isDarkMode ? '#A7F3D0' : '#EA580C' }]}>
                {t('payments.inviteEarn')}
              </Text>
              <View style={[styles.promoBtn, { backgroundColor: '#F97316' }]}>
                <Text style={styles.promoBtnText}>{t('home.inviteNow')}</Text>
              </View>
            </View>
            <Image 
              source={require('../../../assets/promo image/promo.png')} 
              style={styles.promoFlyerImage} 
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Space at the bottom to avoid tabbar overlap */}
        <View style={{ height: 120 }} />
      </ScrollView>
      
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

      {/* Client Highlight Tour */}
      <ProviderTour
        steps={tourSteps}
        userId={user?.id}
        visible={showTour}
        onDone={() => setShowTour(false)}
        scrollViewRef={clientMainScrollRef}
      />
      </View>
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 110 },

  // 1. HEADER
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 54,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  menuBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  greetText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  nameText: { fontSize: 22, fontWeight: '900', color: '#FFF', marginTop: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 2 },
  locationText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  bellBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  bellBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#2563EB' },
  bellBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  // 1.5. SEARCH BAR & FILTER
  searchBand: {
    paddingTop: 14,
    paddingBottom: 18,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
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
    fontWeight: '600',
  },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  popularHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 18,
    marginBottom: 12,
  },
  popularTitle: {
    fontSize: 19,
    fontWeight: '900',
  },
  popularSeeAll: {
    color: '#0D9488',
    fontSize: 13,
    fontWeight: '900',
  },
  popularScroll: {
    paddingLeft: 18,
    paddingRight: 10,
    gap: 10,
  },
  popularCard: {
    width: 132,
    overflow: 'hidden',
    borderRadius: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  popularIconPanel: {
    height: 82,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  popularImage: {
    width: '100%',
    height: '100%',
  },
  popularCardText: {
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },

  // 2. WALLET CARD
  walletCard: {
    marginHorizontal: 0, 
    marginTop: 0, 
    borderRadius: 0, 
    paddingHorizontal: 20, 
    paddingVertical: 22,
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    elevation: 4,
  },
  walletLeftCol: { 
    flex: 1.3,
    alignItems: 'flex-start',
  },
  walletHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  walletIconWrap: { 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  walletLabel: { 
    fontSize: 10.5, 
    color: 'rgba(255,255,255,0.75)', 
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  walletAmount: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#FFF', 
    marginBottom: 12,
  },
  walletDivider: { 
    width: 1, 
    height: 70, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    marginHorizontal: 16,
    alignSelf: 'center',
  },
  walletRightCol: { 
    flex: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTxCount: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#FFF', 
    marginTop: 4,
    marginBottom: 2,
  },
  walletSub: { 
    fontSize: 10.5, 
    color: 'rgba(255,255,255,0.65)', 
    fontWeight: '700',
  },
  topUpBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: '#FFF', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 14, 
  },
  topUpText: { 
    fontSize: 11.5, 
    fontWeight: '900', 
    color: '#0D9488' 
  },

  // 3. PROGRESS CARD
  progressCard: {
    marginHorizontal: 0, marginTop: 0, borderRadius: 0, paddingHorizontal: 22, paddingVertical: 26,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  progressTitle: { fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '800' },
  progressCount: { fontSize: 22, fontWeight: '900', color: '#FFF', marginTop: 4 },
  progressSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4, fontWeight: '600' },
  progressBar: { flexDirection: 'row', gap: 4, marginTop: 12 },
  progressSegment: { flex: 1, height: 6, borderRadius: 3 },
  progressRight: { alignItems: 'flex-end', marginLeft: 16 },
  levelBadge: { backgroundColor: '#0D9488', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  levelText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  rewardLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 10, fontWeight: '700' },
  rewardAmount: { fontSize: 16, fontWeight: '900', color: '#22C55E' },

  // 4. CTA CARD
  ctaCard: {
    marginHorizontal: 0, marginTop: 0, borderRadius: 0, paddingHorizontal: 24, paddingVertical: 28,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 4,
  },
  ctaTitle: { fontSize: 20, fontWeight: '900', marginBottom: 6 },
  ctaSub: { fontSize: 13, lineHeight: 18, marginBottom: 14, fontWeight: '600' },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 },
  ctaBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  ctaImg: { width: 110, height: 110 },

  // 4.5. LEARN CAROUSEL
  learnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
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

  // 5. QUICK ACTIONS
  quickActions: {
    flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12,
    marginTop: 20, marginBottom: 8,
  },
  quickItem: { alignItems: 'center', width: (width - 48) / 4 },
  quickIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  quickBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  quickLabel: { fontSize: 12, fontWeight: '700', marginBottom: 2, textAlign: 'center' },
  quickSub: { fontSize: 10, textAlign: 'center' },

  // SECTION HEADER
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '900' },
  viewAll: { fontSize: 13, fontWeight: '700', color: '#0D9488' },

  // 7. PROFESSIONALS
  proScroll: { paddingLeft: 16, paddingRight: 8 },
  proCard: { width: 150, borderRadius: 16, padding: 14, marginRight: 12, borderWidth: 1, alignItems: 'center' },
  proImgWrap: { position: 'relative', marginBottom: 10 },
  proImg: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E2E8F0' },
  proVerified: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#FFF', borderRadius: 10, padding: 1 },
  proName: { fontSize: 13, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  proSkill: { fontSize: 11, textAlign: 'center', marginBottom: 6 },
  proRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10, flexWrap: 'wrap', justifyContent: 'center' },
  proRating: { fontSize: 12, fontWeight: '800' },
  proReviews: { fontSize: 10 },
  proDist: { fontSize: 10 },
  viewProfileBtn: { width: '100%', paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  viewProfileText: { fontSize: 12, fontWeight: '700', color: '#0D9488' },

  // 8. INVITE BANNER
  promoFlyer: {
    marginHorizontal: 16, marginTop: 20, marginBottom: 10,
    borderRadius: 16, overflow: 'hidden', elevation: 5,
    shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  promoGradient: {
    flexDirection: 'row', alignItems: 'center', padding: 20, justifyContent: 'space-between'
  },
  promoTextContainer: { flex: 1, paddingRight: 10 },
  promoTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  promoSub: { fontSize: 12, marginBottom: 12, fontWeight: '600', lineHeight: 16 },
  promoBtn: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  promoBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  promoFlyerImage: { width: 100, height: 100, resizeMode: 'contain' },
});

export default HomeScreen;
