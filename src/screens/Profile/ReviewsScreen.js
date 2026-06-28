import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import TealSafeAreaView from '../../components/Common/TealSafeAreaView';
import UserAvatar from '../../components/UserAvatar';
import api, { getMediaUrl } from '../../services/api';

const ReviewsScreen = ({ route, navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { userId, role } = route.params || {};

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    api.get(`/reviews/users/${userId}`)
      .then((res) => {
        setReviews(res.data.data || []);
      })
      .catch((err) => {
        console.error('Error fetching reviews:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  const renderReviewItem = ({ item }) => {
    const reviewerName = item.reviewer?.fullName || item.job?.client?.fullName || t('profile.verifiedUser');
    const reviewerAvatarUri = getMediaUrl(item.reviewer?.avatar || item.job?.client?.avatar);
    const reviewDateText = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : t('common.recent');

    // If role is CLIENT, the reviewer was a PROVIDER. If role is PROVIDER, the reviewer was a CLIENT.
    const badgeText = role === 'CLIENT' 
      ? (t('profile.verifiedProvider') || 'Verified Provider') 
      : (t('profile.verifiedClient') || 'Verified Client');

    return (
      <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.reviewTopRow}>
          <UserAvatar uri={reviewerAvatarUri} name={reviewerName} size={44} radius={14} style={styles.reviewAvatar} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.reviewerNameRow}>
              <Text style={[styles.reviewerName, { color: colors.text }]} numberOfLines={1}>
                {reviewerName}
              </Text>
              <View style={[styles.badge, { backgroundColor: isDarkMode ? 'rgba(13,148,136,0.15)' : '#EFF6FF' }]}>
                <Text style={[styles.badgeText, { color: colors.accent }]}>
                  {badgeText}
                </Text>
              </View>
            </View>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialCommunityIcons
                  key={star}
                  name={star <= (item.rating || 5) ? 'star' : 'star-outline'}
                  size={14}
                  color="#F59E0B"
                  style={{ marginRight: 2 }}
                />
              ))}
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {(item.rating || 5).toFixed(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.reviewDate}>{reviewDateText}</Text>
        </View>
        <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
          {item.comment || t('profile.reviewFallback')}
        </Text>
      </View>
    );
  };

  return (
    <TealSafeAreaView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('profile.allReviews') || 'All Reviews'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="star-outline" size={64} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <Text style={[styles.noReviewsText, { color: colors.textSecondary }]}>
            {t('profileDetail.noReviewsYet') || 'No reviews yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id || item.createdAt}
          renderItem={renderReviewItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </TealSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  placeholder: { width: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  listContent: { padding: 20, paddingBottom: 40 },
  reviewCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '800',
    maxWidth: 120,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  reviewDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  noReviewsText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});

export default ReviewsScreen;
