import React, { useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { FlatList, StyleSheet, View, Text, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAppContext } from '../../context/AppContext';

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

const NotificationsScreen = ({ navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const [filter, setFilter] = useState('All');
  const { t, currentLanguage } = useLanguage();
  const { notifications, markNotificationAsRead } = useAppContext();

  const getConfig = (notif) => ICON_CONFIG[notif?.data?.type || notif?.type] || ICON_CONFIG.DEFAULT;

  const getTimeLabel = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000 / 60);
    if (diff < 1) return t('notifications.justNow');
    if (diff < 60) return t('notifications.minutesAgo', { count: diff });
    if (diff < 1440) return t('notifications.hoursAgo', { count: Math.floor(diff / 60) });
    return d.toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const handlePress = async (notif) => {
    if (!notif.isRead) await markNotificationAsRead(notif.id);
    navigation.navigate('NotificationDetail', { notification: { ...notif, isRead: true } });
  };

  const filtered = notifications.filter(n => {
    if (filter === 'Unread') return !n.isRead;
    if (filter === 'Archive') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const renderItem = ({ item: notif }) => {
    const cfg = getConfig(notif);
    const darkBg = isDarkMode ? 'rgba(255,255,255,0.06)' : cfg.bg;

    return (
      <TouchableOpacity
        style={styles.notifRow}
        onPress={() => handlePress(notif)}
        activeOpacity={0.82}
      >
        <View style={styles.dotSlot}>
          {!notif.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}
        </View>
        <View style={[styles.notifIcon, { backgroundColor: darkBg }]}>
          <MaterialCommunityIcons name={cfg.icon} size={21} color={cfg.color} />
        </View>
        <View style={styles.notifBody}>
          <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>{notif.title}</Text>
          <Text style={[styles.notifDesc, { color: colors.textSecondary }]} numberOfLines={2}>{notif.body}</Text>
        </View>
        <Text style={[styles.notifTime, { color: colors.placeholder }]} numberOfLines={1}>{getTimeLabel(notif.createdAt)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('notifications.title')}</Text>
            {unreadCount > 0 && (
              <Text style={[styles.headerSub, { color: colors.accent }]}>{t('notifications.unreadCount', { count: unreadCount })}</Text>
            )}
          </View>
          <View style={[styles.countBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.countText}>{notifications.length}</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersRow}>
          {['All', 'Unread', 'Archive'].map(f => {
            const active = filter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.chip, { backgroundColor: active ? colors.accent : colors.card, borderColor: active ? colors.accent : colors.border }]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.chipText, { color: active ? '#FFF' : colors.text }]}>{t(`notifications.filters.${f.toLowerCase()}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: isDarkMode ? '#1F2937' : '#F0F0F0' }]} />
          )}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <View style={[styles.emptyCircle, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                <MaterialCommunityIcons name="bell-off-outline" size={56} color={colors.placeholder} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('notifications.emptyTitle')}</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {filter === 'Unread' ? t('notifications.emptyUnread') : t('notifications.emptySubtitle')}
              </Text>
            </View>
          )}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 12,
    paddingBottom: 14,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  headerSub: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  countBadge: { minWidth: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countText: { color: '#FFF', fontSize: 12, fontWeight: '900' },

  filtersRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 22, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '700' },

  list: { paddingTop: 4, paddingBottom: 100 },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dotSlot: { width: 8, height: 40, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  notifTime: { width: 58, fontSize: 12, fontWeight: '500', textAlign: 'right', marginTop: 2 },
  notifDesc: { fontSize: 13, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  separator: { height: 1, marginHorizontal: 16 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyCircle: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
});

export default NotificationsScreen;
