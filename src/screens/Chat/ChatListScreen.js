import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, StatusBar, TextInput, Platform, ActivityIndicator, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api, { getMediaUrl } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAppContext } from '../../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import UserAvatar from '../../components/UserAvatar';

const chatCacheKey = (userId) => `fixam:chat-conversations:${userId || 'guest'}`;

const FILTER_CHIPS = [
  { key: 'all',      label: 'All',      icon: 'message-text' },
  { key: 'unread',   label: 'Unread',   icon: 'message-badge-outline' },
  { key: 'jobs',     label: 'Jobs',     icon: 'briefcase-outline' },
  { key: 'bookings', label: 'Bookings', icon: 'calendar-outline' },
  { key: 'system',   label: 'System',   icon: 'cog-outline' },
  { key: 'archive',  label: 'Archive',  icon: 'archive-outline' },
];

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getLastMessagePreview = (message) => {
  if (!message) return 'No messages yet';
  const type = String(message.type || 'TEXT').toUpperCase();
  const content = message.content || '';
  if (['AUDIO', 'AUDIO_CALL', 'VIDEO_CALL'].includes(type) || String(content).toLowerCase().includes('audio not supported')) {
    return 'Call';
  }
  if (type === 'IMAGE') return 'Photo';
  if (type === 'FILE') return 'Attachment';
  return content || 'No messages yet';
};

const ChatListScreen = ({ navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { on } = useSocket();
  const { jobs } = useAppContext();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [archivedIds, setArchivedIds] = useState([]);

  // Load archived conversations list from storage
  useEffect(() => {
    const loadArchived = async () => {
      if (!user?.id) return;
      try {
        const value = await AsyncStorage.getItem(`fixam:archived-chats:${user.id}`);
        if (value) {
          setArchivedIds(JSON.parse(value));
        } else {
          setArchivedIds([]);
        }
      } catch (err) {
        console.log('Error loading archived chat ids:', err);
      }
    };
    loadArchived();
  }, [user?.id]);

  const toggleArchiveConversation = async (conversationId) => {
    if (!conversationId) return;
    const isArchived = archivedIds.includes(conversationId);
    let nextArchived;
    if (isArchived) {
      nextArchived = archivedIds.filter(id => id !== conversationId);
      Alert.alert(t('messages.unarchived'), t('messages.unarchivedBody'));
    } else {
      nextArchived = [...archivedIds, conversationId];
      Alert.alert(t('messages.archived'), t('messages.archivedBody'));
    }
    setArchivedIds(nextArchived);
    if (user?.id) {
      await AsyncStorage.setItem(`fixam:archived-chats:${user.id}`, JSON.stringify(nextArchived));
    }
  };

  const persistCache = useCallback(async (list) => {
    if (!user?.id || !Array.isArray(list)) return;
    try {
      await AsyncStorage.setItem(chatCacheKey(user.id), JSON.stringify({ savedAt: Date.now(), list }));
    } catch (_) {}
  }, [user?.id]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations', { timeout: 12000 });
      const list = res.data.data || [];
      setConversations(list);
      persistCache(list);
    } catch (_) {} finally {
      setLoading(false);
    }
  }, [persistCache]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user?.id) {
        try {
          const raw = await AsyncStorage.getItem(chatCacheKey(user.id));
          if (!cancelled && raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.list?.length) { setConversations(parsed.list); setLoading(false); }
          }
        } catch (_) {}
      }
      if (!cancelled) fetchConversations();
    })();
    return () => { cancelled = true; };
  }, [fetchConversations, user?.id]);

  useFocusEffect(useCallback(() => { fetchConversations(); }, [fetchConversations]));

  useEffect(() => {
    const off = on('message:new', () => fetchConversations());
    return () => off?.();
  }, [fetchConversations, on]);

  const helperGetJob = useCallback((c) => {
    const directJob = c.task || c.job || c.activeJob || c.activeTask || c.booking;
    if (directJob) return directJob;

    const other = c.participants?.[0] || {};
    return jobs.find((job) => {
      const providerUserId = job.provider?.user?.id || job.booking?.provider?.user?.id;
      const providerId = job.provider?.id || job.providerId || job.booking?.providerId;
      const clientId = job.client?.id || job.clientId || job.booking?.clientId;
      return [providerUserId, providerId, clientId].filter(Boolean).includes(other.id);
    });
  }, [jobs]);

  const helperIsOngoingJob = useCallback((t) => {
    if (!t) return false;
    const status = String(t.status || t.assignmentStatus || t.booking?.status || '').toUpperCase();
    const assignmentOngoing = t.assignments?.some((assignment) => (
      ['IN_PROGRESS', 'ONGOING', 'STARTED'].includes(String(assignment.status || '').toUpperCase())
    ));
    return ['IN_PROGRESS', 'ONGOING', 'ACTIVE', 'STARTED'].includes(status) || assignmentOngoing;
  }, []);

  const helperIsBooked = useCallback((t) => {
    if (!t || helperIsOngoingJob(t)) return false;
    const status = String(t.status || t.booking?.status || '').toUpperCase();
    return Boolean(
      t.isBooking ||
      t.booking ||
      t.scheduledTime ||
      t.bookingDate ||
      ['SCHEDULED', 'BOOKED', 'PENDING', 'REQUESTED'].includes(status)
    );
  }, [helperIsOngoingJob]);

  const helperIsJob = useCallback((t) => {
    if (!t || helperIsBooked(t)) return false;
    const status = String(t.status || t.assignmentStatus || '').toUpperCase();
    return helperIsOngoingJob(t) || ['ASSIGNED', 'ACCEPTED', 'APPROVED'].includes(status);
  }, [helperIsBooked, helperIsOngoingJob]);

  const helperIsSystem = useCallback((c) => {
    const other = c.participants?.[0] || {};
    const name = (other.fullName || '').toLowerCase();
    const email = (other.email || '').toLowerCase();
    return c.isSystem || other.role === 'ADMIN' || name.includes('fixam') || email.includes('fixam');
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = conversations;

    if (activeFilter === 'archive') {
      // ONLY show archived conversations
      list = list.filter(c => archivedIds.includes(c.id));
    } else {
      // HIDE archived conversations
      list = list.filter(c => !archivedIds.includes(c.id));

      if (activeFilter === 'unread') {
        list = list.filter(c => (c.unreadCount || 0) > 0);
      } else if (activeFilter === 'jobs') {
        list = list.filter(c => {
          const j = helperGetJob(c);
          return helperIsJob(j);
        });
      } else if (activeFilter === 'bookings') {
        list = list.filter(c => {
          const j = helperGetJob(c);
          return !!j && helperIsBooked(j);
        });
      } else if (activeFilter === 'system') {
        list = list.filter(c => helperIsSystem(c));
      }
    }

    if (!q) return list;
    return list.filter(c => {
      const name = (c.participants?.[0]?.fullName || '').toLowerCase();
      const last = (c.lastMessage?.content || '').toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [conversations, search, activeFilter, archivedIds, helperGetJob, helperIsBooked, helperIsJob, helperIsSystem]);

  const unreadTotal = useMemo(() => conversations.reduce((s, c) => s + (c.unreadCount || 0), 0), [conversations]);
  
  const jobChats = useMemo(() => conversations.filter(c => {
    const j = helperGetJob(c);
    return helperIsJob(j);
  }).length, [conversations, helperGetJob, helperIsJob]);

  const activeBookings = useMemo(() => conversations.filter(c => {
    const j = helperGetJob(c);
    return !!j && helperIsBooked(j);
  }).length, [conversations, helperGetJob, helperIsBooked]);

  const systemChats = useMemo(() => conversations.filter(c => helperIsSystem(c)).length, [conversations, helperIsSystem]);

  const renderItem = ({ item }) => {
    const other = item.participants?.[0] || {};
    const hasUnread = (item.unreadCount || 0) > 0;
    const avatarUri = getMediaUrl(other.avatar);
    const isSupport = other.role === 'ADMIN';
    const displayName = isSupport ? 'Fixam Support' : (other.fullName || 'Fixam User');
    const roleTag = isSupport ? 'Support' : other.role === 'PROVIDER' ? 'Provider' : 'Customer';
    const tagColor = isSupport ? '#2563EB' : other.role === 'PROVIDER' ? '#8B5CF6' : '#0D9488';
    const tagBg = isSupport
      ? (isDarkMode ? 'rgba(37,99,235,0.15)' : '#EFF6FF')
      : other.role === 'PROVIDER'
        ? (isDarkMode ? 'rgba(139,92,246,0.15)' : '#F5F3FF')
        : (isDarkMode ? 'rgba(13,148,136,0.15)' : '#F0FDFA');

    return (
      <TouchableOpacity
        style={[styles.chatRow, { borderBottomColor: colors.divider }]}
        onPress={() => navigation.navigate('Chat', {
          conversationId: item.id,
          userName: displayName,
          receiverId: other.id,
          avatar: avatarUri,
          otherParticipant: other,
          isSupportConversation: isSupport || item.isSystem,
          task: item.activeTask || item.task || item.job || item.activeJob,
        })}
        onLongPress={() => {
          const isArchived = archivedIds.includes(item.id);
          Alert.alert(
            t('messages.conversationOptions'),
            t(isArchived ? 'messages.unarchiveQuestion' : 'messages.archiveQuestion', { name: displayName }),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: isArchived ? t('messages.moveToInbox') : t('messages.archiveConversation'),
                onPress: () => toggleArchiveConversation(item.id)
              }
            ]
          );
        }}
        activeOpacity={0.75}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <UserAvatar uri={avatarUri} name={other.fullName || displayName} size={54} style={styles.avatar} />
          {other.isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Content */}
        <View style={styles.chatContent}>
          <View style={styles.chatTop}>
            <View style={styles.nameRow}>
              <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
              <View style={[styles.roleTag, { backgroundColor: tagBg }]}>
                <Text style={[styles.roleTagText, { color: tagColor }]}>{roleTag}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.chatTime, { color: colors.placeholder }]}>{formatTime(item.lastMessage?.createdAt)}</Text>
              <TouchableOpacity
                onPress={() => {
                  const isArchived = archivedIds.includes(item.id);
                  Alert.alert(
                    isArchived ? t('messages.unarchiveChat') : t('messages.archiveChat'),
                    t(isArchived ? 'messages.moveToInboxQuestion' : 'messages.moveToArchiveQuestion', { name: displayName }),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: isArchived ? t('messages.moveToInbox') : t('messages.archive'),
                        onPress: () => toggleArchiveConversation(item.id)
                      }
                    ]
                  );
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialCommunityIcons
                  name={archivedIds.includes(item.id) ? "archive-arrow-up-outline" : "archive-arrow-down-outline"}
                  size={16}
                  color={colors.accent}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.chatBottom}>
            <Text style={[styles.chatSnippet, { color: hasUnread ? colors.text : colors.textSecondary, fontWeight: hasUnread ? '600' : '400' }]} numberOfLines={1}>
              {getLastMessagePreview(item.lastMessage)}
            </Text>
            {hasUnread ? (
              <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.border} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

        {/* Header Top Row */}
        <View style={styles.headerTop}>
          {/* Hamburger circular menu */}
          <TouchableOpacity style={[styles.menuBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.openDrawer()}>
            <MaterialCommunityIcons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Title Area */}
          <View style={styles.titleArea}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('messages.title')}</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{t('messages.subtitle')}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineIndicator} />
              <Text style={[styles.onlineText, { color: colors.accent }]}>{t('messages.youAreOnline')}</Text>
            </View>
          </View>

          {/* Symmetrical spacer to center the title area */}
          <View style={{ width: 44 }} />
        </View>


        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('messages.searchMessages')}
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.placeholder} />
            </TouchableOpacity>
          ) : (
            <MaterialCommunityIcons name="tune-variant" size={20} color={colors.placeholder} />
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroller}
        >
          {FILTER_CHIPS.map(chip => {
            const active = activeFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? '#0D9488' : colors.card,
                    borderColor: active ? '#0D9488' : colors.border
                  }
                ]}
                onPress={() => setActiveFilter(chip.key)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={chip.icon}
                  size={16}
                  color={active ? '#FFF' : colors.textSecondary}
                />
                <Text style={[styles.chipText, { color: active ? '#FFF' : colors.text }]}>
                  {chip.label}
                </Text>
                {chip.key === 'unread' && unreadTotal > 0 && (
                  <View
                    style={[
                      styles.chipBadge,
                      {
                        backgroundColor: active ? '#FFF' : '#EF4444',
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipBadgeText,
                        { color: active ? '#0D9488' : '#FFF' }
                      ]}
                    >
                      {unreadTotal}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {/* List */}
        {loading && conversations.length === 0 ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 60 }} />
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={18}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="message-text-outline" size={64} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('messages.noConversationsYet')}</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t('messages.conversationsAppearHere')}</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 50,
    paddingBottom: 8,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  titleArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  headerSub: { fontSize: 12, marginTop: 1, color: '#64748B', textAlign: 'center' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 3 },
  onlineIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  onlineText: { fontSize: 12, fontWeight: '800' },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  newMsgRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  newMsgBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  newMsgText: { fontSize: 12, fontWeight: '800' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, height: 48, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15 },

  chipsScroller: { flexGrow: 0, marginBottom: 12 },
  chipsRow: { paddingHorizontal: 20, paddingBottom: 4, gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 18, borderRadius: 19, borderWidth: 1 },
  chipText: { fontSize: 13.5, fontWeight: '700', includeFontPadding: false, textAlignVertical: 'center' },
  chipBadge: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chipBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  chipBadgeActive: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  chipBadgeTextActive: { fontSize: 9, fontWeight: '900', color: '#0D9488' },

  statsRow: { paddingHorizontal: 20, gap: 12 },
  statCard: { width: 145, height: 110, borderRadius: 18, padding: 12, justifyContent: 'space-between' },
  statCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 10.5, fontWeight: '800', flex: 1 },
  statCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  statValue: { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  statSub: { fontSize: 9.5, fontWeight: '600', lineHeight: 11 },
  statArrowCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  listContent: { paddingTop: 8, paddingBottom: 110 },
  chatRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  avatarWrap: { position: 'relative', marginRight: 14 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  avatarFallback: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 20, fontWeight: '800' },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFF' },
  chatContent: { flex: 1 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1, marginRight: 8 },
  chatName: { fontSize: 15, fontWeight: '800' },
  roleTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  roleTagText: { fontSize: 10, fontWeight: '800' },
  chatTime: { fontSize: 12, fontWeight: '500' },
  chatBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 22 },
  chatSnippet: { fontSize: 13, flex: 1, marginRight: 8 },
  unreadBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});

export default ChatListScreen;
