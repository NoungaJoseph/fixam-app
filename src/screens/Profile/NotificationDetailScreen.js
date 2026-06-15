import React from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { ActivityIndicator, Alert, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ICON_CONFIG = {
  NEW_MESSAGE: { icon: 'message-text-outline', color: '#0D9488', bg: '#F0FDFA' },
  NEW_APPLICATION: { icon: 'send-outline', color: '#F59E0B', bg: '#FFFBEB' },
  APPLICATION_ACCEPTED: { icon: 'briefcase-check-outline', color: '#2563EB', bg: '#EFF6FF' },
  JOB_COMPLETED: { icon: 'check-circle-outline', color: '#22C55E', bg: '#ECFDF5' },
  BOOKING_SENT: { icon: 'calendar-check-outline', color: '#8B5CF6', bg: '#F5F3FF' },
  COINS_ADDED: { icon: 'wallet-plus-outline', color: '#0D9488', bg: '#F0FDFA' },
  PROVIDER_OF_MONTH: { icon: 'trophy-outline', color: '#F59E0B', bg: '#FFFBEB' },
  TRANSACTION: { icon: 'wallet', color: '#0D9488', bg: '#F0FDFA' },
  VERIFICATION: { icon: 'shield-check', color: '#2563EB', bg: '#EFF6FF' },
  JOB: { icon: 'briefcase', color: '#8B5CF6', bg: '#F5F3FF' },
  JOB_APPLICATION: { icon: 'send', color: '#F59E0B', bg: '#FFFBEB' },
  DEFAULT: { icon: 'bell-outline', color: '#64748B', bg: '#F1F5F9' },
};

const getNotificationType = (notification) => (
  notification?.data?.type || notification?.type || 'DEFAULT'
);

const NotificationDetailScreen = ({ route, navigation }) => {
  const { notification } = route.params || {};
  const { colors, isDarkMode } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const [loadingAction, setLoadingAction] = React.useState(false);
  const type = getNotificationType(notification);
  const cfg = ICON_CONFIG[type] || ICON_CONFIG.DEFAULT;

  const timeLabel = notification?.createdAt
    ? new Date(notification.createdAt).toLocaleString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US')
    : '';

  const goToJob = async (jobId, providerRoute = 'TaskDetails') => {
    if (!jobId) return;
    setLoadingAction(true);
    try {
      const res = await api.get(`/jobs/${jobId}`);
      const job = res.data.data;
      if (user?.role === 'PROVIDER') {
        navigation.navigate(providerRoute, { task: job, taskId: job.id });
      } else {
        navigation.navigate('JobStatus', { job });
      }
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('common.tryAgain'));
    } finally {
      setLoadingAction(false);
    }
  };

  const actionConfig = (() => {
    const data = notification?.data || {};
    const notifType = data.type || type;

    switch (notifType) {
      case 'NEW_MESSAGE':
        return data.conversationId ? {
          label: 'Open Chat',
          onPress: () => {
            navigation.navigate('Messages');
            setTimeout(() => {
              navigation.navigate('Chat', { conversationId: data.conversationId });
            }, 100);
          }
        } : null;

      case 'NEW_BOOKING':
      case 'BOOKING_CONFIRMED':
      case 'BOOKING_SENT':
        return {
          label: 'View Booking',
          onPress: () => {
            navigation.navigate('Bookings', { bookingId: data.bookingId });
          }
        };

      case 'NEW_APPLICATION':
        return {
          label: 'View Applicants',
          onPress: () => {
            if (data.jobId) {
              navigation.navigate('Tasks');
              setTimeout(() => {
                navigation.navigate('JobStatus', { jobId: data.jobId });
              }, 100);
            }
          }
        };

      case 'APPLICATION_ACCEPTED':
      case 'JOB_APPROVED':
      case 'JOB_REJECTED':
        return {
          label: 'View Task',
          onPress: () => {
            if (data.jobId) {
              navigation.navigate('Tasks');
              setTimeout(() => {
                navigation.navigate('JobStatus', { jobId: data.jobId });
              }, 100);
            }
          }
        };

      case 'JOB_COMPLETED':
        return {
          label: 'Leave Review',
          onPress: () => {
            if (data.jobId) {
              navigation.navigate('Rating', { jobId: data.jobId });
            }
          }
        };

      case 'COINS_ADDED':
      case 'TRANSACTION':
        return {
          label: 'View Wallet',
          onPress: () => navigation.navigate('Wallet')
        };

      case 'NEW_REVIEW':
        return {
          label: 'View Review',
          onPress: () => navigation.navigate('Profile')
        };

      case 'PROVIDER_OF_MONTH':
        return {
          label: 'View Profile',
          onPress: () => {
            if (data.providerId) {
              navigation.navigate('ProviderProfile', { providerId: data.providerId });
            }
          }
        };

      default:
        return null;
    }
  })();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <View style={[styles.iconLarge, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : cfg.bg }]}>
            <MaterialCommunityIcons name={cfg.icon} size={34} color={cfg.color} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{notification?.title || t('notifications.title')}</Text>
          {timeLabel ? <Text style={[styles.time, { color: colors.placeholder }]}>{timeLabel}</Text> : null}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {notification?.body || notification?.message || ''}
        </Text>

        {actionConfig ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent, opacity: loadingAction ? 0.7 : 1 }]}
            onPress={actionConfig.onPress}
            disabled={loadingAction}
          >
            {loadingAction ? <ActivityIndicator size="small" color="#FFF" /> : null}
            <Text style={styles.actionText}>{actionConfig.label}</Text>
          </TouchableOpacity>
        ) : null}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 12,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 },
  iconLarge: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '900', textAlign: 'center' },
  time: { fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  divider: { height: 1, marginHorizontal: 20 },
  body: { fontSize: 16, lineHeight: 24, padding: 20, fontWeight: '500' },
  actionButton: {
    minHeight: 52,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
});

export default NotificationDetailScreen;
