import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const BoostProfileScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { isDarkMode, colors } = useTheme();
  const { user, fetchUserData } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [monthlyStatsHistory, setMonthlyStatsHistory] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesFr = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const isFr = i18n.language?.startsWith('fr');
  const monthNames = isFr ? monthNamesFr : monthNamesEn;
  const currentDate = new Date();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const names = isFr ? monthNamesFr : monthNamesEn;
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${names[d.getMonth()]} ${d.getFullYear()}`
    };
  });

  // Generate last 12 months for dropdown selection
  const availableMonths = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const mYear = d.getFullYear();
    const mMonth = d.getMonth() + 1;
    availableMonths.push({
      year: mYear,
      month: mMonth,
      label: `${monthNames[d.getMonth()]} ${mYear}`
    });
  }

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard');
      if (response.data?.success && response.data?.data?.myProviderProfile) {
        const profile = response.data.data.myProviderProfile;
        const history = profile.monthlyStats || [];
        setMonthlyStatsHistory(history);
      }
    } catch (error) {
      console.error('Failed to load stats', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBoostSelect = (duration, coins) => {
    Alert.alert(
      t('profile.boostConfirmTitle', 'Boost Profile?'),
      t('profile.boostConfirmDesc', '{{coins}} coins will be deducted from your wallet balance.').replace('{{coins}}', coins.toString()),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { 
          text: t('common.confirm', 'Confirm'), 
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await api.post('/providers/boost', { duration });
              if (res.data?.success) {
                Alert.alert(t('profile.success', 'Success'), t('profile.boostSuccess', 'Profile boosted successfully!'));
                fetchUserData?.();
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert(t('common.error', 'Error'), error.response?.data?.message || t('profile.boostError', 'Failed to boost profile.'));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const isBoostActive = user?.providerProfile?.boostExpiresAt && new Date(user.providerProfile.boostExpiresAt) > new Date();

  // Find stat for selected month
  const activeStat = monthlyStatsHistory.find(
    s => s.year === selectedMonth.year && s.month === selectedMonth.month
  ) || { profileViews: 0, searchAppearances: 0 };

  // Generate last 6 months in chronological order for the history table and charts based on selectedMonth
  const getHistoricalStats = () => {
    const list = [];
    const names = isFr ? monthNamesFr : monthNamesEn;
    
    // Create target Date relative to selected month
    const targetDate = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(targetDate.getFullYear(), targetDate.getMonth() - i, 1);
      const mYear = d.getFullYear();
      const mMonth = d.getMonth() + 1;
      
      const stat = monthlyStatsHistory.find(s => s.year === mYear && s.month === mMonth) || {
        profileViews: 0,
        searchAppearances: 0
      };
      
      list.push({
        year: mYear,
        month: mMonth,
        label: names[d.getMonth()].substring(0, 3) + ' ' + String(mYear).substring(2),
        fullLabel: `${names[d.getMonth()]} ${mYear}`,
        views: stat.profileViews,
        searches: stat.searchAppearances
      });
    }
    return list;
  };

  const historicalStats = getHistoricalStats();
  const maxSearches = Math.max(...historicalStats.map(h => h.searches), 1);
  const maxViews = Math.max(...historicalStats.map(h => h.views), 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.boostDashboard', 'Boost Dashboard')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.performanceSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
              {t('profile.performanceStats', 'Performance Stats')}
            </Text>
            
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                style={[styles.dropdownButton, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]} 
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Text style={[styles.dropdownButtonText, { color: colors.text }]}>{selectedMonth.label}</Text>
                <MaterialCommunityIcons name={showDropdown ? "chevron-up" : "chevron-down"} size={18} color={colors.text} />
              </TouchableOpacity>
              
              {showDropdown && (
                <View style={[styles.dropdownList, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: colors.border }]}>
                  <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }}>
                    {availableMonths.map((m) => (
                      <TouchableOpacity 
                        key={m.label} 
                        style={[
                          styles.dropdownItem, 
                          { 
                            backgroundColor: selectedMonth.year === m.year && selectedMonth.month === m.month
                              ? (isDarkMode ? '#334155' : '#E2E8F0')
                              : 'transparent'
                          }
                        ]} 
                        onPress={() => {
                          setSelectedMonth(m);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: colors.text }]}>{m.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
              <MaterialCommunityIcons name="eye-outline" size={32} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.text }]}>{activeStat.profileViews}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.profileViews', 'Profile Views')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
              <MaterialCommunityIcons name="magnify" size={32} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.text }]}>{activeStat.searchAppearances}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.searchAppearances', 'Search Appearances')}</Text>
            </View>
          </View>
        </View>

        {/* History Table */}
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.monthlyHistory', 'Monthly Stats History')}</Text>
          <View style={[styles.tableContainer, { borderColor: colors.border }]}>
            <View style={[styles.tableHeader, { backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
              <Text style={[styles.tableHeaderCell, { color: colors.text, flex: 2 }]}>{t('profile.month', 'Month')}</Text>
              <Text style={[styles.tableHeaderCell, { color: colors.text, flex: 1.5, textAlign: 'center' }]}>{t('profile.views', 'Views')}</Text>
              <Text style={[styles.tableHeaderCell, { color: colors.text, flex: 1.5, textAlign: 'center' }]}>{t('profile.searches', 'Searches')}</Text>
            </View>
            {historicalStats.map((item, index) => (
              <View key={item.label} style={[
                styles.tableRow,
                { 
                  borderBottomColor: colors.border,
                  backgroundColor: index % 2 === 0 
                    ? (isDarkMode ? '#0F172A' : '#FFFFFF') 
                    : (isDarkMode ? '#1E293B30' : '#F8FAFC')
                }
              ]}>
                <Text style={[styles.tableCell, { color: colors.text, flex: 2, fontWeight: '600' }]}>{item.fullLabel}</Text>
                <Text style={[styles.tableCell, { color: colors.text, flex: 1.5, textAlign: 'center' }]}>{item.views}</Text>
                <Text style={[styles.tableCell, { color: colors.text, flex: 1.5, textAlign: 'center' }]}>{item.searches}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Search Appearances Chart (Rounded Vertical Bar Chart) */}
        <View style={styles.chartSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.searchAppearancesChart', 'Search Appearances Trend')}</Text>
          <View style={[styles.chartContainer, { backgroundColor: isDarkMode ? '#1E293B50' : '#F8FAFC', borderColor: colors.border }]}>
            <View style={styles.chartYGrid}>
              <View style={[styles.gridLine, { borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0' }]} />
              <View style={[styles.gridLine, { borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0' }]} />
              <View style={[styles.gridLine, { borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0' }]} />
            </View>
            <View style={styles.chartBarsRow}>
              {historicalStats.map((item) => {
                const barHeight = (item.searches / maxSearches) * 110;
                return (
                  <View key={item.label} style={styles.chartColumn}>
                    <View style={styles.barWrapper}>
                      <Text style={[styles.chartValueText, { color: colors.text }]}>{item.searches}</Text>
                      <View style={[
                        styles.chartBar, 
                        { 
                          height: Math.max(barHeight, 4),
                          backgroundColor: colors.accent,
                          borderTopLeftRadius: 6,
                          borderTopRightRadius: 6
                        }
                      ]} />
                    </View>
                    <Text style={[styles.chartLabelText, { color: colors.textSecondary }]}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Profile Views Chart (Lollipop/Stem-Dot Chart) */}
        <View style={styles.chartSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.profileViewsChart', 'Profile Views Trend')}</Text>
          <View style={[styles.chartContainer, { backgroundColor: isDarkMode ? '#1E293B50' : '#F8FAFC', borderColor: colors.border }]}>
            <View style={styles.chartYGrid}>
              <View style={[styles.gridLine, { borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0' }]} />
              <View style={[styles.gridLine, { borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0' }]} />
              <View style={[styles.gridLine, { borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0' }]} />
            </View>
            <View style={styles.chartBarsRow}>
              {historicalStats.map((item) => {
                const stemHeight = (item.views / maxViews) * 100;
                return (
                  <View key={item.label} style={styles.chartColumn}>
                    <View style={styles.barWrapper}>
                      <Text style={[styles.chartValueText, { color: colors.text }]}>{item.views}</Text>
                      <View style={styles.lollipopContainer}>
                        {item.views > 0 && (
                          <View style={[styles.lollipopStem, { height: stemHeight, backgroundColor: isDarkMode ? '#64748B' : '#94A3B8' }]} />
                        )}
                        <View style={[
                          styles.lollipopHead, 
                          { 
                            backgroundColor: '#8B5CF6',
                            shadowColor: '#8B5CF6',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.5,
                            shadowRadius: 4,
                            elevation: 4
                          }
                        ]} />
                      </View>
                    </View>
                    <Text style={[styles.chartLabelText, { color: colors.textSecondary }]}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={[styles.boostCard, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.accent, marginTop: 20 }]}>
          <View style={styles.boostHeader}>
            <MaterialCommunityIcons name="rocket-launch" size={28} color={colors.accent} style={{ marginRight: 10 }} />
            <Text style={[styles.boostTitle, { color: colors.text }]}>
              {t('profile.boostTitle', 'Boost Profile')}
            </Text>
          </View>
          <Text style={[styles.boostSubtitle, { color: colors.textSecondary }]}>
            {t('profile.boostSubtitle', 'Get up to 5x more jobs by boosting your profile!')}
          </Text>
          
          {isBoostActive ? (
            <View style={[styles.activeStateContainer, { backgroundColor: isDarkMode ? '#064E3B40' : '#ECFDF5', marginTop: 16, padding: 20, borderRadius: 12, alignItems: 'center' }]}>
              <MaterialCommunityIcons name="check-decagram" size={48} color="#10B981" />
              <Text style={[styles.activeStateTitle, { color: isDarkMode ? '#FFF' : '#0F172A', fontSize: 18, fontWeight: 'bold', marginTop: 8 }]}>{t('profile.boostActive', 'Boost Active!')}</Text>
              <Text style={[styles.activeStateSub, { color: isDarkMode ? '#CBD5E1' : '#475569', marginTop: 4 }]}>
                {t('profile.boostExpiresAt', 'Expires on')} {new Date(user.providerProfile.boostExpiresAt).toLocaleDateString()}
              </Text>
            </View>
          ) : (
            <View style={styles.boostActionColumn}>
              <TouchableOpacity 
                style={[styles.boostBtn, { backgroundColor: colors.accent, opacity: loading ? 0.65 : 1 }]} 
                onPress={() => handleBoostSelect('1_WEEK', 3)}
                disabled={loading}
              >
                {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                  <Text style={styles.boostBtnText}>{t('profile.boost1Week', 'Boost 1 Week (3 Coins)')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.boostBtn, { backgroundColor: colors.accent, opacity: loading ? 0.65 : 1, marginTop: 12 }]} 
                onPress={() => handleBoostSelect('1_MONTH', 10)}
                disabled={loading}
              >
                {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                  <Text style={styles.boostBtnText}>{t('profile.boost1Month', 'Boost 1 Month (10 Coins)')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginTop: Platform.OS === 'android' ? 24 : 0,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 20 },
  performanceSection: { marginBottom: 24, zIndex: 999 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1000,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1001,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownButtonText: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  dropdownList: {
    position: 'absolute',
    top: 36,
    right: 0,
    width: 160,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 1002,
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  statValue: { fontSize: 24, fontWeight: '800', marginTop: 12, marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center' },
  historySection: { marginBottom: 24 },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderCell: {
    fontWeight: '800',
    fontSize: 13,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 13,
  },
  chartSection: { marginBottom: 24 },
  chartContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    height: 180,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  chartYGrid: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 40,
    justifyContent: 'space-between',
  },
  gridLine: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    width: '100%',
    height: 1,
  },
  chartBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    zIndex: 2,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 130,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  chartBar: {
    width: 20,
  },
  chartValueText: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  chartLabelText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  lollipopContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  lollipopStem: {
    width: 2,
  },
  lollipopHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  boostCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
  },
  boostHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  boostTitle: { fontSize: 20, fontWeight: '800' },
  boostSubtitle: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  boostActiveContainer: { marginTop: 10 },
  boostActiveBadge: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  boostActiveText: { fontWeight: '700', fontSize: 14 },
  boostActionColumn: { marginTop: 10 },
  boostBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  boostBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});

export default BoostProfileScreen;
