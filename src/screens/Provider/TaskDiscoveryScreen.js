import React, { useState, useEffect } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, ScrollView, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getCurrencyForUser } from '../../constants/countries';

const TaskDiscoveryScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t, locale, language } = useLanguage();
  const isFr = (locale || language || '')?.startsWith('fr');
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // External Job One-Tap Apply Modal state
  const [selectedExternalJob, setSelectedExternalJob] = useState(null);
  const [extApplicantName, setExtApplicantName] = useState(user?.fullName || '');
  const [extApplicantEmail, setExtApplicantEmail] = useState(user?.email || '');
  const [extApplicantPhone, setExtApplicantPhone] = useState(user?.phone || '');
  const [extCoverLetter, setExtCoverLetter] = useState('');
  const [isPriorityExternal, setIsPriorityExternal] = useState(false);
  const [isApplyingExternal, setIsApplyingExternal] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchTasks(1);
  }, [sortBy, searchTerm, locationFilter]);

  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      const [res, extRes] = await Promise.allSettled([
        api.get('/jobs/available', {
          params: { page, limit: ITEMS_PER_PAGE, sortBy, search: searchTerm, location: locationFilter }
        }),
        api.get('/external-jobs', {
          params: { page, limit: ITEMS_PER_PAGE, search: searchTerm, location: locationFilter }
        })
      ]);
      const direct = res.status === 'fulfilled' ? (res.value.data?.data || []) : [];
      const external = extRes.status === 'fulfilled' ? (extRes.value.data?.data || []) : [];
      setTasks(Array.from(new Map([...direct, ...external].map(task => [task.id, task])).values()));
      setCurrentPage(res.status === 'fulfilled' ? (res.value.data?.pagination?.page || 1) : 1);
      setTotalPages(res.status === 'fulfilled' ? (res.value.data?.pagination?.pages || 1) : 1);
    } catch (error) {
      console.log('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchTasks(newPage);
      setCurrentPage(newPage);
    }
  };

  const handleTaskPress = (task) => {
    navigation.navigate('TaskDetails', { task, taskId: task.id });
  };

  const handleSendExternalApplication = async () => {
    if (!extApplicantEmail.trim()) {
      Alert.alert(
        t('common.error', isFr ? 'Obligatoire' : 'Required'),
        isFr ? 'Veuillez saisir votre adresse e-mail pour que les recruteurs puissent vous contacter.' : 'Please enter your email address so recruiters can reach you.'
      );
      return;
    }
    try {
      setIsApplyingExternal(true);
      const res = await api.post(`/external-jobs/${selectedExternalJob.id}/apply`, {
        applicantName: extApplicantName.trim(),
        applicantEmail: extApplicantEmail.trim(),
        applicantPhone: extApplicantPhone.trim(),
        coverLetter: extCoverLetter.trim(),
        cvUrl: null,
        cvName: null,
        isPriority: isPriorityExternal
      });
      if (res.data?.success) {
        Alert.alert(
          '🎉 ' + (isFr ? 'Candidature envoyée !' : t('jobs.applicationSent', 'Application Sent!')),
          isFr
            ? `Votre candidature a été transmise à ${selectedExternalJob.companyName}. Les réponses du recruteur arriveront directement dans votre boîte e-mail à ${extApplicantEmail}.`
            : `Your application has been delivered to ${selectedExternalJob.companyName}. Recruiter replies will arrive in your email inbox at ${extApplicantEmail}.`
        );
        setSelectedExternalJob(null);
        setTasks(prev => prev.filter(t => t.id !== selectedExternalJob.id));
      }
    } catch (err) {
      Alert.alert(
        t('common.error', isFr ? 'Erreur' : 'Error'),
        err.response?.data?.message || (isFr ? 'Échec de l\'envoi de la candidature. Veuillez réessayer.' : 'Failed to send application. Please try again.')
      );
    } finally {
      setIsApplyingExternal(false);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const normalized = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    const then = new Date(normalized);
    if (Number.isNaN(then.getTime())) return '';
    const diffSec = Math.max(0, Math.floor((Date.now() - then.getTime()) / 1000));
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) { const m = Math.floor(diffSec / 60); return `${m} min ago`; }
    if (diffSec < 86400) { const h = Math.floor(diffSec / 3600); return `${h} hr${h > 1 ? 's' : ''} ago`; }
    const d = Math.floor(diffSec / 86400);
    if (d === 1) return 'Yesterday';
    if (d < 7) return `${d} days ago`;
    if (d < 30) { const w = Math.floor(d / 7); return `${w} week${w > 1 ? 's' : ''} ago`; }
    const mo = Math.floor(d / 30);
    return `${mo} month${mo > 1 ? 's' : ''} ago`;
  };

  const TaskCard = ({ task }) => (
    <TouchableOpacity
      onPress={() => task.isExternal
        ? navigation.navigate('TaskDetails', { task, taskId: task.id })
        : handleTaskPress(task)}
      style={[
        styles.taskCard,
        { backgroundColor: colors.card, borderColor: colors.border }
      ]}
    >
      <View style={styles.taskHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
            {task.isPinned && (
              <View style={[styles.externalBadge, { backgroundColor: isDarkMode ? '#78350F' : '#FEFCE8', borderColor: '#FDE047' }]}>
                <Text style={[styles.externalBadgeText, { color: isDarkMode ? '#FDE047' : '#854D0E', fontWeight: '800' }]}>
                  {isFr ? 'EN VEDETTE' : 'FEATURED'}
                </Text>
              </View>
            )}
            {task.isExternal ? (
              <View style={[styles.externalBadge, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF', borderColor: '#93C5FD' }]}>
                <Text style={[styles.externalBadgeText, { color: isDarkMode ? '#BFDBFE' : '#1D4ED8' }]}>
                  {task.companyName || (isFr ? 'Entreprise vérifiée' : 'Verified company')}
                </Text>
              </View>
            ) : (
              <View style={[styles.externalBadge, { backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <Text style={[styles.externalBadgeText, { color: isDarkMode ? '#A7F3D0' : '#047857' }]}>
                  ⚡ Fixam Job
                </Text>
              </View>
            )}
            {Number(task.providersNeeded) > 1 && (
              <View style={[styles.externalBadge, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF', borderColor: '#C7D2FE' }]}>
                <Text style={[styles.externalBadgeText, { color: isDarkMode ? '#C7D2FE' : '#4F46E5', fontWeight: '800' }]}>
                  👥 {task.providersNeeded} {isFr ? 'prestataires demandés' : 'providers needed'}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
          <Text style={[styles.taskCategory, { color: colors.textSecondary }]}>
            {task.category}
          </Text>
        </View>
        <View style={[styles.budgetBadge, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.budgetText, { color: colors.accent }]}>
            {task.budget} {getCurrencyForUser(task.country || user?.country || 'Cameroon')}
          </Text>
        </View>
      </View>

      <Text
        numberOfLines={2}
        style={[styles.taskDescription, { color: colors.textSecondary }]}
      >
        {task.description}
      </Text>

      <View style={styles.taskMeta}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons
            name="map-marker"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {task.location}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {timeAgo(task.createdAt)}
          </Text>
        </View>

        {Boolean(task.applicationCount || task._count?.assignments || task.assignments?.length) && (
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name="account"
              size={14}
              color={colors.accent}
            />
            <Text style={[styles.metaText, { color: colors.accent }]}>
              {task.applicationCount || task._count?.assignments || task.assignments?.length} bid(s)
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Available Tasks</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterBtn}>
            <MaterialCommunityIcons name="tune" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search tasks..."
            placeholderTextColor={colors.placeholder}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={[styles.filterSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.filterItem}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Location</Text>
              <TextInput
                style={[styles.filterInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Filter by location..."
                placeholderTextColor={colors.placeholder}
                value={locationFilter}
                onChangeText={setLocationFilter}
              />
            </View>

            <View style={styles.filterItem}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Sort By</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortOptions}>
                {[
                  { label: 'Newest', value: 'newest' },
                  { label: 'Price: High', value: 'price_high' },
                  { label: 'Price: Low', value: 'price_low' },
                  { label: 'Oldest', value: 'oldest' }
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setSortBy(option.value)}
                    style={[
                      styles.sortOption,
                      {
                        backgroundColor: sortBy === option.value ? colors.accent : colors.background,
                        borderColor: colors.border
                      }
                    ]}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      { color: sortBy === option.value ? '#FFF' : colors.text }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Tasks List */}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.centerContent}>
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={60}
              color={colors.placeholder}
              style={{ marginBottom: 15 }}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>No tasks found</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Try adjusting your filters
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={filteredTasks}
              renderItem={({ item }) => <TaskCard task={item} />}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
            />

            {/* Pagination */}
            <View style={[styles.pagination, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={[
                  styles.pageButton,
                  {
                    backgroundColor: currentPage === 1 ? colors.border : colors.accent,
                    opacity: currentPage === 1 ? 0.5 : 1
                  }
                ]}
              >
                <MaterialCommunityIcons name="chevron-left" size={20} color="#FFF" />
              </TouchableOpacity>

              <Text style={[styles.pageInfo, { color: colors.text }]}>
                {currentPage} / {totalPages}
              </Text>

              <TouchableOpacity
                onPress={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={[
                  styles.pageButton,
                  {
                    backgroundColor: currentPage === totalPages ? colors.border : colors.accent,
                    opacity: currentPage === totalPages ? 0.5 : 1
                  }
                ]}
              >
                <MaterialCommunityIcons name="chevron-right" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ONE-TAP EXTERNAL JOB APPLY MODAL */}
        <Modal
          visible={Boolean(selectedExternalJob)}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedExternalJob(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalBadgeText, { color: '#2563EB' }]}>
                    {selectedExternalJob?.companyName || (isFr ? 'Entreprise vérifiée' : 'Verified company')}
                  </Text>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedExternalJob?.title}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedExternalJob(null)} style={styles.modalCloseBtn}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={[styles.noticeBox, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <Text style={{ fontSize: 12, color: isDarkMode ? '#93C5FD' : '#1D4ED8', lineHeight: 18 }}>
                    <Text style={{ fontWeight: '800' }}>{isFr ? 'Postuler maintenant' : 'Apply now'}</Text>: {isFr
                      ? 'Votre CV et votre candidature sont transmis directement au recruteur. Les réponses arrivent directement sur votre e-mail.'
                      : 'We deliver your CV and application directly to the recruiter\'s inbox. Replies go straight to your email.'}
                  </Text>
                </View>

                <View style={{ marginBottom: 14 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{isFr ? 'Aperçu du poste' : 'Job overview'}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{selectedExternalJob?.description}</Text>
                  {Array.isArray(selectedExternalJob?.details) && selectedExternalJob.details.filter(detail => detail?.key !== 'description' && detail?.content).map(detail => (
                    <View key={detail.key} style={{ marginTop: 12 }}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>{detail.label}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{detail.content}</Text>
                    </View>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: colors.text }]}>{isFr ? 'Nom complet' : 'Full Name'}</Text>
                <TextInput
                  value={extApplicantName}
                  onChangeText={setExtApplicantName}
                  style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                />

                <Text style={[styles.inputLabel, { color: colors.text }]}>{isFr ? 'Adresse e-mail (Réponses directes)' : 'Email Address (Recruiter Replies)'}</Text>
                <TextInput
                  value={extApplicantEmail}
                  onChangeText={setExtApplicantEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                />

                <Text style={[styles.inputLabel, { color: colors.text }]}>{isFr ? 'Numéro de téléphone' : 'Phone Number'}</Text>
                <TextInput
                  value={extApplicantPhone}
                  onChangeText={setExtApplicantPhone}
                  keyboardType="phone-pad"
                  placeholder="+237 6..."
                  placeholderTextColor={colors.placeholder}
                  style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                />

                <View style={[styles.cvAttachRow, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="file-document-check" size={22} color="#10B981" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                      {user?.cvName || (isFr ? 'CV du profil Fixam' : 'Profile CV / Resume')}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '600' }}>
                      {isFr ? '✓ Joint depuis votre profil certifié Fixam' : '✓ Attached from your Fixam profile'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.inputLabel, { color: colors.text }]}>{isFr ? 'Message au recruteur (Brouillon modifiable)' : 'Cover Letter (Editable Draft)'}</Text>
                <TextInput
                  value={extCoverLetter}
                  onChangeText={setExtCoverLetter}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  style={[styles.inputField, { height: 100, color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                />

                {/* Priority Application Boost Option */}
                <TouchableOpacity
                  onPress={() => setIsPriorityExternal(!isPriorityExternal)}
                  activeOpacity={0.8}
                  style={{
                    marginVertical: 10,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: isPriorityExternal ? '#EAB308' : (isDarkMode ? '#334155' : '#E2E8F0'),
                    backgroundColor: isPriorityExternal ? (isDarkMode ? '#3A2E05' : '#FEFCE8') : (isDarkMode ? '#1E293B' : '#F8FAFC'),
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: isPriorityExternal ? '#CA8A04' : '#94A3B8',
                      backgroundColor: isPriorityExternal ? '#EAB308' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isPriorityExternal && (
                      <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                        {isFr ? 'Candidature Prioritaire' : 'Priority Application Boost'}
                      </Text>
                      <View style={{ backgroundColor: '#FEF08A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#854D0E' }}>
                          2 {isFr ? 'Pièces' : 'Coins'}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2, lineHeight: 15 }}>
                      {isFr
                        ? "Bannière dorée 'Candidat Recommandé Fixam' et mention prioritaire dans l'e-mail du recruteur."
                        : "Gold 'Fixam Recommended Candidate' banner and priority subject line in recruiter's inbox."}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Live Tracking Information */}
                <View
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: isDarkMode ? '#1E3A8A22' : '#EFF6FF',
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#1E3A8A' : '#BFDBFE'
                  }}
                >
                  <Text style={{ fontSize: 11, color: isDarkMode ? '#93C5FD' : '#1D4ED8', lineHeight: 16 }}>
                    <Text style={{ fontWeight: '700' }}>{isFr ? 'Suivi en direct : ' : 'Live tracking: '}</Text>
                    {isFr
                      ? "Vous recevrez une notification push et un e-mail dès que le recruteur consultera votre CV."
                      : "You'll receive a push notification & email the instant the employer opens your CV."}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setSelectedExternalJob(null)}
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>{isFr ? 'Annuler' : 'Cancel'}</Text>
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
                      <Text style={styles.modalSubmitText}>{isFr ? 'Envoyer la candidature' : 'Send Application'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center'
  },
  filterBtn: {
    padding: 8
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500'
  },
  filterSection: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1
  },
  filterItem: {
    marginBottom: 12
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  filterInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '500'
  },
  sortOptions: {
    marginTop: 8
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '700'
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  taskCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4
  },
  taskCategory: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  budgetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  budgetText: {
    fontSize: 13,
    fontWeight: '800'
  },
  taskDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500'
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: '500'
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    marginBottom: 20
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pageInfo: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center'
  },
  externalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 6
  },
  externalBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24
  },
  modalCloseBtn: {
    padding: 6,
    marginLeft: 8
  },
  noticeBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 6
  },
  cvAttachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 8
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700'
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  modalSubmitText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800'
  }
});

export default TaskDiscoveryScreen;
