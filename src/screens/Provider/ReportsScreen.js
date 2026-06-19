import React from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  StatusBar
} from 'react-native';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { CustomHeader } from '../../navigation/NavigationComponents';
import { useLanguage } from '../../context/LanguageContext';

import { Alert } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';

const ReportsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { myTasksList, myBookingsList } = useAppContext();
  
  const [myJobs, setMyJobs] = React.useState([...(myTasksList || []), ...(myBookingsList || [])]);

  const fetchMyJobs = React.useCallback(async () => {
    try {
      const [jobsRes, bookingsRes] = await Promise.allSettled([
        api.get('/jobs/my-jobs'),
        api.get('/bookings/mine?role=PROVIDER')
      ]);
      const jobs = jobsRes.status === 'fulfilled' ? (jobsRes.value.data.data || []) : [];
      const bookings = bookingsRes.status === 'fulfilled' ? (bookingsRes.value.data.data || []) : [];
      setMyJobs([...jobs, ...bookings]);
    } catch (e) {
      console.log('Failed to fetch my jobs for reports', e);
    }
  }, []);

  React.useEffect(() => {
    if (myTasksList?.length || myBookingsList?.length) {
      setMyJobs([...(myTasksList || []), ...(myBookingsList || [])]);
    }
    const unsub = navigation.addListener('focus', fetchMyJobs);
    fetchMyJobs();
    return unsub;
  }, [fetchMyJobs, navigation, myTasksList, myBookingsList]);

  const reports = React.useMemo(() => {
    const completed = myJobs.filter(j => j.status === 'COMPLETED');
    const grouped = {};
    completed.forEach(j => {
      const d = new Date(j.completedAt || j.updatedAt || j.createdAt);
      if (isNaN(d)) return;
      const month = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      if (!grouped[month]) grouped[month] = { id: month, month, jobs: 0, totalAmount: 0, status: 'Ready' };
      grouped[month].jobs += 1;
      grouped[month].totalAmount += Number(j.budget || j.budgetMax || 0);
    });
    return Object.values(grouped)
      .sort((a, b) => new Date(b.month) - new Date(a.month)) // sort newest first
      .map(item => ({ ...item, total: `${item.totalAmount.toLocaleString()} FCFA` }));
  }, [myJobs]);

  const handleDownload = (month) => {
    Alert.alert(
      t('home.reportDownloaded', { defaultValue: 'Report Saved' }),
      t('home.reportSaved', { defaultValue: `The report for ${month || 'this period'} has been saved to your device.` })
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      
      <CustomHeader navigation={navigation} title={t('home.reports')} colors={colors} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{t('home.earningsReports')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('home.reportsSubtitle')}</Text>

        <View style={styles.reportsList}>
          {reports.length === 0 ? (
            <View style={{ padding: 60, alignItems: 'center' }}>
              <MaterialCommunityIcons name="file-document-outline" size={80} color={colors.border} />
              <Text style={{ color: colors.textSecondary, marginTop: 20, fontSize: 16, fontWeight: '700' }}>{t('home.noReports')}</Text>
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 10 }}>{t('home.reportsGenerated')}</Text>
            </View>
          ) : (
            reports.map((item) => (
              <View key={item.id} style={[styles.reportCard, { borderBottomColor: colors.border }]}>
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons name="file-pdf-box" size={28} color={colors.accent} />
                </View>
                <View style={styles.reportInfo}>
                  <Text style={[styles.monthText, { color: colors.text }]}>{item.month}</Text>
                  <Text style={[styles.statsText, { color: colors.textSecondary }]}>{item.jobs} Jobs • {item.total}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDownload(item.month)}
                  style={{ padding: 8 }}
                >
                  <MaterialCommunityIcons 
                    name={item.status === 'Ready' ? 'download' : 'check-circle'} 
                    size={24} 
                    color={item.status === 'Ready' ? colors.accent : '#10B981'} 
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={[styles.generateBtn, { backgroundColor: colors.accent || '#0D9488' }]} onPress={() => handleDownload('')}>
          <Text style={styles.generateBtnText}>{t('home.generateReport')}</Text>
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 5 },
  subtitle: { fontSize: 14, marginBottom: 25 },
  reportsList: { gap: 12 },
  reportCard: { 
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1,
  },
  iconWrap: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start', marginRight: 15 },
  reportInfo: { flex: 1 },
  monthText: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  statsText: { fontSize: 12, fontWeight: '600' },
  generateBtn: { 
    marginTop: 30, height: 56, borderRadius: 8, flexDirection: 'row', 
    alignItems: 'center', justifyContent: 'center', gap: 10 
  },
  generateBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

export default ReportsScreen;
