import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, StatusBar } from 'react-native';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { translateService } from '../../i18n/translate';

const FindJobsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { visibleJobs, notificationCount } = useAppContext();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favorites'
  const [favorites, setFavorites] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    loadPreferences();
  }, []);

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

  const filteredJobs = (visibleJobs || []).filter(j => {
    // Exclude dismissed jobs
    if (dismissed.includes(j.id)) return false;

    // Filter by tab
    if (activeTab === 'favorites' && !favorites.includes(j.id)) return false;

    // Search query match
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const match = j.title?.toLowerCase().includes(query) ||
        j.description?.toLowerCase().includes(query) ||
        j.location?.toLowerCase().includes(query) ||
        j.category?.toLowerCase().includes(query);
      if (!match) return false;
    }

    return true;
  });

  const getTags = (job) => {
    const tags = [];
    if (job.category) tags.push(translateService(job.category).toUpperCase());
    tags.push(t('home.experienced'));
    const titleWords = job.title?.split(' ') || [];
    if (titleWords.length > 0) tags.push(titleWords[0].toLowerCase());
    return tags.slice(0, 3);
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return t('home.justNow', 'Just now');
    if (diff < 3600) {
      const m = Math.floor(diff / 60);
      return t('home.minutesAgo', { count: m, defaultValue: `${m} min ago` });
    }
    if (diff < 86400) {
      const h = Math.floor(diff / 3600);
      return t('home.hoursAgo', { count: h, defaultValue: `${h} hr${h > 1 ? 's' : ''} ago` });
    }
    const d = Math.floor(diff / 86400);
    if (d === 1) return t('home.yesterday', 'Yesterday');
    if (d < 7) return t('home.daysAgo', { count: d, defaultValue: `${d} days ago` });
    if (d < 30) {
      const w = Math.floor(d / 7);
      return t('home.weeksAgo', { count: w, defaultValue: `${w} week${w > 1 ? 's' : ''} ago` });
    }
    const mo = Math.floor(d / 30);
    return t('home.monthsAgo', { count: mo, defaultValue: `${mo} month${mo > 1 ? 's' : ''} ago` });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      

      {/* Header & Search */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          {/* Hamburger menu */}
          <TouchableOpacity style={[styles.menuBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.openDrawer()}>
            <MaterialCommunityIcons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Title Area */}
          <View style={styles.titleArea}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('jobs.findJobs')}</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{t('jobs.discoverOpportunities')}</Text>
          </View>

        </View>

        <View style={[styles.searchBar, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('jobs.searchJobsPlaceholder')}
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive, { color: activeTab === 'all' ? '#0D9488' : colors.textSecondary }]}>{t('jobs.allJobs')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'favorites' && styles.tabBtnActive]}
            onPress={() => setActiveTab('favorites')}
          >
            <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive, { color: activeTab === 'favorites' ? '#0D9488' : colors.textSecondary }]}>{t('jobs.favoritesCount', { count: favorites.length })}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>

        {filteredJobs.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="briefcase-search-outline" size={60} color={colors.placeholder} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'favorites' ? t('jobs.noFavoriteJobs') : t('jobs.noJobsFound')}
            </Text>
          </View>
        ) : (
          filteredJobs.map(job => {
            const isFav = favorites.includes(job.id);
            return (
              <TouchableOpacity
                key={job.id}
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
                  {t('home.fixedPrice')} - {translateService(job.category || t('home.work')).toUpperCase()} - {t('home.estimatedBudget')}: {job.budget ? job.budget.toLocaleString() : '25,000'} FCFA
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

                {/* Stats Row */}
                <Text style={[styles.statsText, { color: colors.textSecondary }]}>
                  {t('home.reviewsSpent', { reviews: 0, spent: 0 })}
                </Text>

                {/* Bottom Row */}
                <View style={styles.jobBottomRow}>
                  <View style={[styles.locationRow, { flex: 1, marginRight: 12 }]}>
                    <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>{job.location || '4.1070, 9.7619'}</Text>
                  </View>
                  <View style={styles.jobBottomRight}>
                    {job.createdAt ? (
                      <View style={[styles.timeChip, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                        <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textSecondary} />
                        <Text style={[styles.timeChipText, { color: colors.textSecondary }]}>{timeAgo(job.createdAt)}</Text>
                      </View>
                    ) : null}
                    <TouchableOpacity style={styles.applyBtn} onPress={() => navigation.navigate('TaskDetails', { task: job, taskId: job.id })}>
                      <Text style={styles.applyBtnText}>{t('home.apply')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 120, // Space for absolute tab bar
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
  jobCard: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    // Note: removed all corner radii and margins to create the flat border list style
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
    marginBottom: 20,
  },
  jobBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobBottomRight: {
    alignItems: 'flex-end',
    gap: 8,
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
  tabRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
    paddingHorizontal: 4,
  },
  tabBtn: {
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#0D9488',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
  },
  tabTextActive: {
    fontWeight: '900',
  },
});

export default FindJobsScreen;
