import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, Image, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';

import api, { getMediaUrl } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import UserAvatar from '../../components/UserAvatar';

const SUPPORTED_MESSAGE_TYPES = new Set(['TEXT', 'IMAGE', 'FILE']);

const normalizeMessage = (message) => {
  if (!message) return null;
  const type = String(message.type || 'TEXT').toUpperCase();
  const content = message.content || message.mediaUrl || '';
  const isUnsupportedCallMessage = ['AUDIO', 'AUDIO_CALL', 'VIDEO_CALL'].includes(type)
    || String(content).toLowerCase().includes('audio not supported');

  if (isUnsupportedCallMessage || !SUPPORTED_MESSAGE_TYPES.has(type)) return null;

  return {
    ...message,
    type,
    content: type === 'TEXT' ? content : getMediaUrl(content),
  };
};

const normalizeMessages = (list = []) => list.map(normalizeMessage).filter(Boolean);

const normalizeParticipant = (participant) => {
  if (!participant) return null;
  const userData = participant.user || participant;
  if (!userData?.id) return null;

  return {
    userName: userData.fullName || userData.phone || 'User',
    receiverId: userData.id,
    avatar: userData.avatar || '',
    otherParticipant: userData,
  };
};

const mergeMessage = (list, incoming) => {
  const message = normalizeMessage(incoming);
  if (!message) return list;

  const next = [...list];
  const matchIndex = next.findIndex((item) => (
    item.id === message.id
    || (message.clientMessageId && item.clientMessageId === message.clientMessageId)
    || (
      item.status === 'sending'
      && item.senderId === message.senderId
      && item.type === message.type
      && item.content === message.content
    )
  ));

  if (matchIndex >= 0) {
    next[matchIndex] = { ...next[matchIndex], ...message, status: 'sent' };
    return next;
  }

  return [...next, message];
};

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, task, isSupportConversation = false } = route.params || {};
  const { user, uploadFile } = useAuth();
  const currentUser = user || {};
  const { fetchConversations, fetchNotifications, conversations } = useAppContext();
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();
  const { on, emit } = useSocket();
  const insets = useSafeAreaInsets();
  
  const [participantDetails, setParticipantDetails] = useState({
    userName: route.params?.userName || '',
    receiverId: route.params?.receiverId || '',
    avatar: route.params?.avatar || '',
    otherParticipant: route.params?.otherParticipant || null,
  });
  
  const { userName, receiverId, avatar, otherParticipant } = participantDetails;
  const avatarUri = getMediaUrl(avatar);
  
  const [activeConvId, setActiveConvId] = useState(conversationId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(!!conversationId); // Only show loading if we have a conversationId to fetch
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTask, setActiveTask] = useState(task || null);
  const flatListRef = useRef();
  const activeConvIdRef = useRef(conversationId);
  console.log('[ChatScreen] Initial loading state:', !!conversationId);

  // Keep activeConvIdRef in sync
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  // Always fetch full participant details from the conversation endpoint on mount.
  // This guarantees otherParticipant.role and providerProfile are populated regardless
  // of how the chat was opened (provider profile page vs. Messages list).
  useEffect(() => {
    if (!activeConvId) return;

    api.get(`/chat/conversations/${activeConvId}`)
      .then((res) => {
        const conv = res.data.data;
        if (!conv?.participants) return;
        const other = conv.participants.find((p) => (p.userId || p.user?.id || p.id) !== currentUser.id);
        const normalized = normalizeParticipant(other);
        if (normalized) setParticipantDetails(normalized);
      })
      .catch((err) => {
        console.log('[ChatScreen] Could not fetch conversation details:', err.message);
        // Fallback: try to find participant in already-loaded conversations context
        if (conversations.length > 0) {
          const conv = conversations.find((c) => c.id === activeConvId);
          if (conv?.participants?.length > 0) {
            const participant = conv.participants.find((p) => (p.userId || p.user?.id || p.id) !== currentUser.id);
            const normalized = normalizeParticipant(participant);
            if (normalized) setParticipantDetails(normalized);
          }
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId]);

  const fetchMessages = useCallback(async () => {
    if (!activeConvId) {
      console.log('[ChatScreen] No conversation ID, skipping message fetch');
      setLoading(false);
      return;
    }
    try {
      console.log('[ChatScreen] Fetching messages for conversation:', activeConvId);
      const res = await api.get(`/chat/${activeConvId}/messages?limit=80`, { timeout: 12000 });
      setMessages(normalizeMessages(res.data.data || []));
      console.log('[ChatScreen] Loaded', res.data.data?.length || 0, 'messages');

      try {
        await api.put(`/chat/${activeConvId}/read`, {}, { timeout: 8000 });
        fetchConversations();
        fetchNotifications();
      } catch (readError) {
        console.log('Warning: Could not mark messages as read:', readError.message);
      }

      api.get(`/chat/${activeConvId}/active-task`, { timeout: 12000 })
        .then((activeTaskRes) => setActiveTask(activeTaskRes.data.data || task || null))
        .catch(() => setActiveTask(task || null));
    } catch (error) {
      console.log('Error fetching messages:', error.message);
      if (error.code === 'ECONNABORTED') {
        console.log('[ChatScreen] Timeout, retrying...');
        setTimeout(() => fetchMessages(), 1000);
      }
    } finally {
      setLoading(false);
    }
  }, [activeConvId, fetchConversations, fetchNotifications, task]);

  useEffect(() => {
    if (!activeConvId) {
      console.log('[ChatScreen] No activeConvId yet, waiting for message send');
      return;
    }

    console.log('[ChatScreen] Setting up listeners for conversation:', activeConvId);
    // Fetch messages when conversation loads
    fetchMessages();
    
    // Join socket room
    emit('join:conversation', activeConvId);
    console.log('[ChatScreen] Joined conversation room:', activeConvId);

    // Listen for new messages in this conversation
    const offMessage = on('message:new', (msg) => {
      console.log('[ChatScreen] Received message:new event:', msg.id, 'for conv:', msg.conversationId, 'expected:', activeConvId);
      if (msg.conversationId === activeConvId) {
        setMessages(prev => mergeMessage(prev, msg));
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        if (msg.senderId !== user?.id) {
          api.put(`/chat/${activeConvId}/read`, {}, { timeout: 8000 }).then(() => {
            fetchConversations();
            fetchNotifications();
          }).catch(() => {});
        }
      } else {
        console.log('[ChatScreen] Message is for different conversation, ignoring');
      }
    });

    const offTyping = on('user:typing', ({ userId, isTyping: typingStatus }) => {
      if (userId === receiverId) setIsTyping(typingStatus);
    });

    return () => {
      console.log('[ChatScreen] Cleaning up listeners for:', activeConvId);
      offMessage?.();
      offTyping?.();
    };
  }, [activeConvId, fetchMessages, on, emit, receiverId, user?.id, fetchConversations, fetchNotifications]);

  const trackingTask = activeTask || task;
  const hasAcceptedWork = Boolean(
    trackingTask?.id &&
    (
      ['ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'ONGOING'].includes(String(trackingTask.status || '').toUpperCase()) ||
      (trackingTask.isBooking && ['PENDING', 'ACCEPTED'].includes(String(trackingTask.status || '').toUpperCase())) ||
      trackingTask.assignments?.some((assignment) => ['ACCEPTED', 'IN_PROGRESS'].includes(String(assignment.status || '').toUpperCase()))
    )
  );
  const isDirectConversation = !isSupportConversation && otherParticipant?.role !== 'ADMIN';
  const chatLocked = isDirectConversation && !hasAcceptedWork;

  const openTaskTracker = () => {
    if (!trackingTask?.id) {
      Alert.alert(t('messages.locationUnavailableTitle'), t('messages.locationUnavailableBody'));
      return;
    }
    navigation.navigate('LiveTaskMap', { task: trackingTask });
  };

  const openBookingForm = () => {
    if (!receiverId) {
      Alert.alert(t('messages.bookingUnavailableTitle'), t('messages.bookingUnavailableBody'));
      return;
    }
    navigation.navigate('BookingForm', {
      providerId: receiverId,
      providerName: userName,
      task: trackingTask,
    });
  };

  const handleSend = async (content = input, type = 'TEXT') => {
    const trimmedContent = type === 'TEXT' ? content.trim() : content;
    if (!trimmedContent) return;
    if (isSending && type === 'TEXT') return;

    const clientMessageId = `mobile-${user?.id || 'user'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Always send receiverId to backend to create conversation if needed
    const messageData = { 
      conversationId: activeConvIdRef.current || null,
      receiverId,
      content: trimmedContent,
      type,
      clientMessageId,
    };

    try {
      const optimisticMsg = {
        id: clientMessageId,
        clientMessageId,
        conversationId: activeConvIdRef.current,
        senderId: user.id,
        content: trimmedContent,
        type,
        createdAt: new Date().toISOString(),
        status: 'sending'
      };
      setMessages(prev => [...prev, optimisticMsg]);
      if (type === 'TEXT') setInput('');
      setIsSending(true);
      
      console.log('[ChatScreen] Sending message:', messageData);
      const res = await api.post('/chat/send', messageData, { timeout: 30000 });
      const newMessage = res.data.data;
      console.log('[ChatScreen] Message sent successfully:', newMessage.id, 'ConvId:', newMessage.conversationId);
      
      // Replace optimistic with real message
      const finalMsg = { ...newMessage, clientMessageId, status: 'sent' };
      setMessages(prev => mergeMessage(prev, finalMsg));
      
      // UPDATE active conversation ID if this was a new conversation
      if (!activeConvIdRef.current && newMessage.conversationId) {
        console.log('[ChatScreen] Setting conversation ID after send:', newMessage.conversationId);
        setActiveConvId(newMessage.conversationId);
        activeConvIdRef.current = newMessage.conversationId;
        // Join the conversation room now that we have the ID
        emit('join:conversation', newMessage.conversationId);
      } else if (activeConvIdRef.current) {
        console.log('[ChatScreen] Already in conversation:', activeConvIdRef.current);
      }
      
      emit('typing', { conversationId: activeConvIdRef.current || newMessage.conversationId, isTyping: false });
    } catch (error) {
      console.log('Detailed Send error:', {
        message: error.message,
        code: error.code,
        timeout: error.code === 'ECONNABORTED',
        response: error.response?.data
      });
      // Remove optimistic message if failed
      setMessages(prev => prev.filter(m => m.clientMessageId !== clientMessageId));
      Alert.alert(t('common.error'), t('messages.sendFailed'));
    } finally {
      setIsSending(false);
    }
  };

  const handleImagePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(t('common.required'), t('messages.permissionRequired'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled) uploadChatFile(result.assets[0].uri, 'image/jpeg', 'chat_image.jpg', 'IMAGE');
  };

  const uploadChatFile = async (uri, mimeType, fileName, msgType) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: mimeType,
        name: fileName,
      });
      formData.append('type', 'chat');

      const res = await uploadFile(formData);
      const url = res.url || res.data?.url;
      if (!url) throw new Error('Upload did not return a URL');
      handleSend(url, msgType);
    } catch (error) {
      Alert.alert(t('common.error'), t('messages.sendFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user?.id;
    const isImage = item.type === 'IMAGE';
    const isAudio = item.type === 'AUDIO';
    
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowRight]}>
        <View style={[
          styles.bubble, 
          isMe ? styles.bubbleRight : styles.bubbleLeft, 
          { backgroundColor: isMe ? colors.accent : (isDarkMode ? '#1E293B' : '#F3F4F6') },
          (isImage || isAudio) && { padding: 5, borderRadius: 15 }
        ]}>
          {isImage ? (
            <Image source={{ uri: getMediaUrl(item.content) }} style={styles.chatImage} resizeMode="cover" />
          ) : isAudio ? null : (
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextRight, { color: isMe ? '#FFF' : colors.text }]}>
              {item.content}
            </Text>
          )}
        </View>
        <View style={[styles.msgMeta, isMe && styles.msgMetaRight]}>
          <Text style={styles.msgTime}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          {isMe && <MaterialCommunityIcons name="check-all" size={14} color={item.status === 'sending' ? colors.placeholder : colors.accent} />}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={[styles.header, { backgroundColor: isDarkMode ? 'transparent' : '#FFF', borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}><MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} /></TouchableOpacity>
        <UserAvatar uri={avatarUri} name={userName} size={40} radius={12} style={styles.headerAvatar} />
        <View style={{ flex: 1 }}><Text style={[styles.headerName, { color: colors.text }]}>{userName}</Text><Text style={styles.headerStatus}>{isTyping ? t('messages.typing') : t('messages.online')}</Text></View>
        {hasAcceptedWork ? (
          <TouchableOpacity
            style={[styles.trackCompact, { borderColor: colors.border, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#FFF' }]}
            onPress={openTaskTracker}
            accessibilityRole="button"
            accessibilityLabel={user?.role === 'PROVIDER' ? 'Track client on map' : 'Track provider on map'}
          >
            <MaterialCommunityIcons name="map-outline" size={22} color={colors.text} />
            <Text style={[styles.trackCompactCaption, { color: colors.textSecondary }]} numberOfLines={1}>
              {user?.role === 'PROVIDER' ? 'Track client' : 'Track provider'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {currentUser.role === 'CLIENT' &&
         otherParticipant?.role === 'PROVIDER' &&
         !isSupportConversation && (
          <TouchableOpacity
            style={[styles.bookCompact, { backgroundColor: colors.accent }]}
            onPress={openBookingForm}
            accessibilityRole="button"
            accessibilityLabel="Book service"
          >
            <MaterialCommunityIcons name="calendar-plus" size={18} color="#FFFFFF" />
            <Text style={styles.bookCompactText}>Book</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loading ? <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} /> : (
          <FlatList ref={flatListRef} data={messages} keyExtractor={item => item.id} renderItem={renderMessage} contentContainerStyle={styles.messageList} showsVerticalScrollIndicator={false} onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} />
        )}

        {chatLocked ? (
          <View style={[styles.bookingBanner, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 16) }]}>
            <MaterialCommunityIcons name="calendar-lock" size={28} color={colors.placeholder} style={{ marginBottom: 8 }} />
            <Text style={[styles.bookingBannerText, { color: colors.textSecondary }]}>
              {currentUser.role === 'CLIENT' && otherParticipant?.role === 'PROVIDER'
                ? t('messages.mustBookProvider', 'You must book this provider to message them.')
                : t('messages.activeTaskRequired', 'Messaging is available only while an active booking or selected task is in progress.')}
            </Text>
            {currentUser.role === 'CLIENT' && otherParticipant?.role === 'PROVIDER' ? (
              <TouchableOpacity style={[styles.bannerBookBtn, { backgroundColor: colors.accent }]} onPress={openBookingForm}>
                <Text style={styles.bannerBookBtnText}>{t('messages.bookToMessage', 'Book to Message')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
            <TouchableOpacity style={styles.attachBtn} onPress={handleImagePick} disabled={isUploading}>{isUploading ? <ActivityIndicator size="small" color={colors.accent} /> : <MaterialCommunityIcons name="plus" size={24} color={colors.accent} />}</TouchableOpacity>
            <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
              <TextInput style={[styles.textInput, { color: colors.text }]} placeholder={t('messages.type')} placeholderTextColor={colors.placeholder} value={input} onChangeText={(t) => { setInput(t); emit('typing', { conversationId: activeConvId, isTyping: t.length > 0 }); }} multiline />
            </View>
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.accent, opacity: input.trim() && !isSending ? 1 : 0.45 }]} onPress={() => handleSend()} disabled={!input.trim() || isSending}><MaterialCommunityIcons name="send" size={20} color="#FFF" /></TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { width: 40, height: 40, borderRadius: 12, marginHorizontal: 12 },
  headerName: { fontSize: 16, fontWeight: '700' },
  headerStatus: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  trackCompact: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderRadius: 4, marginLeft: 6, maxWidth: 76 },
  trackCompactCaption: { fontSize: 10, fontWeight: '800', marginTop: 2, textAlign: 'center' },
  bookCompact: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, height: 36, marginLeft: 6 },
  bookCompactText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  messageList: { padding: 20, paddingBottom: 30 },
  msgRow: { marginBottom: 15, maxWidth: '85%' },
  msgRowRight: { alignSelf: 'flex-end' },
  bubble: { padding: 15, borderRadius: 20 },
  bubbleRight: { borderBottomRightRadius: 4 },
  bubbleLeft: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  chatImage: { width: 200, height: 200, borderRadius: 10 },
  audioBubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, gap: 10, minWidth: 140 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  msgMetaRight: { justifyContent: 'flex-end' },
  msgTime: { fontSize: 10, color: '#9CA3AF' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', padding: 15, borderTopWidth: 1 },
  attachBtn: { marginRight: 10 },
  inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 25, paddingHorizontal: 15, marginRight: 10 },
  textInput: { flex: 1, minHeight: 45, fontSize: 15, paddingTop: 10, paddingBottom: 10 },
  sendButton: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  bookingBanner: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bookingBannerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  bannerBookBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bannerBookBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ChatScreen;
