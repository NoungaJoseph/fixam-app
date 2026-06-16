import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  StatusBar, Share, Alert, Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomHeader } from '../../navigation/NavigationComponents';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import * as Clipboard from 'expo-clipboard';
const InvitationScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [referralStats, setReferralStats] = useState({
    referralCode: user?.referralCode || 'NO-CODE-YET',
    friendsInvited: 0,
    coinsEarned: 0,
    referredUsers: []
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get('/users/referral-stats');
        if (res.data && res.data.success) {
          setReferralStats(res.data);
        }
      } catch (error) {
        console.error('Referral stats failed:', error);
      }
    };
    loadStats();
  }, []);

  const { referralCode, friendsInvited, coinsEarned, referredUsers } = referralStats;

  const onShare = async () => {
    try {
      const result = await Share.share({
        message: t('invite.shareMessage', { code: referralCode }),
      });
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <CustomHeader navigation={navigation} title={t('drawer.inviteFriends')} colors={colors} />
      
      {/* Internal Header Removed - Relying on Global Menu Bar Header */}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Illustration */}
        <View style={styles.imageContainer}>
          <View style={[styles.promoCard, { backgroundColor: isDarkMode ? '#2D3748' : '#FFF5F0', borderColor: isDarkMode ? '#4A5568' : '#FED7AA' }]}>
            <Image source={require('../../../assets/promo image/promo.png')} style={styles.promoImage} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t('invite.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('invite.subtitle')}
        </Text>

        {/* Code Box */}
        <View style={[styles.codeBox, { borderBottomColor: colors.border }]}>
          <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>{t('invite.codeLabel')}</Text>
          <View style={styles.codeRow}>
            <Text style={[styles.codeText, { color: colors.text }]}>{referralCode}</Text>
            <TouchableOpacity 
              style={styles.copyBtn}
              onPress={async () => {
                await Clipboard.setStringAsync(referralCode);
                Alert.alert(t('invite.copied'), t('invite.copiedBody'));
              }}
            >
              <MaterialCommunityIcons name="content-copy" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderBottomColor: colors.border }]}>
            <Text style={[styles.statVal, { color: colors.text }]}>{friendsInvited}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('invite.friendsInvited')}</Text>
          </View>
          <View style={[styles.statCard, { borderBottomColor: colors.border }]}>
            <Text style={[styles.statVal, { color: '#22C55E' }]}>{coinsEarned}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('invite.coinsEarned')}</Text>
          </View>
        </View>

        {referredUsers.length > 0 && (
          <View style={styles.referredUsersContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>
              {t('invite.referredFriends') || 'Friends You Invited'}
            </Text>
            {referredUsers.map((rUser) => (
              <View key={rUser.id} style={[styles.referredUserItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {rUser.avatar ? (
                  <Image source={{ uri: rUser.avatar }} style={styles.referredAvatar} />
                ) : (
                  <View style={[styles.referredAvatarPlaceholder, { backgroundColor: colors.border }]}>
                    <MaterialCommunityIcons name="account" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.referredUserInfo}>
                  <Text style={[styles.referredUserName, { color: colors.text }]}>{rUser.name}</Text>
                  <Text style={[styles.referredUserDate, { color: colors.textSecondary }]}>
                    {new Date(rUser.joinedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.coinBadge, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                  <Text style={styles.coinBadgeText}>+1 Coin</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.accent }]}
          onPress={onShare}
        >
          <MaterialCommunityIcons name="share-variant" size={22} color="#FFF" />
          <Text style={styles.shareBtnText}>{t('invite.inviteNow')}</Text>
        </TouchableOpacity>

        {/* How it works */}
        <View style={styles.howItWorks}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('invite.howItWorks')}</Text>
          
          <View style={styles.step}>
            <View style={[styles.stepNum, { backgroundColor: colors.accent }]}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>{t('invite.step1')}</Text>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNum, { backgroundColor: colors.accent }]}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>{t('invite.step2')}</Text>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNum, { backgroundColor: colors.accent }]}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>{t('invite.step3')}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  content: { padding: 24, alignItems: 'center' },
  imageContainer: { marginTop: 20, marginBottom: 30, width: '100%', alignItems: 'center' },
  promoCard: { width: '95%', height: 200, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  promoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 35, lineHeight: 22, paddingHorizontal: 10 },
  codeBox: { width: '100%', paddingVertical: 24, borderBottomWidth: 1, marginBottom: 25 },
  codeLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12, textAlign: 'center' },
  codeRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15 },
  codeText: { fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  copyBtn: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 30, width: '100%' },
  statCard: { flex: 1, padding: 20, alignItems: 'center', borderBottomWidth: 1 },
  statVal: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '700' },
  shareBtn: { width: '100%', height: 60, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40 },
  shareBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  howItWorks: { width: '100%', paddingHorizontal: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
  stepNum: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepNumText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  stepText: { fontSize: 14, fontWeight: '600' },
  referredUsersContainer: { width: '100%', marginBottom: 30, paddingHorizontal: 10 },
  referredUserItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  referredAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 15 },
  referredAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  referredUserInfo: { flex: 1 },
  referredUserName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  referredUserDate: { fontSize: 12, fontWeight: '500' },
  coinBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  coinBadgeText: { color: '#22C55E', fontSize: 12, fontWeight: '800' }
});

export default InvitationScreen;
