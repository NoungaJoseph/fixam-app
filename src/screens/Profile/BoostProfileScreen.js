import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const BoostProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isDarkMode, colors } = useTheme();
  const { user, fetchUserData } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    profileViews: 0,
    searchAppearances: 0,
    jobsCompleted: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard');
      if (response.data?.success && response.data?.data?.myProviderProfile) {
        const profile = response.data.data.myProviderProfile;
        setStats({
          profileViews: profile.profileViews || 0,
          searchAppearances: profile.searchAppearances || 0,
          jobsCompleted: profile.jobsCompleted || 0, // This is just an example, it may come from the dashboard stats
        });
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.performanceStats', 'Performance Stats')}</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
              <MaterialCommunityIcons name="eye-outline" size={32} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.profileViews}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.profileViews', 'Profile Views')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
              <MaterialCommunityIcons name="magnify" size={32} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.searchAppearances}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.searchAppearances', 'Search Appearances')}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.boostCard, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.accent }]}>
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
  performanceSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  statValue: { fontSize: 24, fontWeight: '800', marginTop: 12, marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center' },
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
