// Post Task Screen with multi-step form and admin approval flow
import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, StatusBar, Modal, Alert, Image
} from 'react-native';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { translateService, translateStatus } from '../../i18n/translate';

const tasksHeroImage = require('../../../assets/tasks_hero.png');

const TASK_CATS = [
  { id: '1', name: 'PLUMBING', icon: 'pipe-wrench' },
  { id: '2', name: 'ELECTRICAL', icon: 'lightning-bolt-circle' },
  { id: '3', name: 'CLEANING', icon: 'broom' },
  { id: '4', name: 'PAINTING', icon: 'format-paint' },
  { id: '5', name: 'CARPENTRY', icon: 'hammer' },
  { id: '6', name: 'GARDENING', icon: 'flower' },
  { id: '7', name: 'MOVING', icon: 'truck-outline' },
  { id: '8', name: 'APPLIANCE', icon: 'fridge-outline' },
  { id: '9', name: 'REPAIR', icon: 'wrench' },
  { id: '10', name: 'OTHER', icon: 'dots-horizontal-circle' },
];

const PREFERENCES = [
  { id: 'verified', labelKey: 'verifiedProfessionals', icon: 'shield-check-outline' },
  { id: 'fast', labelKey: 'fastResponse', icon: 'lightning-bolt-outline' },
  { id: 'rated', labelKey: 'highlyRated', icon: 'star-outline' },
  { id: 'today', labelKey: 'availableToday', icon: 'clock-outline' },
];

const FILTERS = [
  { label: 'All Tasks', value: 'ALL', color: '#0D9488' },
  { label: 'Pending', value: 'PENDING', color: '#F59E0B' },
  { label: 'In Progress', value: 'IN_PROGRESS', color: '#2563EB' },
  { label: 'Completed', value: 'COMPLETED', color: '#16A34A' },
  { label: 'Cancelled', value: 'CANCELLED', color: '#EF4444' },
];

const CATEGORY_COLORS = {
  PLUMBING: { text: '#0D9488', bg: '#DFFAF5' },
  ELECTRICAL: { text: '#2563EB', bg: '#EAF2FF' },
  CLEANING: { text: '#8B5CF6', bg: '#F0E8FF' },
  REPAIR: { text: '#F97316', bg: '#FFF1E7' },
  OTHER: { text: '#64748B', bg: '#F1F5F9' },
};

const STATUS_STYLES = {
  PENDING: { label: 'Pending Approval', icon: 'clock-outline', text: '#F59E0B', bg: '#FEF3C7' },
  PENDING_APPROVAL: { label: 'Pending Approval', icon: 'clock-outline', text: '#F59E0B', bg: '#FEF3C7' },
  ASSIGNED: { label: 'Provider Selected', icon: 'check-outline', text: '#2563EB', bg: '#EAF2FF' },
  IN_PROGRESS: { label: 'In Progress', icon: 'sync', text: '#7C3AED', bg: '#F3E8FF' },
  COMPLETED: { label: 'Completed', icon: 'check-circle-outline', text: '#0D9488', bg: '#E2F8F4' },
  CANCELLED: { label: 'Cancelled', icon: 'close-circle-outline', text: '#EF4444', bg: '#FEE2E2' },
  REJECTED: { label: 'Cancelled', icon: 'close-circle-outline', text: '#EF4444', bg: '#FEE2E2' },
};

const pad2 = (value) => String(value).padStart(2, '0');

const formatDateInput = (date) => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const formatTimeInput = (date) => {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const normalizeTaskStatus = (job) => {
  if (job.approvalStatus === 'REJECTED') return 'CANCELLED';
  if (job.approvalStatus === 'PENDING_APPROVAL') return 'PENDING';
  const rawStatus = String(job.status || 'PENDING').toUpperCase();
  if (rawStatus === 'OPEN') return 'PENDING';
  // Keep ASSIGNED status as-is (don't map to IN_PROGRESS)
  return rawStatus;
};

const formatCardDate = (job) => {
  const value = job.scheduledTime || job.createdAt;
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '16/05/2026';
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
};

const PostTaskScreen = ({ route, navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { jobs, fetchAppData } = useAppContext();
  const { t, locale } = useLanguage();
  
  const [step, setStep] = useState('details'); // 'details', 'review', 'success'
  const [taskMode, setTaskMode] = useState(route?.params?.startOnPost ? 'post' : 'tasks');
  const [editingJob, setEditingJob] = useState(null);
  const [selectedCat, setSelectedCat] = useState('PLUMBING');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('50000');
  const [budgetMin, setBudgetMin] = useState('5000');
  const [budgetMax, setBudgetMax] = useState('15000');
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [budgetMode, setBudgetMode] = useState('fixed');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [whatNeedsDone, setWhatNeedsDone] = useState('');
  const [importantDetails, setImportantDetails] = useState('');
  const [taskScope, setTaskScope] = useState('');
  const [materialsProvider, setMaterialsProvider] = useState('professional');
  const [selectedPreferences, setSelectedPreferences] = useState(['verified', 'fast', 'rated', 'today']);
  const [detailEditor, setDetailEditor] = useState(null);
  
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateDraft, setDateDraft] = useState(formatDateInput(new Date()));
  const [timeDraft, setTimeDraft] = useState(formatTimeInput(new Date()));

  useEffect(() => {
    if (route?.params?.startOnPost) {
      startNewTask();
    } else {
      setTaskMode('tasks');
      setStep('details');
    }
  }, [route?.params?.startOnPost, route?.params?.resetKey]);

  const resetForm = () => {
    setEditingJob(null);
    setSelectedCat('PLUMBING');
    setTitle('');
    setDescription('');
    setLocation('');
    setBudget('50000');
    setBudgetMin('5000');
    setBudgetMax('15000');
    setBudgetMode('fixed');
    setSelectedPhotos([]);
    setCategorySearch('');
    setShowCategoryPicker(false);
    setWhatNeedsDone('');
    setImportantDetails('');
    setTaskScope('');
    setMaterialsProvider('professional');
    setSelectedPreferences(['verified', 'fast', 'rated', 'today']);
    setDetailEditor(null);
    setScheduledDate(new Date());
    setScheduledTime(new Date());
  };

  const startNewTask = () => {
    resetForm();
    setTaskMode('post');
    setStep('details');
  };

  const navigateToCreateTask = () => {
    navigation.navigate('Create Task', {
      screen: 'PostTask',
      params: { startOnPost: true, resetKey: Date.now() },
    });
  };

  const startEditTask = (job) => {
    const scheduled = job.scheduledTime ? new Date(job.scheduledTime) : new Date();
    setEditingJob(job);
    setSelectedCat(job.category || 'PLUMBING');
    setTitle(job.title || '');
    setDescription(job.description || '');
    setLocation(job.location || '');
    setBudget(String(job.budget || job.budgetMax || '50000'));
    setBudgetMin(String(job.budgetMin || job.budget || '5000'));
    setBudgetMax(String(job.budgetMax || job.budget || '15000'));
    setBudgetMode(job.budgetMin && job.budgetMax && job.budgetMin !== job.budgetMax ? 'range' : 'fixed');
    setSelectedPhotos([]);
    setCategorySearch(job.category || '');
    setWhatNeedsDone(job.whatNeedsDone || '');
    setImportantDetails(job.importantDetails || '');
    setTaskScope(job.taskScope || '');
    setMaterialsProvider(job.materialsProvider || 'professional');
    setSelectedPreferences(job.preferences || ['verified', 'fast', 'rated', 'today']);
    setDetailEditor(null);
    setScheduledDate(Number.isNaN(scheduled.getTime()) ? new Date() : scheduled);
    setScheduledTime(Number.isNaN(scheduled.getTime()) ? new Date() : scheduled);
    setTaskMode('post');
    setStep('details');
  };

  const returnToTaskList = () => {
    resetForm();
    setTaskMode('tasks');
    setStep('details');
  };

  const openDrawer = () => {
    const stackParent = navigation.getParent?.();
    const tabParent = stackParent?.getParent?.();
    const drawerParent = tabParent?.getParent?.();

    if (drawerParent?.openDrawer) drawerParent.openDrawer();
    else if (tabParent?.openDrawer) tabParent.openDrawer();
    else stackParent?.openDrawer?.();
  };

  const openDatePicker = () => {
    setDateDraft(formatDateInput(scheduledDate));
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setTimeDraft(formatTimeInput(scheduledTime));
    setShowTimePicker(true);
  };

  const applyDateDraft = () => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateDraft.trim());
    if (!match) {
      Alert.alert(t('jobs.invalidDate'), t('jobs.invalidDateFormat'));
      return;
    }
    const nextDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(nextDate.getTime()) || nextDate < today) {
      Alert.alert(t('jobs.invalidDate'), t('jobs.invalidDateFuture'));
      return;
    }
    setScheduledDate(nextDate);
    setShowDatePicker(false);
  };

  const applyTimeDraft = () => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(timeDraft.trim());
    if (!match) {
      Alert.alert(t('jobs.invalidTime'), t('jobs.invalidTimeFormat'));
      return;
    }
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) {
      Alert.alert(t('jobs.invalidTime'), t('jobs.invalidTimeValid'));
      return;
    }
    const nextTime = new Date(scheduledTime);
    nextTime.setHours(hours, minutes, 0, 0);
    setScheduledTime(nextTime);
    setShowTimePicker(false);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('jobs.permissionDenied'), t('jobs.locationPermissionBody'));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    } catch (error) {
      Alert.alert(t('common.error'), t('jobs.locationFailed'));
    }
  };

  const validateForm = () => {
    if (!title.trim()) return t('jobs.taskTitleRequired');
    if (!location.trim()) return t('jobs.locationRequired');
    const min = budgetMode === 'range' ? parseInt(budgetMin) : parseInt(budget);
    const max = budgetMode === 'range' ? parseInt(budgetMax) : parseInt(budget);
    if (!min || !max || min <= 0 || max <= 0) return t('jobs.budgetRequired');
    if (min > max) return t('jobs.budgetMinMax');
    return null;
  };

  const handleNext = () => {
    const error = validateForm();
    if (error) {
      Alert.alert(t('jobs.validationError'), error);
      return;
    }
    setStep('description');
  };

  const handleDescriptionNext = () => {
    if (!description.trim()) {
      Alert.alert(t('jobs.validationError'), t('jobs.descriptionRequired'));
      return;
    }
    setStep('review');
  };

  const pickTaskPhoto = async () => {
    if (selectedPhotos.length >= 5) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(t('jobs.permissionDenied'), t('jobs.photoPermissionBody'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setSelectedPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 5));
      }
    } catch (error) {
      Alert.alert(t('jobs.uploadFailed'), t('jobs.photoUploadFailed'));
    }
  };

  const removeTaskPhoto = (uri) => {
    setSelectedPhotos((prev) => prev.filter((item) => item !== uri));
  };

  const togglePreference = (id) => {
    setSelectedPreferences((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const getCategoryLabel = (catName) => translateService(catName);

  const selectCategory = (cat) => {
    setSelectedCat(cat.name);
    setCategorySearch(getCategoryLabel(cat.name));
    setShowCategoryPicker(false);
  };

  const filteredCategories = TASK_CATS.filter((cat) => (
    getCategoryLabel(cat.name).toLowerCase().includes(categorySearch.trim().toLowerCase()) ||
    cat.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
  ));

  const openDetailEditor = (type) => {
    setDetailEditor(type);
  };

  const closeDetailEditor = () => {
    setDetailEditor(null);
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const scheduledDateTime = new Date(
        scheduledDate.getFullYear(),
        scheduledDate.getMonth(),
        scheduledDate.getDate(),
        scheduledTime.getHours(),
        scheduledTime.getMinutes()
      );
      const payload = {
        title, description, location,
        budget: budgetMode === 'range' ? parseInt(budgetMax) : parseInt(budget),
        budgetMin: budgetMode === 'range' ? parseInt(budgetMin) : parseInt(budget),
        budgetMax: budgetMode === 'range' ? parseInt(budgetMax) : parseInt(budget),
        category: locale === 'fr' ? getCategoryLabel(selectedCat) : selectedCat,
        scheduledTime: scheduledDateTime.toISOString(),
        whatNeedsDone,
        importantDetails,
        taskScope,
        materialsProvider,
        preferences: selectedPreferences,
      };
      if (editingJob) {
        await api.put(`/jobs/${editingJob.id}`, payload);
      } else {
        await api.post('/jobs', payload);
      }
      await fetchAppData?.();
      setStep('success');
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('jobs.publishFailed'));
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (job, status) => {
    try {
      await api.put(`/jobs/${job.id}/status`, { status });
      await fetchAppData?.();
      Alert.alert(t('jobs.updated'), status === 'COMPLETED' ? t('jobs.completedBody') : t('jobs.updatedBody'));
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('jobs.updateFailedClient'));
    }
  };

  const renderTaskCard = (job) => {
    const canEdit = job.status !== 'COMPLETED' && job.status !== 'CANCELLED';
    const normalizedStatus = normalizeTaskStatus(job);
    const statusStyle = STATUS_STYLES[normalizedStatus] || STATUS_STYLES.PENDING;
    const category = String(job.category || 'TASK');
    const categoryStyle = CATEGORY_COLORS[category.toUpperCase()] || CATEGORY_COLORS.OTHER;
    const isComplete = normalizedStatus === 'COMPLETED';
    const isInProgress = normalizedStatus === 'IN_PROGRESS';
    const description = job.description || t('jobs.noDescription');
    const locationText = job.location || '4.1070, 9.7619';
    const titleText = job.title || t('jobs.untitledTask');
    const applicantCount = job._count?.assignments ?? job.assignments?.length ?? 0;

    // FCFA budget formatting
    const budgetMin = Number(job.budgetMin || job.budget || 0);
    const budgetMax = Number(job.budgetMax || job.budget || 0);
    const budgetDisplay = budgetMin !== budgetMax
      ? `${budgetMin.toLocaleString()} – ${budgetMax.toLocaleString()} FCFA`
      : `${budgetMin.toLocaleString()} FCFA`;

    const selectedAssignment = job.assignments?.find((assignment) => assignment.id === job.selectedAssignmentId) || job.assignments?.find((assignment) => assignment.status === 'ACCEPTED');
    const assignedProviderUser = job.provider || selectedAssignment?.provider?.user;
    const assignedProvider = assignedProviderUser ? {
      name: assignedProviderUser.fullName || assignedProviderUser.name || t('jobs.assignedProfessional'),
      id: assignedProviderUser.id,
      avatar: assignedProviderUser.avatar || assignedProviderUser.image,
    } : null;

    const openChatWithProvider = (provider, currentJob) => {
      navigation.navigate('Chat', {
        receiverId: provider.id,
        userName: provider.name,
        avatar: provider.avatar,
        task: currentJob
      });
    };

    return (
      <TouchableOpacity
        key={job.id}
        style={[styles.taskCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
        onPress={() => navigation.navigate('JobStatus', { job })}
        activeOpacity={0.85}
      >
        <View style={styles.taskCardHeader}>
          <View style={[styles.catBadge, { backgroundColor: categoryStyle.bg }]}>
            <Text style={[styles.catBadgeText, { color: categoryStyle.text }]}>{translateService(category).toUpperCase()}</Text>
          </View>
          <View style={styles.cardRightMeta}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={20} color="#64748B" />
            <Text style={styles.cardDate}>{formatCardDate(job)}</Text>
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="dots-vertical" size={24} color={isDarkMode ? '#F8FAFC' : '#071936'} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.taskBodyRow}>
          <View style={styles.taskCopy}>
            <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">{titleText}</Text>
            <Text style={[styles.taskDescriptionText, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">{description}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
            <MaterialCommunityIcons name={statusStyle.icon} size={18} color={statusStyle.text} />
            <Text style={[styles.statusPillText, { color: statusStyle.text }]}>{translateStatus(normalizedStatus).toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.taskMetaGrid}>
          <View style={[styles.taskMetaItem, { flex: 1, minWidth: 0 }]}>
            <MaterialCommunityIcons name="map-marker" size={22} color="#0D9488" />
            <Text style={[styles.taskMetaValue, { color: colors.text, flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">{locationText}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={[styles.taskMetaItem, { flex: 1, minWidth: 0 }]}>
            <MaterialCommunityIcons name="wallet-outline" size={18} color="#06B85F" />
            <Text style={[styles.budgetValue, { flexShrink: 1 }]} numberOfLines={1}>{budgetDisplay}</Text>
          </View>
        </View>

        {job.rejectionReason ? (
          <View style={styles.rejectionBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={[styles.rejectionText, { color: colors.error }]}>{t('jobs.reason')}: {job.rejectionReason}</Text>
          </View>
        ) : null}

        {/* Applicant count */}
        <View style={styles.applicantCountRow}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={16}
            color={applicantCount > 0 ? '#0D9488' : '#94A3B8'}
          />
          <Text style={[styles.applicantCountText, { color: applicantCount > 0 ? '#0D9488' : '#94A3B8' }]}>
            {applicantCount === 0
              ? t('jobs.noApplicants')
              : applicantCount === 1
                ? t('jobs.oneApplicant')
                : t('jobs.applicantsCount', { count: applicantCount })}
          </Text>
        </View>

        <View style={styles.taskActionGroup}>
          <TouchableOpacity 
            style={[styles.secondaryActionBtn, { backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC', borderColor: colors.border }]}
            onPress={() => navigation.navigate('JobStatus', { job })}
          >
            <MaterialCommunityIcons name="eye" size={18} color={isDarkMode ? '#F8FAFC' : '#071936'} />
            <Text style={[styles.secondaryActionText, { color: colors.text }]}>{t('jobs.details')}</Text>
          </TouchableOpacity>
          
          {assignedProvider && (
            <TouchableOpacity
              style={[styles.secondaryActionBtn, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}
              onPress={() => openChatWithProvider(assignedProvider, job)}
            >
              <MaterialCommunityIcons name="message-text-outline" size={18} color={colors.accent} />
              <Text style={[styles.secondaryActionText, { color: colors.accent }]}>{t('tabs.messages', 'Message')}</Text>
            </TouchableOpacity>
          )}


          {isComplete ? (
            <TouchableOpacity style={[styles.secondaryActionBtn, styles.bookAgainBtn, { backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC', borderColor: colors.border }]} onPress={navigateToCreateTask}>
              <MaterialCommunityIcons name="sync" size={18} color={isDarkMode ? '#F8FAFC' : '#071936'} />
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>{t('jobs.bookAgain')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryActionBtn, isInProgress && styles.blueActionBtn]}
              onPress={() => Alert.alert(t('jobs.completeTask'), t('jobs.completeTaskBody'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('jobs.complete'), onPress: () => updateTaskStatus(job, 'COMPLETED') }
              ])}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFF" />
              <Text style={styles.primaryActionText}>{isInProgress ? t('jobs.markCompleted') : t('jobs.done')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const visibleJobs = (jobs || []).filter((job) => {
    const normalizedStatus = normalizeTaskStatus(job);
    if (activeFilter === 'ALL') return true;
    // Group PENDING and ASSIGNED together under "Pending" tab
    if (activeFilter === 'PENDING') {
      return normalizedStatus === 'PENDING' || normalizedStatus === 'ASSIGNED';
    }
    return normalizedStatus === activeFilter;
  });

  const detailEditorConfig = detailEditor === 'what'
    ? {
      title: t('jobs.whatNeedsDone'),
      subtitle: t('jobs.whatNeedsDoneSub'),
      value: whatNeedsDone,
      setter: setWhatNeedsDone,
      placeholder: t('jobs.whatNeedsDonePlaceholder'),
    }
    : detailEditor === 'important'
      ? {
        title: t('jobs.importantDetails'),
        subtitle: t('jobs.importantDetailsSub'),
        value: importantDetails,
        setter: setImportantDetails,
        placeholder: t('jobs.importantDetailsPlaceholder'),
      }
      : detailEditor === 'scope'
        ? {
          title: t('jobs.taskScope'),
          subtitle: t('jobs.taskScopeSub'),
          value: taskScope,
          setter: setTaskScope,
          placeholder: t('jobs.taskScopePlaceholder'),
        }
        : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      

      {taskMode === 'tasks' && (
        <>
          <View style={[styles.tasksHeader, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={openDrawer} style={[styles.menuBtn, { backgroundColor: isDarkMode ? '#111827' : '#F1F5F9' }]}>
              <MaterialCommunityIcons name="menu" size={26} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.tasksHeaderTitle, { color: colors.text }]}>{t('jobs.myTasks')}</Text>
            <TouchableOpacity onPress={navigateToCreateTask} style={styles.addTaskBtn}>
              <MaterialCommunityIcons name="plus" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <LinearGradient
              colors={['#0D9488', '#2180F3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tasksHero}
            >
              <View style={styles.tasksHeroText}>
                <Text style={styles.tasksHeroTitle}>{t('jobs.postedTasks')}</Text>
                <Text style={styles.tasksHeroSubtitle} numberOfLines={3} ellipsizeMode="tail">{t('jobs.postedTasksSubtitle')}</Text>
              </View>
              <Image source={tasksHeroImage} style={styles.tasksHeroImage} />
            </LinearGradient>

            <View style={[styles.filterBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 8 }}
                style={{ flex: 1 }}
              >
                {FILTERS.map((filter) => {
                  const active = activeFilter === filter.value;
                  return (
                    <TouchableOpacity key={filter.value} style={styles.filterItem} onPress={() => setActiveFilter(filter.value)}>
                      <View style={styles.filterLabelRow}>
                        <Text style={[styles.filterText, active && { color: filter.color }, !active && { color: colors.textSecondary }]}>
                          {filter.value === 'ALL' ? t('jobs.allTasks') : translateStatus(filter.value)}
                        </Text>
                        {filter.value !== 'ALL' && <View style={[styles.filterDot, { backgroundColor: filter.color }]} />}
                      </View>
                      <View style={[styles.filterUnderline, active && { backgroundColor: filter.color }]} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.taskList}>
              {visibleJobs.length === 0 ? (
                <View style={styles.emptyTasks}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={colors.border} />
                  <Text style={[styles.emptyTasksTitle, { color: colors.text }]}>{t('jobs.noTasksHere')}</Text>
                  <Text style={[styles.emptyTasksText, { color: colors.textSecondary }]}>{t('jobs.firstTaskHint')}</Text>
                  <TouchableOpacity style={[styles.submitBtn, { marginTop: 20, width: '100%', backgroundColor: colors.accent }]} onPress={navigateToCreateTask}>
                    <Text style={styles.submitBtnText}>{t('jobs.postFirstTask')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                visibleJobs.map(renderTaskCard)
              )}
            </View>
          </ScrollView>
        </>
      )}

      {taskMode === 'post' && step === 'details' && (
        <>
          <View style={[styles.createHeader, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={editingJob ? returnToTaskList : openDrawer} style={[styles.createBackBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name={editingJob ? 'arrow-left' : 'menu'} size={32} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.createHeaderTitle, { color: colors.text }]}>{editingJob ? t('jobs.editTask') : t('jobs.createTask')}</Text>
            <View style={{ width: 52 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets contentContainerStyle={styles.createScrollContent}>
            <View style={styles.createStepper}>
              {[t('jobs.taskDetails'), t('jobs.description'), t('jobs.review')].map((label, index) => {
                const active = index === 0;
                return (
                  <React.Fragment key={label}>
                    <View style={styles.createStepUnit}>
                      <View style={[styles.createStepCircle, active && styles.createStepCircleActive]}>
                        <Text style={[styles.createStepNum, active && styles.createStepNumActive]}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.createStepLabel, active && styles.createStepLabelActive]}>{label}</Text>
                    </View>
                    {index < 2 && <View style={styles.createStepConnector} />}
                  </React.Fragment>
                );
              })}
            </View>

            <LinearGradient
              colors={['#0D9488', '#2180F3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createHero}
            >
              <View style={styles.createHeroTextWrap}>
                <Text style={styles.createHeroTitle}>{t('jobs.createTask')}</Text>
                <Text style={styles.createHeroSub}>{t('jobs.postedTasksSubtitle')}</Text>
              </View>
              <Image source={tasksHeroImage} style={styles.createHeroImage} resizeMode="contain" />
            </LinearGradient>

              <View style={styles.sectionTitleRow}>
                <Text style={[styles.createSectionLabel, { color: colors.text }]}>{t('jobs.category')}</Text>
                <TouchableOpacity onPress={() => setShowCategoryPicker((value) => !value)}>
                  <Text style={styles.viewAllText}>{t('jobs.viewAll')}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.categorySearchWrap, { backgroundColor: isDarkMode ? '#1F2937' : '#FFF', borderColor: colors.border }]}>
                <MaterialCommunityIcons name="shape-outline" size={21} color="#0D9488" />
                <TextInput
                  style={[styles.categorySearchInput, { color: colors.text }]}
                  placeholder={t('jobs.selectCategory')}
                  placeholderTextColor="#94A3B8"
                  value={showCategoryPicker ? categorySearch : getCategoryLabel(selectedCat)}
                  onFocus={() => {
                    setCategorySearch('');
                    setShowCategoryPicker(true);
                  }}
                  onChangeText={(value) => {
                    setCategorySearch(value);
                    setShowCategoryPicker(true);
                  }}
                />
                <MaterialCommunityIcons name={showCategoryPicker ? 'chevron-up' : 'chevron-right'} size={24} color="#64748B" />
              </View>
              {showCategoryPicker && (
                <View style={[styles.categoryResults, { backgroundColor: isDarkMode ? '#1F2937' : '#FFF', borderColor: colors.border }]}>
                  {(filteredCategories.length ? filteredCategories : TASK_CATS).map((cat) => {
                    const active = selectedCat === cat.name;
                    return (
                      <TouchableOpacity key={cat.id} style={[styles.categoryResultItem, { backgroundColor: isDarkMode ? '#1F2937' : '#FFF', borderBottomColor: colors.border }]} onPress={() => selectCategory(cat)}>
                        <View style={[styles.categoryResultIcon, active && styles.categoryResultIconActive]}>
                          <MaterialCommunityIcons name={cat.icon} size={18} color={active ? '#FFF' : '#0D9488'} />
                        </View>
                        <Text style={[styles.categoryResultText, { color: colors.text }]}>{getCategoryLabel(cat.name)}</Text>
                        {active && <MaterialCommunityIcons name="check-circle" size={20} color="#0D9488" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.createFieldGroup}>
                <Text style={[styles.createSectionLabel, { color: colors.text }]}>{t('jobs.taskTitle')}</Text>
                <TextInput
                  style={[styles.createInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDarkMode ? '#1F2937' : '#FFF' }]}
                  placeholder={t('jobs.taskTitlePlaceholder')}
                  placeholderTextColor="#94A3B8"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={80}
                />
                <Text style={styles.inputCounter}>{title.length}/80</Text>
              </View>

              <View style={styles.createFieldGroup}>
                <Text style={[styles.createSectionLabel, { color: colors.text }]}>{t('jobs.location')}</Text>
                <View style={[styles.createLocationInput, { borderColor: colors.border, backgroundColor: isDarkMode ? '#1F2937' : '#FFF' }]}>
                  <MaterialCommunityIcons name="map-marker-outline" size={21} color="#0D9488" />
                  <TextInput
                    style={[styles.createLocationTextInput, { color: colors.text }]}
                    placeholder="Douala, Cameroon"
                    placeholderTextColor="#94A3B8"
                    value={location}
                    onChangeText={setLocation}
                  />
                  <TouchableOpacity onPress={getCurrentLocation}>
                    <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#0D9488" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.fieldHint}>{t('jobs.locationHint')}</Text>
              </View>

              <View style={styles.createFieldGroup}>
                <Text style={[styles.createSectionLabel, { color: colors.text }]}>{t('jobs.budget')}</Text>
                <View style={styles.budgetModeRow}>
                  <TouchableOpacity style={[styles.budgetModeBtn, { backgroundColor: isDarkMode ? '#1F2937' : '#FFF', borderColor: colors.border }, budgetMode === 'fixed' && [styles.budgetModeBtnActive, { backgroundColor: isDarkMode ? 'rgba(13, 148, 136, 0.1)' : '#F8FFFD', borderColor: '#0D9488' }]]} onPress={() => setBudgetMode('fixed')}>
                    <Text style={[styles.budgetModeTitle, { color: colors.textSecondary }, budgetMode === 'fixed' && [styles.budgetModeTitleActive, { color: colors.text }]]}>{t('jobs.fixedPrice')}</Text>
                    <Text style={[styles.budgetModeSub, { color: colors.textSecondary }]}>{t('jobs.setBudget')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.budgetModeBtn, { backgroundColor: isDarkMode ? '#1F2937' : '#FFF', borderColor: colors.border }, budgetMode === 'range' && [styles.budgetModeBtnActive, { backgroundColor: isDarkMode ? 'rgba(13, 148, 136, 0.1)' : '#F8FFFD', borderColor: '#0D9488' }]]} onPress={() => setBudgetMode('range')}>
                    <Text style={[styles.budgetModeTitle, { color: colors.textSecondary }, budgetMode === 'range' && [styles.budgetModeTitleActive, { color: colors.text }]]}>{t('jobs.priceRange')}</Text>
                    <Text style={[styles.budgetModeSub, { color: colors.textSecondary }]}>{t('jobs.setRange')}</Text>
                  </TouchableOpacity>
                </View>
                {budgetMode === 'range' ? (
                  <View style={styles.budgetRangeRow}>
                    <View style={[styles.budgetRangeInputWrap, { backgroundColor: isDarkMode ? '#1F2937' : '#FFF', borderColor: colors.border }]}>
                      <Text style={styles.rangeLabel}>{t('jobs.min')} FCFA</Text>
                      <TextInput
                        style={[styles.budgetAmountInput, { color: colors.text }]}
                        value={budgetMin}
                        onChangeText={setBudgetMin}
                        keyboardType="numeric"
                        placeholder="5,000"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={[styles.budgetRangeInputWrap, { backgroundColor: isDarkMode ? '#1F2937' : '#FFF', borderColor: colors.border }]}>
                      <Text style={styles.rangeLabel}>{t('jobs.max')} FCFA</Text>
                      <TextInput
                        style={[styles.budgetAmountInput, { color: colors.text }]}
                        value={budgetMax}
                        onChangeText={setBudgetMax}
                        keyboardType="numeric"
                        placeholder="15,000"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>
                ) : (
                  <View style={[styles.budgetAmountRow, { borderColor: colors.border, backgroundColor: isDarkMode ? '#1F2937' : '#FFF' }]}>
                    <View style={[styles.currencyBox, { backgroundColor: isDarkMode ? '#374151' : '#F1F5F9' }]}>
                      <Text style={[styles.currencyBoxText, { color: colors.text }]}>FCFA</Text>
                    </View>
                    <TextInput
                      style={[styles.budgetAmountInput, { color: colors.text }]}
                      value={budget}
                      onChangeText={setBudget}
                      keyboardType="numeric"
                      placeholder={t('jobs.enterBudget')}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                )}
                <Text style={styles.fieldHint}>{t('jobs.budgetHint')}</Text>
              </View>

              <View style={styles.createFieldGroup}>
                <Text style={[styles.createSectionLabel, { color: colors.text }]}>{t('jobs.uploadPhotos')} <Text style={styles.optionalText}>({t('jobs.optional')})</Text></Text>
                <Text style={styles.fieldHintStrong}>{t('jobs.photosHint')}</Text>
                <View style={styles.photoRow}>
                  <TouchableOpacity style={styles.addPhotoBox} onPress={pickTaskPhoto}>
                    <MaterialCommunityIcons name="image-outline" size={26} color="#0D9488" />
                    <Text style={styles.addPhotoText}>{t('jobs.addPhoto')}</Text>
                  </TouchableOpacity>
                  {selectedPhotos.map((uri) => (
                    <View key={uri} style={styles.photoThumbWrap}>
                      <Image source={{ uri }} style={styles.photoThumb} />
                      <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removeTaskPhoto(uri)}>
                        <MaterialCommunityIcons name="close" size={16} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <Text style={styles.fieldHint}>{t('jobs.maxPhotosHint', { count: 5 })}</Text>
              </View>

              <View style={styles.createFieldGroup}>
                <Text style={[styles.createSectionLabel, { color: colors.text }]}>{t('jobs.additionalPreferences')} <Text style={styles.optionalText}>({t('jobs.optional')})</Text></Text>
                <View style={styles.preferenceGrid}>
                  {PREFERENCES.map((pref) => {
                    const active = selectedPreferences.includes(pref.id);
                    return (
                      <TouchableOpacity key={pref.id} style={[styles.preferenceChip, { backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }, active && [styles.preferenceChipActive, { backgroundColor: isDarkMode ? 'rgba(13, 148, 136, 0.1)' : '#F0FDFA' }]]} onPress={() => togglePreference(pref.id)}>
                        <MaterialCommunityIcons name={pref.icon} size={18} color={active ? '#0D9488' : '#64748B'} />
                        <Text style={[styles.preferenceText, { color: colors.textSecondary }, active && [styles.preferenceTextActive, { color: colors.text }]]}>{t(`jobs.preferences.${pref.labelKey}`)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

            <TouchableOpacity style={styles.createPrimaryBtn} onPress={handleNext}>
              <Text style={styles.createPrimaryText}>{t('jobs.continueToDescription')}</Text>
              <MaterialCommunityIcons name="arrow-right" size={22} color="#FFF" />
            </TouchableOpacity>
          </ScrollView>
        </>
      )}

      {taskMode === 'post' && step === 'description' && !detailEditorConfig && (
        <>
          <View style={[styles.createHeader, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => setStep('details')} style={[styles.createBackBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="chevron-left" size={30} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.createHeaderTitle, { color: colors.text }]}>{t('jobs.taskDescription')}</Text>
            <View style={{ width: 52 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets contentContainerStyle={styles.createScrollContent}>
            <View style={styles.createStepper}>
              {[t('jobs.taskDetails'), t('jobs.description'), t('jobs.review')].map((label, index) => {
                const active = index === 1;
                const done = index < 1;
                return (
                  <React.Fragment key={label}>
                    <View style={styles.createStepUnit}>
                      <View style={[styles.createStepCircle, (active || done) && styles.createStepCircleActive]}>
                        <Text style={[styles.createStepNum, (active || done) && styles.createStepNumActive]}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.createStepLabel, active && styles.createStepLabelActive]}>{label}</Text>
                    </View>
                    {index < 2 && <View style={[styles.createStepConnector, done && styles.createStepConnectorDone]} />}
                  </React.Fragment>
                );
              })}
            </View>

            <View style={styles.tipCard}>
              <MaterialCommunityIcons name="lightbulb-outline" size={34} color="#0D9488" />
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{t('jobs.tip')}</Text>
                <Text style={styles.tipText}>{t('jobs.detailsTip')}</Text>
              </View>
              <MaterialCommunityIcons name="close" size={22} color="#0D9488" />
            </View>

            <Text style={[styles.descriptionLabel, { color: colors.text }]}>{t('jobs.describeTask')}</Text>
            <View style={[styles.descriptionInputWrap, { backgroundColor: isDarkMode ? '#1F2937' : '#FFF', borderColor: colors.border }]}>
              <TextInput
                style={[styles.descriptionInput, { color: colors.text }]}
                placeholder={t('jobs.descriptionPlaceholder')}
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={styles.descriptionCounter}>{description.length}/1000</Text>
            </View>
            <Text style={styles.descriptionHint}>{t('jobs.descriptionHint')}</Text>

            <TouchableOpacity style={[styles.descriptionPromptCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openDetailEditor('what')}>
              <View>
                <Text style={[styles.promptTitle, { color: colors.text }]}>{t('jobs.whatNeedsDone')}</Text>
                <Text style={[styles.promptText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {whatNeedsDone || t('jobs.whatNeedsDoneExample')}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.descriptionPromptCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openDetailEditor('important')}>
              <View>
                <Text style={[styles.promptTitle, { color: colors.text }]}>{t('jobs.importantDetails')}</Text>
                <Text style={[styles.promptText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {importantDetails || t('jobs.importantDetailsExample')}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.descriptionPromptCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openDetailEditor('scope')}>
              <View>
                <Text style={[styles.promptTitle, { color: colors.text }]}>{t('jobs.taskScope')}</Text>
                <Text style={[styles.promptText, { color: colors.textSecondary }]}>{taskScope || t('jobs.selectScope')}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.materialsCard}>
              <Text style={[styles.promptTitle, { color: colors.text }]}>{t('jobs.materials')}</Text>
              <Text style={[styles.promptText, { color: colors.textSecondary }]}>{t('jobs.materialsQuestion')}</Text>
              <View style={styles.materialsRow}>
                <TouchableOpacity style={[styles.materialOption, { backgroundColor: isDarkMode ? '#1F2937' : '#FFF', borderColor: colors.border }, materialsProvider === 'professional' && [styles.materialOptionActive, { backgroundColor: isDarkMode ? 'rgba(13, 148, 136, 0.1)' : '#F8FFFD', borderColor: '#0D9488' }]]} onPress={() => setMaterialsProvider('professional')}>
                  {materialsProvider === 'professional' && (
                    <View style={styles.materialCheck}>
                      <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                    </View>
                  )}
                  <MaterialCommunityIcons name="briefcase-variant" size={28} color="#0D9488" />
                  <Text style={[styles.materialTitle, { color: colors.text }]}>{t('common.provider')}</Text>
                  <Text style={[styles.materialSub, { color: colors.textSecondary }]}>{t('jobs.professionalMaterialsSub')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.materialOption, { backgroundColor: isDarkMode ? '#1F2937' : '#FFF', borderColor: colors.border }, materialsProvider === 'client' && [styles.materialOptionActive, { backgroundColor: isDarkMode ? 'rgba(13, 148, 136, 0.1)' : '#F8FFFD', borderColor: '#0D9488' }]]} onPress={() => setMaterialsProvider('client')}>
                  {materialsProvider === 'client' && (
                    <View style={styles.materialCheck}>
                      <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                    </View>
                  )}
                  <MaterialCommunityIcons name="account-outline" size={30} color="#475569" />
                  <Text style={[styles.materialTitle, { color: colors.text }]}>{t('jobs.iWillProvide')}</Text>
                  <Text style={[styles.materialSub, { color: colors.textSecondary }]}>{t('jobs.clientMaterialsSub')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.descriptionActions}>
              <TouchableOpacity style={styles.descriptionBackBtn} onPress={() => setStep('details')}>
                <MaterialCommunityIcons name="arrow-left" size={22} color="#071936" />
                <Text style={styles.descriptionBackText}>{t('common.back')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.descriptionNextBtn} onPress={handleDescriptionNext}>
                <Text style={styles.descriptionNextText}>{t('jobs.continueToReview')}</Text>
                <MaterialCommunityIcons name="arrow-right" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.secureRow}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color="#0D9488" />
              <Text style={styles.secureText}>{t('jobs.infoSecure')}</Text>
            </View>
          </ScrollView>
        </>
      )}

      {taskMode === 'post' && step === 'description' && detailEditorConfig && (
        <>
          <View style={[styles.createHeader, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={closeDetailEditor} style={[styles.createBackBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="chevron-left" size={30} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.createHeaderTitle, { color: colors.text }]}>{detailEditorConfig.title}</Text>
            <View style={{ width: 52 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets contentContainerStyle={styles.createScrollContent}>
            <View style={[styles.detailEditorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.detailEditorTitle, { color: colors.text }]}>{detailEditorConfig.title}</Text>
              <Text style={[styles.detailEditorSub, { color: colors.textSecondary }]}>{detailEditorConfig.subtitle}</Text>
              <TextInput
                style={[styles.detailEditorInput, { color: colors.text, backgroundColor: isDarkMode ? '#1F2937' : '#FFF', borderColor: colors.border }]}
                value={detailEditorConfig.value}
                onChangeText={detailEditorConfig.setter}
                placeholder={detailEditorConfig.placeholder}
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity style={styles.createPrimaryBtn} onPress={closeDetailEditor}>
              <Text style={styles.createPrimaryText}>{t('jobs.saveDetails')}</Text>
              <MaterialCommunityIcons name="check" size={22} color="#FFF" />
            </TouchableOpacity>
          </ScrollView>
        </>
      )}

      {taskMode === 'post' && step === 'review' && (
        <>
          <View style={[styles.createHeader, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => setStep('description')} style={[styles.createBackBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="chevron-left" size={30} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.createHeaderTitle, { color: colors.text }]}>{t('jobs.reviewTask')}</Text>
            <View style={{ width: 52 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets contentContainerStyle={styles.createScrollContent}>
            <View style={styles.createStepper}>
              {[t('jobs.taskDetails'), t('jobs.description'), t('jobs.review')].map((label, index) => (
                <React.Fragment key={label}>
                  <View style={styles.createStepUnit}>
                    <View style={styles.createStepCircleActive}>
                      <Text style={styles.createStepNumActive}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.createStepLabel, index === 2 && styles.createStepLabelActive]}>{label}</Text>
                  </View>
                  {index < 2 && <View style={[styles.createStepConnector, styles.createStepConnectorDone]} />}
                </React.Fragment>
              ))}
            </View>

            <Text style={[styles.mainTitle, { color: colors.text }]}>{t('jobs.reviewYourTask')}</Text>

            <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.catBadge, { backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.1)' : colors.accentSoft }]}>
                <Text style={[styles.catBadgeText, { color: colors.accent }]}>{getCategoryLabel(selectedCat)}</Text>
              </View>
              <Text style={[styles.reviewTitle, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.reviewDescription, { color: colors.textSecondary }]}>{description}</Text>

              <View style={styles.reviewGrid}>
                <View style={styles.reviewItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>📍 {t('jobs.location')}</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{location}</Text>
                </View>
                <View style={styles.reviewItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>💰 {t('jobs.budget')}</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>
                    {budgetMode === 'range'
                      ? `${parseInt(budgetMin).toLocaleString()} - ${parseInt(budgetMax).toLocaleString()} XAF`
                      : `${parseInt(budget).toLocaleString()} XAF`}
                  </Text>
                </View>
                <View style={styles.reviewItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>📅 {t('jobs.date')}</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{scheduledDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}</Text>
                </View>
                <View style={styles.reviewItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>⏰ {t('jobs.time')}</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>

              {whatNeedsDone ? (
                <View style={styles.reviewFullItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>{t('jobs.whatNeedsDone')}</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{whatNeedsDone}</Text>
                </View>
              ) : null}

              {importantDetails ? (
                <View style={styles.reviewFullItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>{t('jobs.importantDetails')}</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{importantDetails}</Text>
                </View>
              ) : null}

              <View style={styles.reviewGrid}>
                <View style={styles.reviewItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>{t('jobs.scope')}</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{taskScope || t('common.notAvailable')}</Text>
                </View>
                <View style={styles.reviewItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>{t('jobs.materials')}</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{materialsProvider === 'professional' ? t('jobs.professionalWillProvide') : t('jobs.clientWillProvide')}</Text>
                </View>
                <View style={styles.reviewItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>{t('jobs.photos')}</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{t('jobs.photosUploaded', { count: selectedPhotos.length })}</Text>
                </View>
              </View>

              {selectedPhotos.length > 0 && (
                <View style={styles.reviewPhotoRow}>
                  {selectedPhotos.map((uri) => (
                    <Image key={uri} source={{ uri }} style={styles.reviewPhoto} />
                  ))}
                </View>
              )}

              <View style={[styles.infoBox, { backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.1)' : colors.accentSoft, borderColor: colors.accent }]}>
                <MaterialCommunityIcons name="information-outline" size={20} color={colors.accent} />
                <Text style={[styles.infoText, { color: colors.accent }]}>{t('jobs.taskApprovalNotification')}</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.backBtn2, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setStep('description')}>
                <MaterialCommunityIcons name="chevron-left" size={20} color={colors.text} />
                <Text style={[styles.backBtnText, { color: colors.text }]}>{t('jobs.back')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: colors.accent }]} onPress={handlePublish} disabled={loading}>
                <Text style={styles.submitBtnText}>{loading ? t('jobs.saving') : editingJob ? t('jobs.saveChanges') : t('jobs.publishTask')}</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      )}

      {taskMode === 'post' && step === 'success' && (
        <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.success + '15', padding: 25, borderRadius: 50 }]}>
            <MaterialCommunityIcons name="check-decagram" size={90} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>{editingJob ? t('jobs.taskUpdated') : t('jobs.taskPosted')}</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            {t('jobs.successSubtitle')}
          </Text>

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={returnToTaskList}>
            <Text style={styles.primaryBtnText}>{t('jobs.viewMyTasks')}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.accent }]} onPress={startNewTask}>
            <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>{t('jobs.postAnotherTask')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tasksHeader: {
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  menuBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tasksHeaderTitle: {
    color: '#071936',
    fontSize: 26,
    fontWeight: '900',
  },
  addTaskBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 14,
    elevation: 8,
  },
  createHeader: {
    paddingTop: 54,
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
  },
  createBackBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createHeaderTitle: {
    color: '#071936',
    fontSize: 19,
    fontWeight: '900',
  },
  createScrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 140,
  },
  createStepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 28,
    paddingHorizontal: 34,
  },
  createStepUnit: {
    width: 72,
    alignItems: 'center',
  },
  createStepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8EEF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  createStepCircleActive: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  createStepNum: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
  },
  createStepNumActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  createStepLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  createStepLabelActive: {
    color: '#0D9488',
  },
  createStepConnector: {
    flex: 1,
    height: 1,
    backgroundColor: '#D8E0EA',
    marginTop: 15,
    marginHorizontal: -18,
  },
  createStepConnectorDone: {
    backgroundColor: '#0D9488',
  },
  createHero: {
    minHeight: 140,
    borderRadius: 12,
    overflow: 'hidden',
    paddingLeft: 20,
    paddingRight: 122,
    justifyContent: 'center',
    marginBottom: 24,
  },
  createHeroTextWrap: {
    justifyContent: 'center',
  },
  createHeroTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
    marginBottom: 10,
  },
  createHeroSub: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
  },
  createHeroImage: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 96,
    height: 88,
  },
  createFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  createSectionLabel: {
    color: '#071936',
    fontSize: 15,
    fontWeight: '900',
  },
  optionalText: {
    color: '#64748B',
    fontWeight: '700',
  },
  viewAllText: {
    color: '#0D9488',
    fontSize: 14,
    fontWeight: '900',
  },
  categoryChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryChoice: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  categoryChoiceActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  categoryChoiceText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
  },
  categoryChoiceTextActive: {
    color: '#0D9488',
  },
  createFieldGroup: {
    marginBottom: 24,
  },
  createInput: {
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4EE',
    color: '#071936',
    paddingHorizontal: 14,
    paddingRight: 58,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  inputCounter: {
    position: 'absolute',
    right: 14,
    bottom: 18,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  createLocationInput: {
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4EE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  createLocationTextInput: {
    flex: 1,
    color: '#071936',
    fontSize: 14,
    fontWeight: '800',
  },
  fieldHint: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 9,
  },
  fieldHintStrong: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 12,
  },
  budgetModeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 14,
  },
  budgetModeBtn: {
    flex: 1,
    minHeight: 70,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  budgetModeBtnActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  budgetModeTitle: {
    color: '#071936',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 5,
  },
  budgetModeTitleActive: {
    color: '#0D9488',
  },
  budgetModeSub: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  budgetAmountRow: {
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4EE',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  budgetRangeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  budgetRangeInputWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#FFF',
  },
  rangeLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '800',
    marginBottom: 2,
  },
  currencyBox: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  currencyBoxText: {
    color: '#071936',
    fontSize: 13,
    fontWeight: '900',
  },
  budgetAmountInput: {
    flex: 1,
    color: '#071936',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  addPhotoBox: {
    width: 78,
    height: 78,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FFFD',
  },
  addPhotoText: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 5,
  },
  photoThumbWrap: {
    width: 78,
    height: 78,
    borderRadius: 8,
  },
  photoThumb: {
    width: 78,
    height: 78,
    borderRadius: 8,
  },
  removePhotoBtn: {
    position: 'absolute',
    right: -8,
    top: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  createPrimaryBtn: {
    height: 58,
    borderRadius: 10,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 8,
    marginBottom: 18,
  },
  createPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  categorySearchWrap: {
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4EE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  categorySearchInput: {
    flex: 1,
    color: '#071936',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryResults: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 22,
  },
  categoryResultItem: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryResultIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryResultIconActive: {
    backgroundColor: '#0D9488',
  },
  categoryResultText: {
    flex: 1,
    color: '#071936',
    fontSize: 14,
    fontWeight: '900',
  },
  preferenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  preferenceChip: {
    minHeight: 38,
    borderRadius: 7,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },
  preferenceChipActive: {
    backgroundColor: '#F0FDFA',
  },
  preferenceText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  preferenceTextActive: {
    color: '#071936',
  },
  detailEditorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
  },
  detailEditorTitle: {
    color: '#071936',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  detailEditorSub: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailEditorInput: {
    minHeight: 190,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4EE',
    color: '#071936',
    padding: 14,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
  },
  tipCard: {
    minHeight: 100,
    borderRadius: 12,
    backgroundColor: '#F0FDFA',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 26,
  },
  tipTitle: {
    color: '#071936',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 7,
  },
  tipText: {
    color: '#071936',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  descriptionLabel: {
    color: '#071936',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  descriptionInputWrap: {
    minHeight: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4EE',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 8,
  },
  descriptionInput: {
    minHeight: 116,
    color: '#071936',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
  },
  descriptionCounter: {
    alignSelf: 'flex-end',
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
  },
  descriptionHint: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 22,
  },
  descriptionPromptCard: {
    minHeight: 88,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  materialsCard: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  materialsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  materialOption: {
    flex: 1,
    minHeight: 142,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  materialOptionActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F8FFFD',
  },
  materialCheck: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialTitle: {
    color: '#071936',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 10,
    textAlign: 'center',
  },
  materialSub: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  promptTitle: {
    color: '#071936',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  promptText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '700',
    maxWidth: 270,
  },
  descriptionActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 26,
  },
  descriptionBackBtn: {
    flex: 0.55,
    height: 58,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  descriptionBackText: {
    color: '#071936',
    fontSize: 15,
    fontWeight: '900',
  },
  descriptionNextBtn: {
    flex: 1.45,
    height: 58,
    borderRadius: 10,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  descriptionNextText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  secureText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  backBtn2: { flex: 0.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 15, borderWidth: 1 },
  backBtnText: { fontSize: 15, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 0, paddingBottom: 122 },
  tasksHero: {
    minHeight: 146,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 0,
    overflow: 'hidden',
    paddingLeft: 22,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tasksHeroText: { flex: 1, flexShrink: 1, paddingRight: 8, justifyContent: 'center' },
  tasksHeroTitle: {
    color: '#FFF',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  tasksHeroSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 4,
  },
  tasksHeroImage: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  filterBar: {
    marginHorizontal: 0,
    marginBottom: 0,
    height: 64,
    borderRadius: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterScroll: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  filterItem: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  filterLabelRow: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  filterText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
  },
  filterUnderline: {
    width: 36,
    height: 4,
    borderRadius: 3,
    marginTop: 9,
    backgroundColor: 'transparent',
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 30, paddingHorizontal: 20 },
  stepItem: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  stepNum: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  stepNumInactive: { fontSize: 16, fontWeight: '800' },
  stepLine: { width: 60, height: 2, marginHorizontal: 10 },
  mainTitle: { fontSize: 28, fontWeight: '900', paddingHorizontal: 20, marginBottom: 25 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30, paddingHorizontal: 20 },
  catCard: { width: '23%', borderRadius: 12, paddingVertical: 14, alignItems: 'center', gap: 8, borderWidth: 1.5 },
  catIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  catName: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  form: { gap: 24, marginBottom: 40, paddingHorizontal: 20 },
  inputGroup: { gap: 10 },
  inputLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  input: { borderRadius: 12, padding: 16, fontSize: 16, fontWeight: '600', borderWidth: 1.5 },
  textArea: { height: 120, textAlignVertical: 'top' },
  locationInputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1.5, height: 56 },
  locationInput: { flex: 1, fontSize: 16, marginLeft: 12, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 16 },
  budgetInputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, height: 56, borderWidth: 1.5 },
  currency: { fontSize: 16, fontWeight: '800', marginRight: 8 },
  budgetInput: { flex: 1, fontSize: 18, fontWeight: '800' },
  datePickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, height: 56, borderWidth: 1.5 },
  dateText: { fontSize: 15, fontWeight: '700' },
  submitBtn: { marginHorizontal: 20, borderRadius: 14, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 4 },
  submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 10, paddingHorizontal: 20 },
  reviewCard: { marginHorizontal: 8, borderRadius: 5, padding: 18, borderWidth: 1.5, marginBottom: 30 },
  reviewTitle: { fontSize: 24, fontWeight: '900', marginBottom: 14 },
  reviewDescription: { fontSize: 16, lineHeight: 24, marginBottom: 20 },
  reviewGrid: { gap: 16, marginBottom: 24 },
  reviewItem: { gap: 4 },
  reviewFullItem: { gap: 7, marginBottom: 16 },
  reviewPhotoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  reviewPhoto: { width: 86, height: 86, borderRadius: 5 },
  reviewLabel: { fontSize: 13, fontWeight: '800' },
  reviewValue: { fontSize: 16, fontWeight: '700' },
  infoBox: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 12, borderLeftWidth: 6 },
  infoText: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 20 },
  taskList: { gap: 0 },
  taskCard: {
    marginHorizontal: 0,
    marginBottom: 0,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderRadius: 0,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  taskCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardRightMeta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardDate: { color: '#64748B', fontSize: 15, fontWeight: '900' },
  catBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  catBadgeText: { fontSize: 13, fontWeight: '900' },
  taskBodyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 18 },
  taskCopy: { flex: 1, minWidth: 0 },
  taskTitle: { color: '#071936', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  taskDescriptionText: { color: '#1E2E4A', fontSize: 15, lineHeight: 23, fontWeight: '500' },
  statusPill: {
    minWidth: 116,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  statusPillText: { fontSize: 13, fontWeight: '900' },
  taskMetaGrid: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  taskMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  taskMetaValue: { color: '#071936', fontSize: 15, fontWeight: '800' },
  metaDivider: { width: 1.5, height: 21, backgroundColor: '#CBD5E1' },
  budgetValue: { color: '#06B85F', fontSize: 16, fontWeight: '900' },
  rejectionBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, marginBottom: 15, backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  rejectionText: { fontSize: 13, fontWeight: '700', flex: 1 },
  taskActionGroup: { flexDirection: 'row', gap: 8, marginTop: 5 },
  applicantCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  applicantCountText: { fontSize: 12, fontWeight: '700' },
  secondaryActionBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
  },
  bookAgainBtn: { flex: 1.85 },
  secondaryActionText: { color: '#071936', fontSize: 13, fontWeight: '900' },
  primaryActionBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0D9488',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 2,
    paddingHorizontal: 8,
  },
  blueActionBtn: {
    flex: 1.45,
    backgroundColor: '#1F73F1',
    shadowColor: '#1F73F1',
  },
  primaryActionText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  iconWrap: { marginBottom: 30 },
  successTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 16 },
  successSubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  primaryBtn: { borderRadius: 16, paddingVertical: 18, width: '100%', alignItems: 'center', marginBottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  primaryBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  secondaryBtn: { borderWidth: 2, borderRadius: 16, paddingVertical: 16, width: '100%', alignItems: 'center' },
  secondaryBtnText: { fontSize: 16, fontWeight: '800' },
  emptyTasks: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyTasksTitle: { marginTop: 20, fontSize: 22, fontWeight: '900' },
  emptyTasksText: { marginTop: 10, fontSize: 15, textAlign: 'center', lineHeight: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 30 },
  pickerModal: { borderRadius: 24, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  modalInput: { height: 56, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, fontSize: 16, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalCancelBtn: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  modalApplyBtn: { flex: 1, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { fontWeight: '800' },
  modalApplyText: { color: '#FFF', fontWeight: '800' },
});

export default PostTaskScreen;
