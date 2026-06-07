import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

// ─── Visible FAQs (always shown) ────────────────────────────────────────────
const VISIBLE_FAQS = [
  {
    q: 'How do I post a task?',
    a: 'Tap "Post a Task" from the home screen or the side menu. Fill in the task title, description, location and budget. Professionals nearby will send you quotes.',
    tags: ['post', 'task', 'create', 'hire'],
  },
  {
    q: 'How does payment work?',
    a: 'Payments are made securely through the Fixam wallet. Funds are only released to the professional once you confirm the task is completed to your satisfaction.',
    tags: ['payment', 'pay', 'wallet', 'money', 'funds'],
  },
  {
    q: 'How are professionals verified?',
    a: 'All professionals on Fixam go through an identity verification process including ID/passport check and a live selfie. Certified professionals also submit trade documents.',
    tags: ['verify', 'verified', 'trust', 'id', 'professional'],
  },
  {
    q: 'Can I cancel a task?',
    a: 'Yes, you can cancel a task before a professional is assigned at no charge. After assignment, a cancellation fee may apply depending on the stage of the job.',
    tags: ['cancel', 'refund', 'stop'],
  },
  {
    q: 'What is the Fixam coin system?',
    a: 'Fixam Coins are the in-app currency. Professionals use coins to unlock job requests. You can top up your coin balance in the Wallet section.',
    tags: ['coins', 'currency', 'wallet', 'top up', 'balance'],
  },
  {
    q: 'How do I report an issue with a professional?',
    a: 'Go to the task in question, tap "Report Issue" or contact our support team directly via the chat icon below. We respond within 24 hours.',
    tags: ['report', 'issue', 'problem', 'complaint', 'bad'],
  },
  {
    q: 'How do I become a verified professional?',
    a: 'Go to Settings → Verification. Upload your identity document and take a live selfie. Optional: add professional certificates for a higher trust ranking.',
    tags: ['become', 'provider', 'professional', 'verification', 'join'],
  },
];

// ─── Hidden FAQs (only shown when search matches) ────────────────────────────
const HIDDEN_FAQS = [
  {
    q: 'How do I top up my wallet?',
    a: 'Go to Wallet from the side menu or home screen, tap "Top Up", choose your amount, and complete the payment via mobile money (MTN or Orange). Your balance is updated instantly.',
    tags: ['top up', 'wallet', 'mtn', 'orange', 'add money', 'recharge'],
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We currently support MTN Mobile Money and Orange Money. More methods will be added soon.',
    tags: ['payment', 'mtn', 'orange', 'mobile money', 'method'],
  },
  {
    q: 'How long does it take for a professional to respond?',
    a: 'Most professionals respond within 30 minutes. Average response time is shown on each provider's profile.',
    tags: ['response', 'time', 'fast', 'quick', 'wait'],
  },
  {
    q: 'Can I hire the same professional again?',
    a: 'Yes! You can save a professional to your Favorites and directly message or book them again from your favorites list.',
    tags: ['again', 'repeat', 'same', 'favorite', 'rehire'],
  },
  {
    q: 'Is my personal information safe?',
    a: 'Your data is encrypted and stored securely. We never share your personal information with third parties without your consent. See our Privacy Policy for full details.',
    tags: ['privacy', 'data', 'safe', 'security', 'personal', 'information'],
  },
  {
    q: 'What happens if a professional does not show up?',
    a: 'If a professional does not arrive, you can cancel the job at no charge and report the no-show. Our team will review the case and issue a full refund if payment was made.',
    tags: ['no show', 'did not come', 'absent', 'refund', 'cancel'],
  },
  {
    q: 'Can I negotiate the price with a professional?',
    a: 'Yes. Once you receive quotes, you can chat with professionals directly to discuss the scope of work and agree on a final price before confirming.',
    tags: ['price', 'negotiate', 'discount', 'cost', 'budget'],
  },
  {
    q: 'How do I track a job in progress?',
    a: 'From the active task screen, tap "Track Provider" to see their real-time location on the map. Both client and provider can share location during an active task.',
    tags: ['track', 'location', 'map', 'gps', 'live'],
  },
  {
    q: 'How do reviews and ratings work?',
    a: 'After a task is completed, both the client and professional can rate each other. Ratings are averaged over all completed jobs and displayed publicly on the profile.',
    tags: ['review', 'rating', 'stars', 'feedback', 'score'],
  },
  {
    q: 'What categories of services are available?',
    a: 'Fixam covers a wide range of services including plumbing, electrical work, cleaning, babysitting, delivery, beauty, carpentry, painting, and more. New categories are added regularly.',
    tags: ['category', 'service', 'type', 'plumber', 'electrician', 'cleaning', 'delivery'],
  },
  {
    q: 'Can I post a task if I am outside Cameroon?',
    a: 'Currently, Fixam is available in Cameroon only. We are working on expanding to other countries. Stay tuned for updates.',
    tags: ['country', 'cameroon', 'location', 'international', 'outside'],
  },
  {
    q: 'How do I change my phone number or email?',
    a: 'Go to Settings → Profile. Tap "Edit Profile" and update your contact details. You will receive a verification code to confirm the change.',
    tags: ['change', 'phone', 'email', 'update', 'account'],
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Settings → Privacy & Security → Delete Account. This action is permanent and all your data will be removed within 30 days.',
    tags: ['delete', 'account', 'remove', 'close'],
  },
  {
    q: 'What is a booking and how is it different from a task?',
    a: 'A task is an open request that any matching professional can respond to. A booking is a confirmed, scheduled service with a specific professional at a set time and price.',
    tags: ['booking', 'task', 'difference', 'schedule', 'appointment'],
  },
  {
    q: 'Can a professional cancel a job?',
    a: 'Professionals can cancel before work begins, but repeated cancellations negatively affect their ranking and may result in account suspension.',
    tags: ['cancel', 'provider', 'professional', 'withdraw'],
  },
  {
    q: 'How do I leave a review after a job?',
    a: 'Once the task is marked as completed, you will receive a prompt to rate the professional. You can also find the task in "My Tasks" and tap "Leave Review".',
    tags: ['review', 'leave', 'rate', 'after', 'feedback', 'complete'],
  },
  {
    q: 'What if I have a dispute with a professional?',
    a: 'Tap "Report Issue" on the task page or contact support via Live Chat. Our disputes team reviews all cases within 48 hours and works to find a fair resolution.',
    tags: ['dispute', 'conflict', 'problem', 'issue', 'unfair'],
  },
  {
    q: 'How do professionals earn on Fixam?',
    a: 'Professionals earn by completing tasks. They pay a small coin fee to unlock each job request. After completing the task, they receive payment directly from the client.',
    tags: ['earn', 'income', 'money', 'provider', 'professional', 'salary'],
  },
  {
    q: 'What is the referral program?',
    a: 'When you invite a friend using your referral code and they complete their first task, both of you earn bonus coins. Find your referral code under Settings → Invite Friends.',
    tags: ['referral', 'invite', 'friend', 'bonus', 'coins', 'earn'],
  },
  {
    q: 'How do I enable or disable notifications?',
    a: 'Go to Settings → Notification Settings. You can toggle push notifications, email alerts, and SMS updates individually.',
    tags: ['notification', 'alert', 'push', 'disable', 'enable', 'sms'],
  },
  {
    q: 'Can I use Fixam without creating an account?',
    a: 'No. You need a verified account to post tasks or offer services. Registration is free and takes under 2 minutes.',
    tags: ['account', 'register', 'sign up', 'without', 'guest'],
  },
  {
    q: 'How do I reset my password?',
    a: 'On the login screen, tap "Forgot Password". Enter your email or phone number and follow the instructions to create a new password.',
    tags: ['password', 'reset', 'forgot', 'change', 'login'],
  },
  {
    q: 'What is the level and rank system for professionals?',
    a: 'Professionals earn levels by completing jobs. Higher levels unlock better visibility, lower coin costs, and rank badges (Newcomer → Beginner → Rising Star → Skilled → Expert → Master → Elite).',
    tags: ['level', 'rank', 'badge', 'expert', 'master', 'elite', 'progress'],
  },
  {
    q: 'Is there a minimum or maximum budget for tasks?',
    a: 'There is no strict minimum or maximum. However, setting a realistic budget helps attract quality professionals. Unrealistically low budgets may receive fewer responses.',
    tags: ['budget', 'minimum', 'maximum', 'price', 'amount', 'cost'],
  },
  {
    q: 'How do I switch between client and provider modes?',
    a: 'Currently each account is registered as either a client or a provider. Contact support if you need to change your account type.',
    tags: ['switch', 'client', 'provider', 'mode', 'role', 'change'],
  },
  {
    q: 'What should I do if the app is not working?',
    a: 'Try closing and reopening the app. If the issue persists, check your internet connection, clear the app cache, or update to the latest version. Contact support if it continues.',
    tags: ['bug', 'crash', 'not working', 'error', 'problem', 'app'],
  },
  {
    q: 'Can I schedule a task for a future date?',
    a: 'Yes. When posting a task, select "Schedule" and choose your preferred date and time. The professional will confirm availability before the booking is finalised.',
    tags: ['schedule', 'future', 'later', 'date', 'time', 'appointment'],
  },
  {
    q: 'How do I know a professional is nearby?',
    a: 'When browsing providers, you can see their service area and approximate distance. Enable location services for the most accurate results.',
    tags: ['nearby', 'distance', 'location', 'close', 'area'],
  },
  {
    q: 'What happens after I confirm task completion?',
    a: 'Once you confirm completion, the payment is released to the professional, and you will be asked to leave a rating. The task is then archived in "My Tasks".',
    tags: ['complete', 'confirm', 'finish', 'done', 'payment release'],
  },
  {
    q: 'How do I contact Fixam support?',
    a: 'You can reach us via Live Chat (fastest), email at support@fixam.com, or call +237 6 70 67 12 49. Our team is available Monday–Saturday, 8am–8pm.',
    tags: ['contact', 'support', 'help', 'reach', 'email', 'call', 'phone'],
  },
];

const HelpCenterScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [openingChat, setOpeningChat] = useState(false);

  const contactOptions = [
    { icon: 'chat-processing-outline', label: t('help.liveChat'), sub: t('help.liveChatSub'), color: '#22C55E', type: 'chat' },
    { icon: 'email-outline', label: t('help.emailSupport'), sub: 'support@fixam.com', color: '#2563EB' },
    { icon: 'phone-outline', label: t('help.callUs'), sub: '+237 6 70 67 12 49', color: '#F97316' },
  ];

  const q = search.toLowerCase().trim();

  // When there's a search query, search ALL faqs (visible + hidden)
  // When no query, only show visible ones
  const displayedFaqs = q
    ? [...VISIBLE_FAQS, ...HIDDEN_FAQS].filter(f =>
        f.q.toLowerCase().includes(q) ||
        f.a.toLowerCase().includes(q) ||
        f.tags?.some(tag => tag.includes(q))
      )
    : VISIBLE_FAQS;

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
