import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform
} from 'react-native';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { CustomHeader } from '../../navigation/NavigationComponents';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getCurrencyForUser } from '../../constants/countries';
import api from '../../services/api';

const monthNamesEn = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const monthNamesFr = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const ReportsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const isFr = language?.startsWith('fr');
  const monthNames = isFr ? monthNamesFr : monthNamesEn;

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/providers/reports/all');
      if (res.data?.success) {
        setReports(res.data.data || []);
      }
    } catch (e) {
      console.log('Failed to fetch reports', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchReports);
    fetchReports();
    return unsub;
  }, [fetchReports, navigation]);

  // Initialize selectedMonth to the last completed month
  useEffect(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const names = language?.startsWith('fr') ? monthNamesFr : monthNamesEn;
    setSelectedMonth({
      year: prev.getFullYear(),
      month: prev.getMonth() + 1,
      label: `${names[prev.getMonth()]} ${prev.getFullYear()}`
    });
  }, [language]);

  // Generate last 12 months for dropdown selection
  const availableMonths = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`
      });
    }
    return list;
  }, [monthNames]);

  const activeReport = useMemo(() => {
    if (!selectedMonth) return null;
    return reports.find(
      r => r.year === selectedMonth.year && r.month === selectedMonth.month
    );
  }, [reports, selectedMonth]);

  const ongoingCheck = useMemo(() => {
    if (!selectedMonth) return { isOngoing: false };
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();

    const isCurrent = selectedMonth.year === currentYear && selectedMonth.month === currentMonth;
    const isMonthEnd = isCurrent && currentDay === lastDayOfMonth;
    
    return {
      isOngoing: isCurrent && !isMonthEnd
    };
  }, [selectedMonth]);

  const handleViewCompileReport = async () => {
    if (!selectedMonth) return;
    try {
      setGenerating(true);
      const res = await api.post('/providers/reports/generate', {
        year: selectedMonth.year,
        month: selectedMonth.month
      });
      if (res.data?.success) {
        fetchReports();
      }
    } catch (e) {
      const errMsg = e.response?.data?.message || t('home.generateError', 'Failed to generate report.');
      if (errMsg.toLowerCase().includes('no data')) {
        Alert.alert(
          t('home.noDataAvailable', 'No Data Available'),
          t('home.noDataDesc', 'No performance stats or transaction records exist for the selected month.')
        );
      } else {
        Alert.alert(t('common.error', 'Error'), errMsg);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <CustomHeader navigation={navigation} title={t('home.reports', 'Reports')} colors={colors} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        <Text style={[styles.title, { color: colors.text }]}>{t('home.earningsReports', 'Earnings & Stats Reports')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('home.reportsSubtitle', 'Select a month to view your statement and compiled performance metrics.')}
        </Text>

        {/* Dropdown Selector */}
        <View style={styles.selectorContainer}>
          <TouchableOpacity 
            style={[styles.dropdownButton, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={[styles.dropdownText, { color: colors.text }]}>
              {selectedMonth ? selectedMonth.label : t('home.selectMonth', 'Select Month')}
            </Text>
            <MaterialCommunityIcons name={showDropdown ? "chevron-up" : "chevron-down"} size={20} color={colors.text} />
          </TouchableOpacity>

          {showDropdown && (
            <View style={[styles.dropdownList, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: colors.border }]}>
              <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                {availableMonths.map((item) => (
                  <TouchableOpacity 
                    key={item.label} 
                    style={styles.dropdownItem} 
                    onPress={() => {
                      setSelectedMonth(item);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Details Container */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : activeReport ? (
          // Case 1: Report Exists - Display stats directly on the page
          <View style={styles.reportContainer}>
            <View style={styles.statementMeta}>
              <Text style={[styles.statementMetaLogo, { color: colors.accent }]}>FIXAM STATEMENT</Text>
              <Text style={[styles.statementMetaDesc, { color: colors.textSecondary }]}>
                {t('home.statementPeriod', 'Official performance breakdown for the month of {{period}}').replace('{{period}}', selectedMonth?.label)}
              </Text>
            </View>

            {/* Earnings Card */}
            <View style={[styles.modalEarningsCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F0FDFA', borderColor: isDarkMode ? '#334155' : '#CCFBF1' }]}>
              <Text style={[styles.modalEarningsLabel, { color: colors.accent }]}>{t('profile.earnings', 'Total Earnings')}</Text>
              <Text style={[styles.modalEarningsValue, { color: isDarkMode ? '#FFF' : '#0F766E' }]}>
                {activeReport.earnings.toLocaleString()} {getCurrencyForUser(user)}
              </Text>
            </View>

            {/* Stats Grid */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('home.performanceStats', 'Performance Stats')}</Text>
            
            <View style={styles.modalStatsGrid}>
              <View style={[styles.modalStatCell, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
                <MaterialCommunityIcons name="eye-outline" size={24} color="#3B82F6" style={{ marginBottom: 6 }} />
                <Text style={[styles.modalStatValue, { color: colors.text }]}>{activeReport.views}</Text>
                <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>{t('profile.profileViews', 'Profile Views')}</Text>
              </View>

              <View style={[styles.modalStatCell, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
                <MaterialCommunityIcons name="magnify" size={24} color="#8B5CF6" style={{ marginBottom: 6 }} />
                <Text style={[styles.modalStatValue, { color: colors.text }]}>{activeReport.searches}</Text>
                <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>{t('profile.searchAppearances', 'Searches')}</Text>
              </View>

              <View style={[styles.modalStatCell, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
                <MaterialCommunityIcons name="briefcase-outline" size={24} color="#F59E0B" style={{ marginBottom: 6 }} />
                <Text style={[styles.modalStatValue, { color: colors.text }]}>{activeReport.jobsCompleted}</Text>
                <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>{t('profile.completedJobs', 'Completed Jobs')}</Text>
              </View>

              <View style={[styles.modalStatCell, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
                <MaterialCommunityIcons name="star-outline" size={24} color="#10B981" style={{ marginBottom: 6 }} />
                <Text style={[styles.modalStatValue, { color: colors.text }]}>{Number(activeReport.rating).toFixed(1)} / 5</Text>
                <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>{t('profile.rating', 'Avg Rating')}</Text>
              </View>

              <View style={[styles.modalStatCell, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
                <MaterialCommunityIcons name="check-circle-outline" size={24} color="#EF4444" style={{ marginBottom: 6 }} />
                <Text style={[styles.modalStatValue, { color: colors.text }]}>{Number(activeReport.successRate).toFixed(0)}%</Text>
                <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>{t('profile.successRate', 'Success Rate')}</Text>
              </View>

              <View style={[styles.modalStatCell, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
                <MaterialCommunityIcons name="database-outline" size={24} color="#EC4899" style={{ marginBottom: 6 }} />
                <Text style={[styles.modalStatValue, { color: colors.text }]}>{activeReport.coinsPurchased}</Text>
                <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>{t('profile.coinsPurchased', 'Coins Purchased')}</Text>
              </View>
            </View>
          </View>
        ) : ongoingCheck.isOngoing ? (
          // Case 2: Selected month is still active/ongoing
          <View style={[styles.noDataBox, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="information-outline" size={48} color="#3B82F6" style={{ marginBottom: 12 }} />
            <Text style={[styles.noDataText, { color: colors.text }]}>
              {t('home.monthOngoing', 'This month is still ongoing. Performance reports can only be compiled at the end of the month.')}
            </Text>
          </View>
        ) : (
          // Case 3: Finished month but has not been compiled yet - show view trigger
          <View style={[styles.noDataBox, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={[styles.noDataText, { color: colors.text, marginBottom: 20 }]}>
              {t('home.noReportCompiled', 'No report has been compiled yet for this month.')}
            </Text>
            
            <TouchableOpacity 
              style={[styles.viewStatementBtn, { backgroundColor: colors.accent }]}
              onPress={handleViewCompileReport}
              disabled={generating}
            >
              {generating ? <ActivityIndicator size="small" color="#FFF" /> : (
                <>
                  <Text style={styles.viewStatementBtnText}>{t('home.viewStatement', 'View Statement')}</Text>
                  <MaterialCommunityIcons name="eye" size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 5 },
  subtitle: { fontSize: 13, marginBottom: 20, lineHeight: 18 },
  selectorContainer: {
    marginBottom: 24,
    position: 'relative',
    zIndex: 99,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '700',
  },
  dropdownList: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 999,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingWrap: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportContainer: {
    marginTop: 8,
  },
  statementMeta: {
    marginBottom: 20,
  },
  statementMetaLogo: {
    fontSize: 12,
    fontWeight: '850',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statementMetaDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalEarningsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  modalEarningsLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  modalEarningsValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  modalStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  modalStatCell: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  modalStatLabel: {
    fontSize: 11,
    fontWeight: '750',
  },
  noDataBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  noDataText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  viewStatementBtn: {
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewStatementBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ReportsScreen;
