import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigationStateContext } from '../context/NavigationStateContext';
import { useLanguage } from '../context/LanguageContext';
import api, { getMediaUrl } from '../services/api';

const SupportChatButton = () => {
  const { user, uploadFile } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { on, emit, isConnected } = useSocket();
  const { currentRouteName } = useNavigationStateContext();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!conversation?.id) return undefined;
    emit('join:conversation', conversation.id);
    const offMessage = on('message:new', (message) => {
      if (message.conversationId === conversation.id) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      }
    });
    return () => offMessage?.();
  }, [conversation?.id, emit, on]);

  const openSupport = async () => {
    if (!user) return;
    setOpen(true);
    setLoading(true);
    try {
      const support = await api.post('/chat/support');
      setConversation(support.data.data);
      const messagesRes = await api.get(`/chat/${support.data.data.id}/messages?limit=80`);
      setMessages(messagesRes.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const send = async (content = input, type = 'TEXT') => {
    const value = type === 'TEXT' ? content.trim() : content;
    if (!value || !conversation?.id) return;
    setInput('');
    const res = await api.post('/chat/send', {
      conversationId: conversation.id,
      receiverId: conversation.participants?.[0]?.id,
      content: value,
      type,
    });
    setMessages((current) => current.some((item) => item.id === res.data.data.id) ? current : [...current, res.data.data]);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'support-image.jpg',
      });
      const upload = await uploadFile(formData);
      await send(upload.url || upload.data?.url, 'IMAGE');
    } finally {
      setUploading(false);
    }
  };

  const hiddenRoutes = new Set([
    'Chat',
    'ChatList',
    'Messages',
    'Conversations',
    'BookingForm',
    'Booking',
    'CoinPaymentForm',
    'CoinPaymentSuccess',
    'TopUp',
    'TopUpAmount',
    'TopUpPayment',
    'TopUpSuccess',
    'WalletTopUp',
    'Payment',
    'LiveTaskMap',
    'TaskDetails',
    'JobStatus',
    'ReviewTask',
    'DocUpload',
    'Selfie',
    'VerificationSuccess',
    'ChangePassword',
  ]);

  if (!user || hiddenRoutes.has(currentRouteName)) return null;

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={openSupport} activeOpacity={0.88}>
        <MaterialCommunityIcons name="headset" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalShell}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.panel, { backgroundColor: colors.card }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>{t('support.title')}</Text>
                <Text style={[styles.status, { color: isConnected ? '#10B981' : colors.textSecondary }]}>{isConnected ? t('support.online') : t('support.connecting')}</Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color={colors.accent} style={{ flex: 1 }} />
            ) : (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messages}
                onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => {
                  const isMe = item.senderId === user.id;
                  const isImage = item.type === 'IMAGE';
                  return (
                    <View style={[styles.messageRow, isMe && styles.messageRowRight]}>
                      <View style={[styles.bubble, { backgroundColor: isMe ? '#0D9488' : (isDarkMode ? '#1E293B' : '#F1F5F9') }]}>
                        {isImage ? (
                          <Image source={{ uri: getMediaUrl(item.content) }} style={styles.imageMessage} />
                        ) : (
                          <Text style={{ color: isMe ? '#FFFFFF' : colors.text }}>{item.content}</Text>
                        )}
                      </View>
                      <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  );
                }}
              />
            )}

            <View style={[styles.composer, { borderTopColor: colors.border }]}>
              <TouchableOpacity onPress={pickImage} disabled={uploading} style={styles.iconBtn}>
                {uploading ? <ActivityIndicator size="small" color={colors.accent} /> : <MaterialCommunityIcons name="image-plus" size={22} color={colors.accent} />}
              </TouchableOpacity>
              <TextInput
                value={input}
                onChangeText={(value) => {
                  setInput(value);
                  emit('typing', { conversationId: conversation?.id, isTyping: value.length > 0 });
                }}
                placeholder={t('support.message')}
                placeholderTextColor={colors.placeholder}
                style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
              />
              <TouchableOpacity onPress={() => send()} style={[styles.sendBtn, { opacity: input.trim() ? 1 : 0.45 }]} disabled={!input.trim()}>
                <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 98,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  modalShell: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(255,255,255,0.12)' },
  panel: { height: '78%', borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  header: { paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '900' },
  status: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  messages: { padding: 16, gap: 12 },
  messageRow: { maxWidth: '82%' },
  messageRowRight: { alignSelf: 'flex-end' },
  bubble: { borderRadius: 18, padding: 12 },
  imageMessage: { width: 190, height: 190, borderRadius: 12 },
  time: { color: '#94A3B8', fontSize: 10, marginTop: 4 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: 1 },
  iconBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 42, maxHeight: 110, borderRadius: 21, paddingHorizontal: 14 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0D9488', alignItems: 'center', justifyContent: 'center' },
});

export default SupportChatButton;
