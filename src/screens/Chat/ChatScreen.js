import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, Image, StatusBar, ActivityIndicator, Alert, Keyboard, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api, { getMediaUrl } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import UserAvatar from '../../components/UserAvatar';
import AudioPlayer from '../../components/AudioPlayer';

const SUPPORTED_MESSAGE_TYPES = new Set(['TEXT', 'IMAGE', 'FILE', 'AUDIO']);

const formatTime = (millis) => {
  if (isNaN(millis) || millis < 0) return '0:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const unloadActiveRecording = async (rec) => {
  if (!rec) return;
  try {
    global.expoRecordingUnloadPromise = rec.stopAndUnloadAsync();
    await global.expoRecordingUnloadPromise;
  } catch (e) {
    console.log('[ChatScreen] Error unloading recording:', e.message);
  } finally {
    global.expoRecordingUnloadPromise = null;
  }
};

const normalizeMessage = (message) => {
  if (!message) return null;
  const type = String(message.type || 'TEXT').toUpperCase();
  const content = message.content || message.mediaUrl || '';
  const isUnsupportedCallMessage = ['AUDIO_CALL', 'VIDEO_CALL'].includes(type)
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
    userName: userData.role === 'ADMIN' ? 'Fixam Support' : (userData.fullName || userData.phone || 'User'),
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
  const [chatStatus, setChatStatus] = useState({ active: true, reason: 'LOADING' });
  const [hasCheckedTask, setHasCheckedTask] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [activeTask, setActiveTask] = useState(task || null);
  const [previewImage, setPreviewImage] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isProcessingRecord, setIsProcessingRecord] = useState(false);
  const recordTimerRef = useRef(null);
  const recordingRef = useRef(null);
  const flatListRef = useRef();
  const activeConvIdRef = useRef(conversationId);
  console.log('[ChatScreen] Initial loading state:', !!conversationId);

  useEffect(() => {
    // Reset audio session to non-recording mode on mount
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    }).catch(() => {});

    // Try to safely clear any previously hung global recording on mount too
    if (global.expoActiveRecording) {
      unloadActiveRecording(global.expoActiveRecording)
        .then(() => { global.expoActiveRecording = null; })
        .catch(() => {});
    }

    return () => {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
      const rec = global.expoActiveRecording || recordingRef.current;
      if (rec) {
        unloadActiveRecording(rec)
          .then(() => {
            global.expoActiveRecording = null;
            recordingRef.current = null;
          })
          .catch(() => {});
      }
    };
  }, []);

  // Sync state with route.params when navigating to an already mounted ChatScreen
  useEffect(() => {
    if (route.params) {
      if (route.params.conversationId !== activeConvIdRef.current) {
        setActiveConvId(route.params.conversationId);
        activeConvIdRef.current = route.params.conversationId;
        setMessages([]);
        setLoading(!!route.params.conversationId);
        setHasCheckedTask(false);
      }
      setParticipantDetails({
        userName: route.params.userName || '',
        receiverId: route.params.receiverId || '',
        avatar: route.params.avatar || '',
        otherParticipant: route.params.otherParticipant || null,
      });
      if (route.params.task) setActiveTask(route.params.task);
    }
  }, [route.params]);

  // Keep activeConvIdRef in sync
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return () => showSub.remove();
  }, []);

  // Always fetch full participant details from the conversation endpoint on mount.
  // This guarantees otherParticipant.role and providerProfile are populated regardless
  // of how the chat was opened (provider profile page vs. Messages list).
  useEffect(() => {
    if (!activeConvId) {
      if (receiverId) {
        // We have a receiverId but no conversationId (e.g. from TaskDetails)
        // Let's create or fetch the existing conversation ID from backend
        api.post('/chat/conversations', { participantId: receiverId })
          .then((res) => {
            if (res.data?.data?.id) {
              setActiveConvId(res.data.data.id);
            }
          })
          .catch((err) => {
            console.log('[ChatScreen] Error fetching conv by participant:', err.message);
            if (err.response?.data?.message === 'requiresBooking') {
              showCannotMessageAlert();
            }
          });
      }
      return;
    }

    api.get(`/chat/conversations/${activeConvId}`)
      .then((res) => {
        const conv = res.data.data;
        if (conv?.chatStatus) {
          setChatStatus(conv.chatStatus);
        }
        if (!conv?.participants) return;
        const other = conv.participants.find((p) => (p.userId || p.user?.id || p.id) !== currentUser.id);
        const normalized = normalizeParticipant(other);
        if (normalized) setParticipantDetails(normalized);
      })
      .catch((err) => {
        console.log('[ChatScreen] Could not fetch conversation details:', err.message);
        setChatStatus({ active: true, reason: 'ERROR_FALLBACK' });
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
  }, [activeConvId, receiverId]);

  // Load cached messages when activeConvId changes for instant UI
  useEffect(() => {
    if (!activeConvId) return;

    const loadCachedMessages = async () => {
      try {
        const cached = await AsyncStorage.getItem(`fixam:chat_messages:${activeConvId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setMessages(normalizeMessages(parsed));
          setLoading(false);
        }
      } catch (err) {
        console.log('[ChatScreen] Error loading cached messages:', err);
      }
    };

    loadCachedMessages();
  }, [activeConvId]);

  // Reactive Effect: cache messages automatically whenever the messages array updates
  useEffect(() => {
    if (!activeConvId || messages.length === 0) return;
    const sentMessages = messages.filter(m => m.status !== 'sending');
    if (sentMessages.length > 0) {
      AsyncStorage.setItem(`fixam:chat_messages:${activeConvId}`, JSON.stringify(sentMessages)).catch(() => {});
    }
  }, [messages, activeConvId]);

  const fetchMessages = useCallback(async () => {
    if (!activeConvId) {
      console.log('[ChatScreen] No conversation ID, skipping message fetch');
      setLoading(false);
      return;
    }
    try {
      console.log('[ChatScreen] Fetching messages for conversation:', activeConvId);
      const res = await api.get(`/chat/${activeConvId}/messages?limit=80`, { timeout: 12000 });
      const normalized = normalizeMessages(res.data.data || []);
      setMessages(normalized);
      console.log('[ChatScreen] Loaded', res.data.data?.length || 0, 'messages');
      
      // Hide loader instantly so messages display immediately
      setLoading(false);

      // Perform secondary actions in the background without blocking render
      api.put(`/chat/${activeConvId}/read`, {}, { timeout: 8000 })
        .then(() => {
          fetchConversations();
          fetchNotifications();
        })
        .catch((readError) => {
          console.log('Warning: Could not mark messages as read:', readError.message);
        });

      api.get(`/chat/${activeConvId}/active-task`, { timeout: 12000 })
        .then((activeTaskRes) => setActiveTask(activeTaskRes.data.data || task || null))
        .catch(() => setActiveTask(task || null))
        .finally(() => setHasCheckedTask(true));
    } catch (error) {
      console.log('Error fetching messages:', error.message);
      setLoading(false);
      if (error.code === 'ECONNABORTED') {
        console.log('[ChatScreen] Timeout, retrying...');
        setTimeout(() => fetchMessages(), 5000);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, task]);

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
        setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId]);

  const trackingTask = activeTask || task;
  const canMessage = chatStatus.active;

  const handleBookAgain = async () => {
    const providerProfileId = otherParticipant?.providerProfile?.id;
    if (!providerProfileId) {
      Alert.alert(t('common.error'), t('profile.providerUnavailable'));
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/providers/${providerProfileId}`);
      if (res.data?.success && res.data?.data) {
        navigation.navigate('ProviderProfile', { provider: res.data.data });
      } else {
        throw new Error('Failed to load profile');
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.providerUnavailable'));
    } finally {
      setLoading(false);
    }
  };

  const showCannotMessageAlert = () => {
    Alert.alert(t('common.error'), t('profile.chatClosedBanner'));
  };

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
      if (error.response?.data?.message === 'requiresBooking') {
        showCannotMessageAlert();
      } else {
        Alert.alert(t('common.error'), t('messages.sendFailed'));
      }
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    if (isProcessingRecord || recordingRef.current || global.expoActiveRecording) {
      console.log('[ChatScreen] Recording already in progress, skipping startRecording');
      return;
    }
    setIsProcessingRecord(true);

    try {
      // 1. Wait for any active unload promise to finish
      if (global.expoRecordingUnloadPromise) {
        console.log('[ChatScreen] Waiting for previous recording to finish unloading...');
        await global.expoRecordingUnloadPromise.catch(() => {});
      }

      // 2. Double check if there is an active recording that wasn't unloaded
      const rec = global.expoActiveRecording || recordingRef.current;
      if (rec) {
        console.log('[ChatScreen] Unloading active recording before preparing new one...');
        await unloadActiveRecording(rec);
      }

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(t('common.required'), t('messages.permissionRequired'));
        setIsProcessingRecord(false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      
      global.expoActiveRecording = newRecording;
      recordingRef.current = newRecording;
      setRecording(newRecording);
      
      await newRecording.startAsync();
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[ChatScreen] startRecording error:', err);
      global.expoActiveRecording = null;
      recordingRef.current = null;
      setRecording(null);
      setIsRecording(false);
      Alert.alert(t('common.error'), t('messages.sendFailed'));
    } finally {
      setTimeout(() => setIsProcessingRecord(false), 500);
    }
  };

  const stopRecording = async () => {
    if (isProcessingRecord) return;
    setIsProcessingRecord(true);

    const recInstance = global.expoActiveRecording || recordingRef.current || recording;
    if (!recInstance) {
      setIsProcessingRecord(false);
      return;
    }

    setIsRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    try {
      const uri = recInstance.getURI();
      await unloadActiveRecording(recInstance);
      global.expoActiveRecording = null;
      recordingRef.current = null;
      setRecording(null);

      // Revert audio mode to allow normal playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (uri) {
        uploadChatFile(uri, 'audio/m4a', 'voice_note.m4a', 'AUDIO');
      }
    } catch (err) {
      console.error('[ChatScreen] stopRecording error:', err);
      global.expoActiveRecording = null;
      recordingRef.current = null;
      setRecording(null);
    } finally {
      setTimeout(() => setIsProcessingRecord(false), 500);
    }
  };

  const cancelRecording = async () => {
    if (isProcessingRecord) return;
    setIsProcessingRecord(true);

    const recInstance = global.expoActiveRecording || recordingRef.current || recording;
    if (!recInstance) {
      setIsProcessingRecord(false);
      return;
    }

    setIsRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    try {
      await unloadActiveRecording(recInstance);
      global.expoActiveRecording = null;
      recordingRef.current = null;
      setRecording(null);

      // Revert audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (err) {
      console.error('[ChatScreen] cancelRecording error:', err);
      global.expoActiveRecording = null;
      recordingRef.current = null;
      setRecording(null);
    } finally {
      setRecordDuration(0);
      setTimeout(() => setIsProcessingRecord(false), 500);
    }
  };

  const handleImagePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(t('common.required'), t('messages.permissionRequired'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImages(prev => [
        ...prev,
        ...result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `chat_image_${Date.now()}.jpg`
        }))
      ]);
    }
  };

  const handleSendAll = async () => {
    if (!canMessage) return;
    setIsSending(true);

    try {
      if (selectedImages.length > 0) {
        setIsUploading(true);
        for (const img of selectedImages) {
          const formData = new FormData();
          formData.append('file', {
            uri: img.uri,
            type: img.type,
            name: img.name,
          });
          formData.append('type', 'chat');

          const res = await uploadFile(formData);
          const url = res.url || res.data?.url;
          if (!url) throw new Error('Upload did not return a URL');
          
          await handleSend(url, 'IMAGE');
        }
        setSelectedImages([]);
      }

      if (input.trim()) {
        await handleSend(input, 'TEXT');
      }
    } catch (error) {
      console.log('[ChatScreen] handleSendAll error:', error.message);
      Alert.alert(t('common.error'), t('messages.sendFailed'));
    } finally {
      setIsUploading(false);
      setIsSending(false);
    }
  };

  const uploadChatFile = async (uri, mimeType, fileName, msgType) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
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
          { 
            backgroundColor: isImage 
              ? 'transparent' 
              : (isMe ? colors.accent : (isDarkMode ? '#1E293B' : '#F3F4F6')) 
          },
          (isImage || isAudio) && { padding: 0, borderRadius: 15 }
        ]}>
          {isImage ? (
            <TouchableOpacity onPress={() => setPreviewImage(item.content)} activeOpacity={0.9}>
              <Image source={{ uri: item.content }} style={styles.chatImage} resizeMode="cover" />
            </TouchableOpacity>
          ) : isAudio ? (
            <AudioPlayer uri={item.content} color={isMe ? '#FFF' : colors.text} />
          ) : (
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
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={[styles.header, { backgroundColor: isDarkMode ? 'transparent' : '#FFF', borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}><MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} /></TouchableOpacity>
        <UserAvatar uri={avatarUri} name={userName} size={40} radius={12} style={styles.headerAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerName, { color: colors.text }]}>{userName}</Text>
          <Text style={styles.headerStatus}>{!canMessage ? '' : isTyping ? t('messages.typing') : t('messages.online')}</Text>
        </View>
        {!isSupportConversation && (
          <TouchableOpacity
            style={[styles.trackCompact, { borderColor: colors.border, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#FFF' }]}
            onPress={openTaskTracker}
            accessibilityRole="button"
            accessibilityLabel={user?.role === 'PROVIDER' ? 'Track client on map' : 'Track provider on map'}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.text} />
            <Text style={[styles.trackCompactCaption, { color: colors.textSecondary }]} numberOfLines={1}>
              {user?.role === 'PROVIDER' ? 'Track client' : 'Track provider'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.top + 60, 90) : 20}
      >
        {loading ? <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} /> : (
          <FlatList ref={flatListRef} data={[...messages].reverse()} keyExtractor={item => item.id} renderItem={renderMessage} contentContainerStyle={styles.messageList} showsVerticalScrollIndicator={false} inverted={true} />
        )}

        {!canMessage && (
          <View style={[styles.bookingBanner, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <Text style={[styles.bookingBannerText, { color: colors.textSecondary }]}>
              {t('profile.chatClosedBanner')}
            </Text>
            {user?.role === 'CLIENT' && otherParticipant?.role === 'PROVIDER' && (
              <TouchableOpacity
                style={[styles.bannerBookBtn, { backgroundColor: colors.accent }]}
                onPress={handleBookAgain}
              >
                <Text style={styles.bannerBookBtnText}>{t('profile.bookAgain')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {selectedImages.length > 0 && !isRecording && (
          <View style={[styles.imagePreviewContainer, { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1 }]}>
            <FlatList
              horizontal
              data={selectedImages}
              keyExtractor={(item, index) => `${item.uri}-${index}`}
              renderItem={({ item, index }) => (
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: item.uri }} style={styles.imagePreviewItem} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagePreviewList}
            />
          </View>
        )}

        {isRecording ? (
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
            <TouchableOpacity style={styles.cancelRecordBtn} onPress={cancelRecording}>
              <MaterialCommunityIcons name="delete" size={24} color="#EF4444" />
            </TouchableOpacity>
            <View style={styles.recordingStatusContainer}>
              <View style={styles.recordingDot} />
              <Text style={[styles.recordingText, { color: colors.text }]}>Recording {formatTime(recordDuration * 1000)}</Text>
            </View>
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.accent }]} onPress={stopRecording}>
              <MaterialCommunityIcons name="check" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8), opacity: canMessage ? 1 : 0.6 }]}>
            <TouchableOpacity style={styles.attachBtn} onPress={canMessage ? handleImagePick : showCannotMessageAlert} disabled={isUploading || !canMessage}>
              {isUploading ? <ActivityIndicator size="small" color={colors.accent} /> : <MaterialCommunityIcons name="plus" size={24} color={canMessage ? colors.accent : colors.placeholder} />}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.inputContainer, { backgroundColor: colors.background }]} onPress={!canMessage ? showCannotMessageAlert : undefined} activeOpacity={canMessage ? 1 : 0.7} disabled={!canMessage}>
              <View pointerEvents={canMessage ? 'auto' : 'none'} style={{ flex: 1 }}>
                <TextInput style={[styles.textInput, { color: canMessage ? colors.text : colors.placeholder }]} placeholder={canMessage ? t('messages.type') : t('profile.chatClosedBanner')} placeholderTextColor={colors.placeholder} value={input} onChangeText={(t) => { setInput(t); emit('typing', { conversationId: activeConvId, isTyping: t.length > 0 }); }} multiline editable={canMessage} />
              </View>
            </TouchableOpacity>
            {(input.trim() || selectedImages.length > 0) ? (
              <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.accent, opacity: !(isSending || isUploading) && canMessage ? 1 : 0.45 }]} onPress={canMessage ? handleSendAll : showCannotMessageAlert} disabled={isSending || isUploading || !canMessage}>
                <MaterialCommunityIcons name="send" size={20} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.sendButton, { backgroundColor: canMessage ? colors.accent : colors.border, opacity: canMessage ? 1 : 0.45 }]} onPress={canMessage ? startRecording : showCannotMessageAlert} disabled={!canMessage}>
                <MaterialCommunityIcons name="microphone" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>

    <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
      <View style={styles.previewContainer}>
        <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setPreviewImage(null)}>
          <Ionicons name="close" size={32} color="#FFF" />
        </TouchableOpacity>
        {previewImage && (
          <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
        )}
      </View>
    </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 10, paddingHorizontal: 16, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
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
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
  cancelRecordBtn: {
    marginRight: 15,
    padding: 5,
  },
  recordingStatusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  imagePreviewList: {
    gap: 12,
  },
  imagePreviewWrapper: {
    position: 'relative',
    width: 70,
    height: 70,
  },
  imagePreviewItem: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
});

export default ChatScreen;
