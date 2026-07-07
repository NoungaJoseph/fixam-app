import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, Share
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

  const handleShareReport = async () => {
    if (!activeReport || !selectedMonth) return;
    
    const reportData = {
      statementPeriod: selectedMonth.label,
      provider: {
        name: user?.fullName || '',
        email: user?.email || '',
      },
      earnings: `${activeReport.earnings.toLocaleString()} ${getCurrencyForUser(user)}`,
      stats: {
        profileViews: activeReport.views,
        searches: activeReport.searches,
        completedJobs: activeReport.jobsCompleted,
        avgRating: `${Number(activeReport.rating).toFixed(1)} / 5`,
        successRate: `${Number(activeReport.successRate).toFixed(0)}%`,
        coinsPurchased: activeReport.coinsPurchased,
      }
    };

    // Check if native ExpoPrint module is available in global JS registries (without calling native bridge loaders)
    const isPrintAvailable = !!(
      (global.ExpoModules && (global.ExpoModules.ExpoPrint || global.ExpoModules['ExpoPrint'])) ||
      (global.expo && global.expo.modules && global.expo.modules.ExpoPrint)
    );

    if (!isPrintAvailable) {
      // Immediately fall back to JSON text sharing if PDF native module is missing
      await Share.share({
        message: `Fixam Performance & Earnings Statement - ${selectedMonth.label}\n\n${JSON.stringify(reportData, null, 2)}`,
        title: `Fixam Statement - ${selectedMonth.label}`
      });
      return;
    }

    try {
      const htmlContent = `
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #1E293B;
              padding: 40px 30px;
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #0D9488;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo {
              font-size: 24px;
              font-weight: 800;
              color: #0D9488;
              letter-spacing: 1px;
            }
            .title {
              font-size: 18px;
              font-weight: 700;
              color: #1E293B;
              text-transform: uppercase;
              margin: 0;
            }
            .details {
              margin-bottom: 30px;
              font-size: 14px;
              color: #475569;
            }
            .details td {
              padding: 4px 10px 4px 0;
            }
            .earnings-box {
              background-color: #F0FDFA;
              border: 1px solid #CCFBF1;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 35px;
              text-align: center;
            }
            .earnings-label {
              font-size: 13px;
              font-weight: 600;
              color: #0D9488;
              text-transform: uppercase;
              margin-bottom: 6px;
              letter-spacing: 0.5px;
            }
            .earnings-value {
              font-size: 34px;
              font-weight: 900;
              color: #0F766E;
            }
            .section-title {
              font-size: 15px;
              font-weight: 750;
              color: #0D9488;
              border-bottom: 1px solid #E2E8F0;
              padding-bottom: 8px;
              margin-top: 30px;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .stats-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .stats-table th, .stats-table td {
              padding: 12px 15px;
              text-align: left;
              border-bottom: 1px solid #E2E8F0;
              font-size: 14px;
            }
            .stats-table th {
              background-color: #F8FAFC;
              color: #475569;
              font-weight: 600;
              width: 40%;
            }
            .stats-table td {
              color: #0F172A;
              font-weight: 700;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #E2E8F0;
              padding-top: 20px;
              font-size: 11px;
              color: #94A3B8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">FIXAM</div>
            <div class="title">Earnings & Stats Report</div>
          </div>
          
          <table class="details">
            <tr><td><strong>Provider Name:</strong></td><td>${reportData.provider.name}</td></tr>
            <tr><td><strong>Email Address:</strong></td><td>${reportData.provider.email}</td></tr>
            <tr><td><strong>Statement Period:</strong></td><td>${reportData.statementPeriod}</td></tr>
            <tr><td><strong>Date Generated:</strong></td><td>${new Date().toLocaleDateString()}</td></tr>
          </table>

          <div class="earnings-box">
            <div class="earnings-label">Total Net Earnings</div>
            <div class="earnings-value">${reportData.earnings}</div>
          </div>

          <div class="section-title">Monthly Performance Analytics</div>
          <table class="stats-table">
            <tr><th>Profile Views</th><td>${reportData.stats.profileViews}</td></tr>
            <tr><th>Search Appearances</th><td>${reportData.stats.searches}</td></tr>
            <tr><th>Completed Jobs</th><td>${reportData.stats.completedJobs}</td></tr>
            <tr><th>Average Rating</th><td>${reportData.stats.avgRating}</td></tr>
            <tr><th>Success Rate</th><td>${reportData.stats.successRate}</td></tr>
            <tr><th>Coins Purchased</th><td>${reportData.stats.coinsPurchased}</td></tr>
          </table>

          <div class="footer">
            Fixam Technologies © ${new Date().getFullYear()}. All rights reserved.<br/>
            This document is compiled automatically and serves as a valid statement of provider earnings for tax purposes.
          </div>
        </body>
        </html>
      `;

      // Dynamically load the modules only when they are verified to exist
      const Print = require('expo-print');
      const Sharing = require('expo-sharing');

      try {
        // Generate the PDF file
        const { uri } = await Print.printToFileAsync({ html: htmlContent });

        // Open sharing dialog with the generated PDF file
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Fixam Statement - ${selectedMonth.label}`,
          UTI: 'com.adobe.pdf'
        });
      } catch (pdfErr) {
        console.log('PDF statement generation failed, falling back to JSON text:', pdfErr);
        
        // Fallback to text JSON sharing
        await Share.share({
          message: `Fixam Performance & Earnings Statement - ${selectedMonth.label}\n\n${JSON.stringify(reportData, null, 2)}`,
          title: `Fixam Statement - ${selectedMonth.label}`
        });
      }
    } catch (err) {
      console.log('Outer error report:', err);
      Alert.alert(t('common.error', 'Error'), 'Failed to export statement.');
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

            <TouchableOpacity 
              style={[styles.exportBtn, { backgroundColor: colors.accent }]}
              onPress={handleShareReport}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="share-variant" size={20} color="#FFF" />
              <Text style={styles.exportBtnText}>{t('profile.exportReport', 'Export Statement')}</Text>
            </TouchableOpacity>
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
  exportBtn: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  exportBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '805',
  },
});

export default ReportsScreen;
