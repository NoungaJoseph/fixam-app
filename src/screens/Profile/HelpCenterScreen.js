import React, { useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

import { useAuth } from '../../context/AuthContext';

// ─── CLIENT FAQS (15 total: 5 visible, 10 hidden) ────────────────────────────
const CLIENT_VISIBLE_FAQS = [
  {
    q: 'How do I post a task?',
    a: 'Tap "Post a Task" from the home screen or the side menu. Fill in the task title, description, location and budget. Professionals nearby will send you quotes.',
    tags: ['post', 'task', 'create', 'hire'],
  },
  {
    q: 'How does payment work?',
    a: "We don't do payments in our app. Clients deal with providers directly after job completion.",
    tags: ['payment', 'pay', 'wallet', 'money', 'funds', 'cash'],
  },
  {
    q: 'How are professionals verified?',
    a: 'All professionals on Fixam go through an identity verification process including ID/passport check and a live selfie. Certified professionals also submit trade documents.',
    tags: ['verify', 'verified', 'trust', 'id', 'professional'],
  },
  {
    q: 'Can I cancel a task?',
    a: 'Yes, you can cancel a task before a professional is assigned at no charge. If a professional is already on their way, please notify them immediately.',
    tags: ['cancel', 'refund', 'stop'],
  },
  {
    q: 'How do I choose the best provider?',
    a: 'Review the profiles of providers who bid on your task. Check their experience, reviews, ratings, past work, and skill certifications before making a choice.',
    tags: ['choose', 'best', 'select', 'provider', 'stars', 'reviews'],
  },
];

const CLIENT_HIDDEN_FAQS = [
  {
    q: 'What is the Fixam coin system?',
    a: 'Fixam Coins are the in-app currency. Clients use coins to book a provider, unlock direct messaging, or post a job for many providers to see. You can purchase coins in the Wallet section.',
    tags: ['coins', 'currency', 'wallet', 'top up', 'balance'],
  },
  {
    q: 'How do I contact a provider?',
    a: 'Once a provider makes an offer on your task, you can open a chat conversation or start an internet call directly inside the app.',
    tags: ['contact', 'call', 'chat', 'message', 'reach'],
  },
  {
    q: 'Is my personal information safe?',
    a: 'Yes, your personal details (like phone number) are hidden. Providers can only contact you through the in-app chat or calls until you share it.',
    tags: ['privacy', 'data', 'safe', 'security', 'personal', 'information'],
  },
  {
    q: 'What happens if a provider does not show up?',
    a: 'If a provider fails to arrive at the agreed time, you can cancel the task, report the provider, and post the task again.',
    tags: ['no show', 'did not come', 'absent', 'refund', 'cancel'],
  },
  {
    q: 'Can I hire the same provider again?',
    a: 'Yes! Add the provider to your Favorites list. You can book them directly or start a chat from your Favorites section next time.',
    tags: ['again', 'repeat', 'same', 'favorite', 'rehire'],
  },
  {
    q: 'How do I leave a review?',
    a: 'Once a job is completed, you will receive a prompt to rate the provider out of 5 stars and write a review about their service quality.',
    tags: ['review', 'leave', 'rate', 'after', 'feedback', 'complete'],
  },
  {
    q: 'Is there a charge to post a task?',
    a: 'Posting a task or booking a provider uses Fixam Coins, which you can purchase in your wallet. You negotiate and pay the provider directly for their labor after the job is completed.',
    tags: ['free', 'cost', 'charge', 'price', 'post'],
  },
  {
    q: 'How do I change my location?',
    a: 'Go to Settings → Profile → Edit Profile. You can update your location area to receive quotes from providers nearby.',
    tags: ['change', 'location', 'city', 'update', 'address'],
  },
  {
    q: 'What if I have a dispute with a provider?',
    a: 'If you have an issue, tap "Report Issue" on the job page or contact our support team. We will review the chat logs and take appropriate action.',
    tags: ['dispute', 'conflict', 'problem', 'issue', 'unfair'],
  },
  {
    q: 'How do I reset my password?',
    a: 'Tap "Forgot Password" on the login screen. You will receive an OTP code to verify your identity and set a new password.',
    tags: ['password', 'reset', 'forgot', 'change', 'login'],
  },
  {
    q: 'How do I contact Fixam support?',
    a: 'You can reach us via Live Chat (fastest), email at support@fixam.net, or call +237 682 803 006. Our team is available Monday–Saturday, 8am–8pm.',
    tags: ['contact', 'support', 'help', 'reach', 'email', 'call', 'phone'],
  },
];

// ─── PROVIDER FAQS (15 total: 5 visible, 10 hidden) ──────────────────────────
const PROVIDER_VISIBLE_FAQS = [
  {
    q: 'How do I get jobs on Fixam?',
    a: 'Browse the "Open Jobs" tab. When you see a task matching your skills, make an offer. Clients will review your profile and hire you.',
    tags: ['get', 'jobs', 'find', 'work', 'apply'],
  },
  {
    q: 'How does payment work?',
    a: "We don't do payments in our app. Clients deal with providers directly after job completion.",
    tags: ['payment', 'pay', 'wallet', 'money', 'funds', 'cash'],
  },
  {
    q: 'What are Fixam coins and why do I need them?',
    a: 'Fixam Coins are the in-app currency. Providers use coins to unlock task requests, make bids, and boost their profiles.',
    tags: ['coins', 'currency', 'wallet', 'unlock', 'bid'],
  },
  {
    q: 'How do I verify my provider account?',
    a: 'Go to Settings → Verification. Upload your ID card or passport and take a live selfie. Verified providers receive 5x more bookings.',
    tags: ['verify', 'id', 'selfie', 'passport', 'certification'],
  },
  {
    q: 'How do I set my hourly rate or price?',
    a: 'Go to Settings → Edit Profile. Set your default hourly rate. You can also negotiate custom project pricing directly with clients in chat.',
    tags: ['rate', 'price', 'hourly', 'cost', 'charge'],
  },
];

const PROVIDER_HIDDEN_FAQS = [
  {
    q: 'How do I top up my wallet?',
    a: 'Tap Wallet in the side menu or dashboard. Select a coin package and pay via mobile money (MTN, Orange, M-Pesa). Coins are added instantly.',
    tags: ['top up', 'wallet', 'buy', 'coins', 'money'],
  },
  {
    q: 'What is a profile boost?',
    a: 'Boosting highlights your profile at the top of the search list and client feeds. You can boost for 1, 3, or 7 days in exchange for coins.',
    tags: ['boost', 'promote', 'visibility', 'top', 'search'],
  },
  {
    q: 'How do skill levels and ranks work?',
    a: 'As you complete tasks and receive 5-star ratings, you earn experience points to level up. Higher ranks unlock lower coin fees and master badges.',
    tags: ['level', 'rank', 'badge', 'experience', 'points'],
  },
  {
    q: 'What if a client cancels a job?',
    a: 'If a client cancels a job after you have started, they should notify you. If you suspect abuse, please report the task to support.',
    tags: ['cancel', 'client', 'remove', 'job'],
  },
  {
    q: 'How do I add certificates and portfolio items?',
    a: 'Go to Settings → Edit Profile. Scroll down to Certifications and Portfolio. Adding proof of work dramatically increases your hire rate.',
    tags: ['portfolio', 'certificates', 'add', 'credentials', 'photos'],
  },
  {
    q: 'Can I change my service categories?',
    a: 'Yes, go to Settings → Edit Profile → Skills. Select or deselect skills that match the services you offer.',
    tags: ['skills', 'skills list', 'categories', 'services', 'change'],
  },
  {
    q: 'What if I can\'t reach the client?',
    a: 'Try calling or messaging the client using the in-app chat. If they remain unreachable, cancel the booking and select "Client unreachable".',
    tags: ['unreachable', 'client', 'contact', 'call', 'no response'],
  },
  {
    q: 'How do I earn the setup bonus?',
    a: 'Complete your bio, add your skills, and verify your identity. Once the setup progress reaches 100%, you can claim a free coin bonus.',
    tags: ['bonus', 'setup', 'coins', 'free', 'claim'],
  },
  {
    q: 'What are the guidelines for reviews?',
    a: 'Reviews are left by verified clients after a job is marked complete. Positive reviews build your trust score and help you win more bids.',
    tags: ['review', 'rating', 'stars', 'feedback', 'score'],
  },
  {
    q: 'Why was my provider account suspended?',
    a: 'Accounts are suspended for repeated cancellations, late arrivals, poor ratings, or off-platform payment solicitations. Contact support to appeal.',
    tags: ['suspend', 'blocked', 'ban', 'deactivate', 'rules'],
  },
  {
    q: 'How do I contact Fixam support?',
    a: 'You can reach us via Live Chat (fastest), email at support@fixam.net, or call +237 682 803 006. Our team is available Monday–Saturday, 8am–8pm.',
    tags: ['contact', 'support', 'help', 'reach', 'email', 'call', 'phone'],
  },
];

const HelpCenterScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [openingChat, setOpeningChat] = useState(false);

  const contactOptions = [
    { icon: 'chat-processing-outline', label: t('help.liveChat'), sub: t('help.liveChatSub'), color: '#22C55E', type: 'chat' },
    { icon: 'email-outline', label: t('help.emailSupport'), sub: 'support@fixam.net', color: '#2563EB' },
    { icon: 'phone-outline', label: t('help.callUs'), sub: '+237 682 803 006', color: '#F97316' },
  ];

  const q = search.toLowerCase().trim();

  const isProvider = user?.role === 'PROVIDER' || user?.providerProfile;
  const visibleFaqs = isProvider ? PROVIDER_VISIBLE_FAQS : CLIENT_VISIBLE_FAQS;
  const hiddenFaqs = isProvider ? PROVIDER_HIDDEN_FAQS : CLIENT_HIDDEN_FAQS;

  // When there's a search query, search ALL faqs (visible + hidden)
  // When no query, only show visible ones
  const displayedFaqs = q
    ? [...visibleFaqs, ...hiddenFaqs].filter(f =>
        f.q.toLowerCase().includes(q) ||
        f.a.toLowerCase().includes(q) ||
        f.tags?.some(tag => tag.includes(q))
      )
    : visibleFaqs;

  const openLiveChat = async () => {
    if (openingChat) return;
    setOpeningChat(true);
    try {
      const res = await api.post('/chat/support');
      const conversation = res.data.data;
      const support = conversation?.participants?.find(p => p.user?.role === 'ADMIN' || p.role === 'ADMIN') || conversation?.participants?.[0] || {};
      const supportUser = support.user || support;
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        receiverId: supportUser.id,
        userName: supportUser.fullName || 'Fixam Support',
        avatar: supportUser.avatar,
        isSupportConversation: true,
      });
    } catch (error) {
      Alert.alert(
        t('support.unavailable') || 'Support unavailable',
        error.response?.data?.message || t('support.tryLater') || 'Please try again later.'
      );
    } finally {
      setOpeningChat(false);
    }
  };

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      
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
            <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: isDarkMode ? colors.card : '#F8FAFC' }]}>
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
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('help.faq')}</Text>
              {q && (
                <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                  {displayedFaqs.length} result{displayedFaqs.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {displayedFaqs.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="help-circle-outline" size={48} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t('help.noResults', { query: search })}
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                  Try searching with different keywords, or contact us via Live Chat below.
                </Text>
              </View>
            ) : displayedFaqs.map((faq, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.faqCard, { borderBottomColor: colors.border, backgroundColor: openFaq === i ? (isDarkMode ? '#0F2A2A' : '#F0FDF4') : 'transparent' }]}
                onPress={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <View style={styles.faqQuestion}>
                  <Text style={[styles.faqQ, { color: colors.text, flex: 1 }]}>{faq.q}</Text>
                  <MaterialCommunityIcons
                    name={openFaq === i ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={openFaq === i ? '#0D9488' : colors.textSecondary}
                  />
                </View>
                {openFaq === i && (
                  <Text style={[styles.faqA, { color: colors.textSecondary }]}>{faq.a}</Text>
                )}
              </TouchableOpacity>
            ))}

            {/* Contact options */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 28 }]}>{t('help.contact')}</Text>
            {contactOptions.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.contactCard, { borderColor: colors.border, backgroundColor: isDarkMode ? colors.card : '#FFF' }]}
                onPress={opt.type === 'chat' ? openLiveChat : undefined}
                activeOpacity={opt.type === 'chat' ? 0.75 : 1}
              >
                <View style={[styles.contactIconWrap, { backgroundColor: opt.color + '18' }]}>
                  <MaterialCommunityIcons name={opt.icon} size={22} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactLabel, { color: colors.text }]}>{opt.label}</Text>
                  <Text style={[styles.contactSub, { color: colors.textSecondary }]}>
                    {opt.type === 'chat' && openingChat ? (t('help.openingSupport') || 'Connecting...') : opt.sub}
                  </Text>
                </View>
                {opt.type === 'chat' && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
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
  heroSub: { fontSize: 14, marginBottom: 18, lineHeight: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 48, borderRadius: 12, borderWidth: 1, marginBottom: 22 },
  searchInput: { flex: 1, fontSize: 15 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '900' },
  resultCount: { fontSize: 13, fontWeight: '600' },
  faqCard: { borderBottomWidth: 1, paddingVertical: 16, paddingHorizontal: 12, borderRadius: 8, marginBottom: 2 },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQ: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  faqA: { fontSize: 13, lineHeight: 21, marginTop: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyText: { fontSize: 14, marginTop: 4, fontWeight: '600' },
  emptyHint: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  contactIconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  contactLabel: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  contactSub: { fontSize: 13 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  liveText: { fontSize: 10, fontWeight: '900', color: '#16A34A' },
  footNote: { fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 18 },
});

export default HelpCenterScreen;
