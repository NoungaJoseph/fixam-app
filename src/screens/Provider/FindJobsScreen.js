import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, StatusBar, Modal, Alert, ActivityIndicator } from 'react-native';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { translateService } from '../../i18n/translate';
import { useAuth } from '../../context/AuthContext';
import { getCurrencyForUser } from '../../constants/countries';
import api from '../../services/api';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'view-grid' },
  { id: 'plumbing', label: 'Plumbing', aliases: ['plumbing', 'plomberie'], icon: 'water-pump' },
  { id: 'electrical', label: 'Electrical', aliases: ['electrical', 'electrician', 'electricite', 'électricite', 'électricitée'], icon: 'lightning-bolt' },
  { id: 'cleaning', label: 'Cleaning', aliases: ['cleaning', 'house cleaning', 'office cleaning', 'nettoyage', 'menage', 'ménage'], icon: 'broom' },
  { id: 'delivery', label: 'Delivery Driver', aliases: ['delivery', 'delivery driver', 'livraison', 'coursier'], icon: 'bike' },
];

const FindJobsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { jobs, visibleJobs, hiddenJobIds, favoriteJobIds, toggleFavoriteJob, hideJob, showJob } = useAppContext();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'most_recent', 'remote_only', 'favorites' or 'rejected'
  const [activeCategory, setActiveCategory] = useState('all');

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterLocation, setFilterLocation] = useState('');
  const [filterMinBudget, setFilterMinBudget] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('recent'); // 'recent' or 'budget'
  const [filterUrgency, setFilterUrgency] = useState('all'); // 'all', 'normal', 'urgent', 'emergency'

  const [externalJobs, setExternalJobs] = useState([]);
  const [selectedExternalJob, setSelectedExternalJob] = useState(null);
  const [extApplicantName, setExtApplicantName] = useState('');
  const [extApplicantEmail, setExtApplicantEmail] = useState('');
  const [extApplicantPhone, setExtApplicantPhone] = useState('');
  const [extCoverLetter, setExtCoverLetter] = useState('');
  const [extCvLink, setExtCvLink] = useState('');
  const [isApplyingExternal, setIsApplyingExternal] = useState(false);

  useEffect(() => {
    api.get('/external-jobs')
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setExternalJobs(res.data.data.map(item => ({
            ...item,
            isExternal: true,
            status: 'PENDING',
            approvalStatus: 'APPROVED',
            category: item.requirements || 'General Opportunity',
            budget: 0,
            location: item.location || 'Remote / Verified Partner'
          })));
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenExternalJob = (job) => {
    setSelectedExternalJob(job);
    setExtApplicantName(user?.fullName || '');
    setExtApplicantEmail(user?.email || '');
    setExtApplicantPhone(user?.phone || '');
    setExtCvLink(user?.cvUrl || '');
    setExtCoverLetter(
      `Dear Hiring Team at ${job.companyName || 'the organization'},\n\nI am writing to express my strong interest in the ${job.title} position posted via Fixam. With my verified background and hands-on professional expertise, I am confident in delivering excellent results for your team.\n\nPlease find my resume attached from my Fixam verified profile. I welcome the opportunity to discuss how my experience aligns with your objectives.\n\nBest regards,\n${user?.fullName || 'Candidate'}`
    );
  };

  const handleSendExternalApplication = async () => {
    if (!extApplicantName.trim() || !extApplicantEmail.trim()) {
      Alert.alert('Required Fields', 'Please ensure your name and email are provided.');
      return;
    }

    try {
      setIsApplyingExternal(true);
      const res = await api.post(`/external-jobs/${selectedExternalJob.id}/apply`, {
        applicantName: extApplicantName.trim(),
        applicantEmail: extApplicantEmail.trim(),
        applicantPhone: extApplicantPhone.trim(),
        coverLetter: extCoverLetter.trim(),
        cvUrl: extCvLink.trim() || user?.cvUrl || null,
        cvName: user?.cvName || 'Profile CV'
      });

      if (res.data?.success) {
        Alert.alert(
          'Application Sent! 🎉',
          `Your application has been delivered directly to ${selectedExternalJob.companyName || 'the employer'}'s recruiter email. Replies will arrive directly at ${extApplicantEmail}.`,
          [{ text: 'Great!', onPress: () => setSelectedExternalJob(null) }]
        );
      } else {
        Alert.alert('Error', res.data?.message || 'Could not send application.');
      }
    } catch (err) {
      Alert.alert('Submission Failed', err.response?.data?.message || err.message || 'Error sending application');
    } finally {
      setIsApplyingExternal(false);
    }
  };

  const allAvailableJobs = useMemo(() => {
    const regular = (jobs || []).filter(j => {
      // Exclude own tasks
      if (j.clientId === user?.id || j.client?.id === user?.id) return false;
      // Exclude jobs that have been accepted/assigned already
      const hasAcceptedAssignment = j.assignments?.some(a => a.status === 'ACCEPTED');
      if (hasAcceptedAssignment) return false;
      return true;
    });
    return [...externalJobs, ...regular];
  }, [jobs, externalJobs, user?.id]);

  const favoritesCount = useMemo(() => {
    return allAvailableJobs.filter(j => favoriteJobIds.includes(j.id) && !hiddenJobIds.includes(j.id)).length;
  }, [allAvailableJobs, favoriteJobIds, hiddenJobIds]);

  const rejectedCount = useMemo(() => {
    return allAvailableJobs.filter(j => hiddenJobIds.includes(j.id)).length;
  }, [allAvailableJobs, hiddenJobIds]);

  const appliedCount = useMemo(() => {
    return allAvailableJobs.filter(j => 
      j.hasApplied ||
      j.assignments?.some(a => a.provider?.userId === user?.id || a.providerId === user?.providerProfile?.id || a.provider?.id === user?.providerProfile?.id)
    ).length;
  }, [allAvailableJobs, user]);

  const sourceJobs = useMemo(() => {
    if (activeTab === 'rejected') {
      return allAvailableJobs.filter(j => (hiddenJobIds || []).includes(j.id));
    }
    // Else, only keep visible ones (not hidden/rejected)
    return allAvailableJobs.filter(j => !(hiddenJobIds || []).includes(j.id));
  }, [allAvailableJobs, activeTab, hiddenJobIds]);

  const filteredJobs = useMemo(() => {
    let list = sourceJobs.filter(j => {
      // Filter by tab
      if (activeTab === 'favorites' && !favoriteJobIds.includes(j.id)) return false;
      if (activeTab === 'applied') {
        const isApplied = j.hasApplied || j.assignments?.some(a => a.provider?.userId === user?.id || a.providerId === user?.providerProfile?.id || a.provider?.id === user?.providerProfile?.id);
        if (!isApplied) return false;
      }
      if (activeTab === 'remote_only') {
        const loc = String(j.location || '').toLowerCase();
        const type = String(j.serviceCategory || j.category || j.serviceType || '').toLowerCase();
        const title = String(j.title || '').toLowerCase();
        const isRemote = j.isRemote === true || 
          loc.includes('remote') || loc.includes('online') || loc.includes('virtual') || loc.includes('en ligne') ||
          type.includes('remote') || type.includes('online') || type.includes('virtual') ||
          title.includes('remote') || title.includes('online');
        if (!isRemote) return false;
      }

      // Filter by category
      const category = String(j.category || '');
      const categoryText = category.toLowerCase();
      const translatedCategoryText = translateService(category).toLowerCase();
      const activeCategoryConfig = CATEGORIES.find((cat) => cat.id === activeCategory);
      const matchCat = activeCategory === 'all'
        || activeCategoryConfig?.aliases?.some((alias) => categoryText.includes(alias) || translatedCategoryText.includes(alias));
      
      if (!matchCat) return false;

      // Filter by location
      if (filterLocation.trim()) {
        const locQuery = filterLocation.toLowerCase();
        if (!j.location?.toLowerCase().includes(locQuery)) return false;
      }

      // Filter by budget
      if (filterMinBudget) {
        const minB = parseInt(filterMinBudget);
        const jobB = j.budgetMax || j.budget || 0;
        if (jobB < minB) return false;
      }

      // Filter by urgency
      if (filterUrgency !== 'all') {
        const jobUrgency = String(j.priority || j.urgencyLevel || 'normal').toLowerCase();
        if (jobUrgency !== filterUrgency) return false;
      }

      // Search query match
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const match = j.title?.toLowerCase().includes(query) ||
          j.description?.toLowerCase().includes(query) ||
          j.location?.toLowerCase().includes(query) ||
          j.category?.toLowerCase().includes(query) ||
          translatedCategoryText.includes(query);
        if (!match) return false;
      }

      return true;
    });

    // Sort logic
    if (activeTab === 'most_recent' || filterSortBy === 'recent') {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (filterSortBy === 'budget') {
      list.sort((a, b) => (b.budgetMax || b.budget || 0) - (a.budgetMin || a.budget || 0));
    }

    return list;
  }, [sourceJobs, activeTab, favoriteJobIds, activeCategory, searchQuery, filterLocation, filterMinBudget, filterSortBy, filterUrgency]);

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
    const normalized = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    const then = new Date(normalized);
    if (Number.isNaN(then.getTime())) return '';
    const diffSec = Math.max(0, Math.floor((Date.now() - then.getTime()) / 1000));
    if (diffSec < 60) return t('home.justNow', 'Just now');
    if (diffSec < 3600) {
      const m = Math.floor(diffSec / 60);
      return t('home.minutesAgo', { count: m, defaultValue: `${m} min ago` });
    }
    if (diffSec < 86400) {
      const h = Math.floor(diffSec / 3600);
      return t('home.hoursAgo', { count: h, defaultValue: `${h} hr${h > 1 ? 's' : ''} ago` });
    }
    const d = Math.floor(diffSec / 86400);
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

        <View style={styles.searchRow}>
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
          <TouchableOpacity 
            style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowFilterModal(true)}
          >
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

        {/* Tab Switcher */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive, { color: activeTab === 'all' ? '#0D9488' : colors.textSecondary }]}>
              {t('jobs.allJobs', 'All Jobs')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'most_recent' && styles.tabBtnActive]}
            onPress={() => setActiveTab('most_recent')}
          >
            <Text style={[styles.tabText, activeTab === 'most_recent' && styles.tabTextActive, { color: activeTab === 'most_recent' ? '#0D9488' : colors.textSecondary }]}>
              {t('jobs.mostRecent', 'Most Recent')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'remote_only' && styles.tabBtnActive]}
            onPress={() => setActiveTab('remote_only')}
          >
            <Text style={[styles.tabText, activeTab === 'remote_only' && styles.tabTextActive, { color: activeTab === 'remote_only' ? '#0D9488' : colors.textSecondary }]}>
              {t('jobs.remoteOnly', 'Remote Only')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'applied' && styles.tabBtnActive]}
            onPress={() => setActiveTab('applied')}
          >
            <Text style={[styles.tabText, activeTab === 'applied' && styles.tabTextActive, { color: activeTab === 'applied' ? '#0D9488' : colors.textSecondary }]}>
              {t('jobs.appliedJobs', 'Applied')} ({appliedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'favorites' && styles.tabBtnActive]}
            onPress={() => setActiveTab('favorites')}
          >
            <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive, { color: activeTab === 'favorites' ? '#0D9488' : colors.textSecondary }]}>
              {t('jobs.favoritesCount', { count: favoritesCount, defaultValue: `Favorites (${favoritesCount})` })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'rejected' && styles.tabBtnActive]}
            onPress={() => setActiveTab('rejected')}
          >
            <Text style={[styles.tabText, activeTab === 'rejected' && styles.tabTextActive, { color: activeTab === 'rejected' ? '#0D9488' : colors.textSecondary }]}>
              {t('jobs.rejectedCount', { count: rejectedCount, defaultValue: `Rejected (${rejectedCount})` })}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>

        {filteredJobs.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="briefcase-search-outline" size={60} color={colors.placeholder} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'favorites' 
                ? t('jobs.noFavoriteJobs', 'No saved/favorite jobs yet') 
                : activeTab === 'applied'
                  ? t('jobs.noAppliedJobs', 'You have not applied to any jobs yet')
                  : activeTab === 'rejected' 
                    ? t('jobs.noRejectedJobs', 'No rejected jobs') 
                    : activeTab === 'remote_only'
                      ? t('jobs.noRemoteJobs', 'No remote jobs available')
                      : t('jobs.noJobsFound', 'No jobs found')}
            </Text>
          </View>
        ) : (
          filteredJobs.map(job => {
            const isFav = favoriteJobIds.includes(job.id);
            return (
              <TouchableOpacity
                key={job.id}
                style={[styles.jobCard, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
                onPress={() => {
                  if (job.isExternal) {
                    handleOpenExternalJob(job);
                    return;
                  }
                  navigation.navigate('TaskDetails', { task: job, taskId: job.id });
                }}
                activeOpacity={0.84}
              >
                {/* External vs Fixam Direct Badge */}
                {job.isExternal ? (
                  <View style={[styles.externalBadge, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF', borderColor: '#BFDBFE' }]}>
                    <Text style={[styles.externalBadgeText, { color: isDarkMode ? '#93C5FD' : '#2563EB' }]}>
                      🌐 External Opportunity • {job.companyName || 'Verified Partner'}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.externalBadge, { backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5', borderColor: '#A7F3D0' }]}>
                    <Text style={[styles.externalBadgeText, { color: isDarkMode ? '#A7F3D0' : '#047857' }]}>
                      ⚡ Fixam Direct Job
                    </Text>
                  </View>
                )}

                {/* Title Row with Actions */}
                <View style={styles.jobTopRow}>
                  <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={2}>{job.title || t('home.taskOpportunity')}</Text>
                  <View style={styles.actionIcons}>
                    <TouchableOpacity 
                      style={styles.actionBtn} 
                      onPress={() => activeTab === 'rejected' ? showJob(job.id) : hideJob(job.id)}
                    >
                      <MaterialCommunityIcons 
                        name={activeTab === 'rejected' ? "thumb-down" : "thumb-down-outline"} 
                        size={26} 
                        color={activeTab === 'rejected' ? "#0D9488" : colors.text} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => toggleFavoriteJob(job.id)}>
                      <MaterialCommunityIcons name={isFav ? "heart" : "heart-outline"} size={26} color={isFav ? "#EF4444" : colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Subtitle */}
                <Text style={[styles.jobSubtitle, { color: colors.textSecondary }]}>
                  {t('home.fixedPrice')} - {translateService(job.category || t('home.work')).toUpperCase()} - {t('home.estimatedBudget')}: {job.budget ? job.budget.toLocaleString() : '25,000'} {getCurrencyForUser(job.country || user?.country || 'Cameroon')}
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
                <View style={[styles.statsRow, { justifyContent: 'flex-end' }]}>
                  {job.createdAt ? (
                    <View style={styles.timeInline}>
                      <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textSecondary} />
                      <Text style={[styles.timeInlineText, { color: colors.textSecondary }]}>{timeAgo(job.createdAt)}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Bottom Row */}
                <View style={styles.jobBottomRow}>
                  <View style={[styles.locationRow, { flex: 1, marginRight: 12 }]}>
                    <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>{job.location || '4.1070, 9.7619'}</Text>
                  </View>
                  <TouchableOpacity style={styles.applyBtn} onPress={() => navigation.navigate('TaskDetails', { task: job, taskId: job.id })}>
                    <Text style={styles.applyBtnText}>{t('home.apply')}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Advanced Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('jobs.filterTitle', 'Filter Tasks')}</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Scrollable filters */}
            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              
              {/* Location Input */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>{t('jobs.filterLocation', 'Location')}</Text>
                <TextInput
                  style={[styles.filterInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}
                  placeholder={t('jobs.filterLocationPlaceholder', 'Enter city or neighborhood...')}
                  placeholderTextColor={colors.placeholder}
                  value={filterLocation}
                  onChangeText={setFilterLocation}
                />
              </View>

              {/* Min Budget Input */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>{t('jobs.filterMinBudget', 'Minimum Budget')}</Text>
                <TextInput
                  style={[styles.filterInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}
                  placeholder={t('jobs.filterBudgetPlaceholder', 'e.g. 10000')}
                  placeholderTextColor={colors.placeholder}
                  value={filterMinBudget}
                  onChangeText={setFilterMinBudget}
                  keyboardType="numeric"
                />
              </View>

              {/* Urgency Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>{t('jobs.filterUrgency', 'Urgency')}</Text>
                <View style={styles.filterPillsRow}>
                  {['all', 'normal', 'urgent', 'emergency'].map(level => {
                    const active = filterUrgency === level;
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[styles.filterPill, {
                          borderColor: active ? '#0D9488' : colors.border,
                          backgroundColor: active ? 'rgba(13, 148, 136, 0.1)' : 'transparent',
                        }]}
                        onPress={() => setFilterUrgency(level)}
                      >
                        <Text style={[styles.filterPillText, { color: active ? '#0D9488' : colors.textSecondary }]}>
                          {t(`jobs.priority_${level}`, level).toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Sort By Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>{t('jobs.sortBy', 'Sort By')}</Text>
                <View style={styles.filterPillsRow}>
                  {[
                    { id: 'recent', label: t('jobs.sortRecent', 'Most Recent') },
                    { id: 'budget', label: t('jobs.sortBudget', 'Highest Budget') }
                  ].map(sort => {
                    const active = filterSortBy === sort.id;
                    return (
                      <TouchableOpacity
                        key={sort.id}
                        style={[styles.filterPill, {
                          borderColor: active ? '#0D9488' : colors.border,
                          backgroundColor: active ? 'rgba(13, 148, 136, 0.1)' : 'transparent',
                        }]}
                        onPress={() => setFilterSortBy(sort.id)}
                      >
                        <Text style={[styles.filterPillText, { color: active ? '#0D9488' : colors.textSecondary }]}>
                          {sort.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

            </ScrollView>

            {/* Actions Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.clearBtn, { borderColor: colors.border, backgroundColor: 'transparent' }]}
                onPress={() => {
                  setFilterLocation('');
                  setFilterMinBudget('');
                  setFilterUrgency('all');
                  setFilterSortBy('recent');
                }}
              >
                <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>{t('common.reset', 'Reset')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtnModal}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyBtnTextModal}>{t('common.apply', 'Apply')}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* ONE-TAP EXTERNAL JOB APPLY MODAL */}
      <Modal
        visible={Boolean(selectedExternalJob)}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedExternalJob(null)}
      >
        <View style={styles.extModalOverlay}>
          <View style={[styles.extModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.extModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.extModalBadgeText, { color: '#2563EB' }]}>
                  🌐 {selectedExternalJob?.companyName || 'External Opportunity'}
                </Text>
                <Text style={[styles.extModalTitle, { color: colors.text }]}>
                  {selectedExternalJob?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedExternalJob(null)} style={styles.extModalCloseBtn}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={[styles.noticeBox, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <Text style={{ fontSize: 12, color: isDarkMode ? '#93C5FD' : '#1D4ED8', lineHeight: 18 }}>
                  ⚡ <Text style={{ fontWeight: '800' }}>One-Tap Apply via Fixam</Text>: We deliver your CV and application directly to the recruiter's inbox. Replies go straight to your email.
                </Text>
              </View>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
              <TextInput
                value={extApplicantName}
                onChangeText={setExtApplicantName}
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address (Recruiter Replies)</Text>
              <TextInput
                value={extApplicantEmail}
                onChangeText={setExtApplicantEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
              <TextInput
                value={extApplicantPhone}
                onChangeText={setExtApplicantPhone}
                keyboardType="phone-pad"
                placeholder="+237 6..."
                placeholderTextColor={colors.placeholder}
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>CV Document / Link (Google Sheets, Drive, or Profile CV)</Text>
              <TextInput
                value={extCvLink}
                onChangeText={setExtCvLink}
                placeholder="https://docs.google.com/spreadsheets/... or file link"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />

              <View style={[styles.cvAttachRow, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
                <MaterialCommunityIcons name="file-document-check" size={22} color="#10B981" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                    {extCvLink ? (extCvLink.includes('docs.google.com/spreadsheets') ? 'Google Sheets Document' : 'Document Link Attached') : (user?.cvName || 'Profile CV / Resume')}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '600' }}>
                    ✓ Forwarded exactly as it is to the employer
                  </Text>
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Cover Letter (Editable Draft)</Text>
              <TextInput
                value={extCoverLetter}
                onChangeText={setExtCoverLetter}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={[styles.inputField, { height: 100, color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setSelectedExternalJob(null)}
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendExternalApplication}
                disabled={isApplyingExternal}
                style={[styles.modalSubmitBtn, { opacity: isApplyingExternal ? 0.7 : 1 }]}
              >
                {isApplyingExternal ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={16} color="#FFF" />
                    <Text style={styles.modalSubmitText}>Send Application</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
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
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  catScroll: {
    paddingVertical: 10,
    gap: 8,
    marginBottom: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
  },
  catText: {
    fontSize: 13,
    fontWeight: '700',
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
  tabScroll: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  filterInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  applyBtnModal: {
    flex: 2,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnTextModal: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
  externalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  externalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  extModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  extModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  extModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  extModalBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  extModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  extModalCloseBtn: {
    padding: 6,
    marginLeft: 8,
  },
  noticeBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 6,
  },
  cvAttachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalSubmitText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default FindJobsScreen;
