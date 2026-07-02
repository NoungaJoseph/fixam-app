import React from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  StatusBar, Dimensions
} from 'react-native';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { CustomHeader } from '../../navigation/NavigationComponents';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { getCurrencyForUser } from '../../constants/countries';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const StatsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
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
      console.log('Failed to fetch my jobs in stats', e);
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

  const completedJobs = myJobs.filter(j => j.status === 'COMPLETED').length;
  const totalEarnings = myJobs.filter(j => j.status === 'COMPLETED').reduce((sum, j) => sum + Number(j.budget || j.budgetMax || 0), 0);
  const avgRating = Number(user?.providerProfile?.rating || 0).toFixed(1);
  const successRate = myJobs.length > 0 ? Math.round((completedJobs / myJobs.length) * 100) : 0;

  const stats = [
    { label: t('home.completedJobs'), value: String(completedJobs), icon: 'check-circle-outline', color: '#10B981' },
    { label: t('home.totalEarnings'), value: `${totalEarnings.toLocaleString()} ${getCurrencyForUser(user)}`, icon: 'cash-multiple', color: '#2563EB' },
    { label: t('home.avgRating'), value: String(avgRating), icon: 'star-outline', color: '#FBBF24' },
    { label: t('home.successRate'), value: `${successRate}%`, icon: 'trending-up', color: '#8B5CF6' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      
      <CustomHeader navigation={navigation} title={t('drawer.myStats')} colors={colors} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{t('home.performanceOverview')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('home.performanceSubtitle')}</Text>

        <View style={styles.statsGrid}>
          {stats.map((item, index) => (
            <View key={index} style={[styles.statCard, { borderBottomColor: colors.border }]}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{item.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.chartPlaceholder, { borderBottomColor: colors.border }]}>
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>{t('home.earningsChart')}</Text>
          <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={100} color={colors.border} />
        </View>

        <View style={[styles.infoBox, { borderBottomColor: colors.border }]}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.accent} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {t('home.statsTip')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 5 },
  subtitle: { fontSize: 14, marginBottom: 25 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 },
  statCard: { 
    width: (width - 55) / 2, 
    padding: 20, 
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  iconBox: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  chartPlaceholder: { marginTop: 25, borderBottomWidth: 1, padding: 30, alignItems: 'center', justifyContent: 'center', height: 220 },
  placeholderText: { fontSize: 14, fontWeight: '700', marginBottom: 20 },
  infoBox: { marginTop: 25, paddingVertical: 18, borderBottomWidth: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
});

export default StatsScreen;
