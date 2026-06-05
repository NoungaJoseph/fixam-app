import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const FAQS = [
  {
    q: 'How do I post a task?',
    a: 'Tap "Post a Task" from the home screen or the side menu. Fill in the task title, description, location and budget. Professionals nearby will send you quotes.',
  },
  {
    q: 'How does payment work?',
    a: 'Payments are made securely through the Fixam wallet. Funds are only released to the professional once you confirm the task is completed to your satisfaction.',
  },
  {
    q: 'How are professionals verified?',
    a: 'All professionals on Fixam go through an identity verification process including ID/passport check and a live selfie. Certified professionals also submit trade documents.',
  },
  {
    q: 'Can I cancel a task?',
    a: 'Yes, you can cancel a task before a professional is assigned at no charge. After assignment, a cancellation fee may apply depending on the stage of the job.',
  },
  {
    q: 'What is the Fixam coin system?',
    a: 'Fixam Coins are the in-app currency. Professionals use coins to unlock job requests. You can top up your coin balance in the Wallet section.',
  },
  {
    q: 'How do I report an issue with a professional?',
    a: 'Go to the task in question, tap "Report Issue" or contact our support team directly via the chat icon below. We respond within 24 hours.',
  },
  {
    q: 'How do I become a verified professional?',
    a: 'Go to Settings → Verification. Upload your identity document and take a live selfie. Optional: add professional certificates for a higher trust ranking.',
  },
];

const CONTACT_OPTIONS = [
  { icon: 'chat-processing-outline', label: 'Live Chat', sub: 'Typically replies in minutes', color: '#22C55E' },
  { icon: 'email-outline', label: 'Email Support', sub: 'support@fixam.com', color: '#2563EB' },
  { icon: 'phone-outline', label: 'Call Us', sub: '+237 6 70 67 12 49', color: '#F97316' },
];

const HelpCenterScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [openingChat, setOpeningChat] = useState(false);

  const faqs = [
    { q: t('help.qPostTask'), a: t('help.aPostTask') },
    { q: t('help.qPayment'), a: t('help.aPayment') },
    { q: t('help.qVerified'), a: t('help.aVerified') },
    { q: t('help.qCancel'), a: t('help.aCancel') },
    { q: t('help.qCoins'), a: t('help.aCoins') },
    { q: t('help.qReport'), a: t('help.aReport') },
    { q: t('help.qBecomeVerified'), a: t('help.aBecomeVerified') },
  ];
  const contactOptions = [
    { icon: 'chat-processing-outline', label: t('help.liveChat'), sub: t('help.liveChatSub'), color: '#22C55E', type: 'chat' },
    { icon: 'email-outline', label: t('help.emailSupport'), sub: 'support@fixam.com', color: '#2563EB' },
    { icon: 'phone-outline', label: t('help.callUs'), sub: '+237 6 70 67 12 49', color: '#F97316' },
  ];

  const filtered = faqs.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  );

  const openLiveChat = async () => {
    if (openingChat) return;
    setOpeningChat(true);
    try {
      const res = await api.post('/chat/support');
      const conversation = res.data.data;
      const support = conversation?.participants?.[0] || {};
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        receiverId: support.id,
        userName: support.fullName || t('support.title'),
        avatar: support.avatar,
      });
    } catch (error) {
      Alert.alert(t('support.unavailable'), error.response?.data?.message || t('support.tryLater'));
    } finally {
      setOpeningChat(false);
    }
  };

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('help.title')}</Text>
          <View style={{ width: 42 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <Text style={[styles.heroTitle, { color: colors.text }]}>{t('help.hero')}</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>{t('help.subtitle')}</Text>

          {/* Search */}
          <View style={[styles.searchBar, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.placeholder} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('help.search')}
              placeholderTextColor={colors.placeholder}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={16} color={colors.placeholder} />
              </TouchableOpacity>
            )}
          </View>

          {/* FAQ */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('help.faq')}</Text>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="help-circle-outline" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('help.noResults', { query: search })}</Text>
            </View>
          ) : filtered.map((faq, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.faqCard, { borderBottomColor: colors.border }]}
              onPress={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <View style={styles.faqQuestion}>
                <Text style={[styles.faqQ, { color: colors.text, flex: 1 }]}>{faq.q}</Text>
                <MaterialCommunityIcons
                  name={openFaq === i ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
              {openFaq === i && (
                <Text style={[styles.faqA, { color: colors.textSecondary }]}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          ))}

          {/* Contact options */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 22 }]}>{t('help.contact')}</Text>
          {contactOptions.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.contactCard, { borderBottomColor: colors.border }]}
              onPress={opt.type === 'chat' ? openLiveChat : undefined}
            >
              <View style={styles.contactIcon}>
                <MaterialCommunityIcons name={opt.icon} size={24} color={opt.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactLabel, { color: colors.text }]}>{opt.label}</Text>
                <Text style={[styles.contactSub, { color: colors.textSecondary }]}>{opt.type === 'chat' && openingChat ? t('help.openingSupport') : opt.sub}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}

          <Text style={[styles.footNote, { color: colors.textSecondary }]}>
            {t('help.footNote')}
          </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 22, paddingBottom: 48 },
  heroTitle: { fontSize: 20, fontWeight: '900', marginBottom: 6 },
  heroSub: { fontSize: 14, marginBottom: 18 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 48, borderRadius: 8, borderWidth: 1, marginBottom: 22 },
  searchInput: { flex: 1, fontSize: 15 },
  sectionTitle: { fontSize: 17, fontWeight: '900', marginBottom: 14 },
  faqCard: { borderBottomWidth: 1, paddingVertical: 16 },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQ: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  faqA: { fontSize: 13, lineHeight: 21, marginTop: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 14, marginTop: 10 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, paddingVertical: 16 },
  contactIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  contactLabel: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  contactSub: { fontSize: 13 },
  footNote: { fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 18 },
});

export default HelpCenterScreen;
