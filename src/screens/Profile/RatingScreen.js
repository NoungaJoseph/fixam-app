import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform,
  KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAppContext } from '../../context/AppContext';
import UserAvatar from '../../components/UserAvatar';
import api from '../../services/api';

const RatingScreen = ({ route, navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { fetchAppData } = useAppContext();

  // mode: 'rate_provider' (client rates provider) OR 'rate_client' (provider rates client)
  const { jobId, targetUser, mode = 'rate_provider', onReviewSuccess } = route.params || {};
  const isRatingClient = mode === 'rate_client';

  const displayName = targetUser?.fullName || targetUser?.name || (isRatingClient ? t('common.client', 'Client') : t('common.provider', 'Provider'));
  const displayAvatar = targetUser?.avatar;
  const isVerified = targetUser?.providerProfile?.verification === 'VERIFIED';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TAGS = isRatingClient
    ? [
        { key: 'Friendly', label: t('reviews.tagFriendly', 'Friendly') },
        { key: 'Clear Instructions', label: t('reviews.tagClearInstructions', 'Clear Instructions') },
        { key: 'Paid on Time', label: t('reviews.tagPaidOnTime', 'Paid on Time') },
        { key: 'Respectful', label: t('reviews.tagRespectful', 'Respectful') },
        { key: 'Easy to Work With', label: t('reviews.tagEasyToWorkWith', 'Easy to Work With') },
      ]
    : [
        { key: 'Punctual', label: t('reviews.tagPunctual', 'Punctual') },
        { key: 'Professional', label: t('reviews.tagProfessional', 'Professional') },
        { key: 'Clean Work', label: t('reviews.tagCleanWork', 'Clean Work') },
        { key: 'Great Value', label: t('reviews.tagGreatValue', 'Great Value') },
        { key: 'Highly Skilled', label: t('reviews.tagHighlySkilled', 'Highly Skilled') },
      ];

  const toggleTag = (tagKey) => {
    setSelectedTags(prev => prev.includes(tagKey) ? prev.filter(t => t !== tagKey) : [...prev, tagKey]);
  };

  const getRatingLabel = () => {
    switch (rating) {
      case 5: return t('reviews.excellent', 'Excellent!');
      case 4: return t('reviews.veryGood', 'Very Good');
      case 3: return t('reviews.good', 'Good');
      case 2: return t('reviews.fair', 'Fair');
      case 1: return t('reviews.needsImprovement', 'Needs Improvement');
      default: return t('reviews.tapToRate', 'Tap to rate');
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        t('reviews.ratingRequired', 'Rating Required'),
        t('reviews.ratingRequiredBody', 'Please select a star rating before submitting.')
      );
      return;
    }
    if (!jobId || !targetUser?.id) {
      Alert.alert(
        t('common.error', 'Error'),
        t('reviews.missingInfo', 'Missing job or user information. Please go back and try again.')
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const fullComment = [
        selectedTags.length > 0 ? selectedTags.join(', ') : '',
        comment.trim(),
      ].filter(Boolean).join(' • ');

      await api.post('/reviews', {
        jobId,
        targetUserId: targetUser.id,
        rating,
        comment: fullComment || null,
      });

      // Call callbacks & refresh context data
      if (typeof onReviewSuccess === 'function') {
        onReviewSuccess({ rating, comment: fullComment });
      }
      await fetchAppData?.(true);

      Alert.alert(
        t('reviews.reviewSubmitted', 'Review Submitted!'),
        t('reviews.thankYouForRating', 'Thank you for rating {{name}}.', { name: displayName }),
        [{ text: t('common.done', 'Done'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const msg = error.response?.data?.message || t('common.tryAgain', 'Could not submit your review. Please try again.');
      Alert.alert(t('common.error', 'Error'), msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isRatingClient ? t('reviews.rateClient', 'Rate Client') : t('reviews.rateService', 'Rate Service')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Target Hero */}
        <View style={styles.providerHero}>
          <View style={styles.avatarContainer}>
            <UserAvatar uri={displayAvatar} name={displayName} size={100} style={styles.avatar} />
            {isVerified && !isRatingClient && (
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={20} color="#FFF" />
              </View>
            )}
          </View>
          <Text style={[styles.providerName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.serviceText, { color: colors.textSecondary }]}>
            {isRatingClient 
              ? t('reviews.howWasClient', 'How was this client to work with?') 
              : t('reviews.serviceCompletedSuccess', 'Service completed successfully')}
          </Text>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={[styles.ratingTitle, { color: colors.text }]}>
            {isRatingClient 
              ? t('reviews.howWasExperience', 'How was your experience?') 
              : t('reviews.howWasService', 'How was the service?')}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(s => (
              <TouchableOpacity key={s} onPress={() => setRating(s)} activeOpacity={0.7}>
                <MaterialCommunityIcons
                  name={s <= rating ? 'star' : 'star-outline'}
                  size={52}
                  color={s <= rating ? '#FBBF24' : (isDarkMode ? '#4B5563' : '#D1D5DB')}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.ratingLabel, { color: rating > 0 ? colors.accent : colors.textSecondary }]}>
            {getRatingLabel()}
          </Text>
        </View>

        {/* Quick Tags */}
        <View style={styles.tagsSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t('reviews.whatStoodOut', 'What stood out?')}
          </Text>
          <View style={styles.tagsRow}>
            {TAGS.map(tag => {
              const isSelected = selectedTags.includes(tag.key);
              return (
                <TouchableOpacity
                  key={tag.key}
                  style={[
                    styles.tag,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    isSelected && { backgroundColor: colors.accent, borderColor: colors.accent }
                  ]}
                  onPress={() => toggleTag(tag.key)}
                >
                  <Text style={[
                    styles.tagText,
                    { color: colors.textSecondary },
                    isSelected && { color: '#FFF' }
                  ]}>
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Comment Box */}
        <View style={styles.commentSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {isRatingClient 
              ? t('reviews.leaveRemarkOptional', 'Leave a remark (Optional)') 
              : t('reviews.leaveReviewOptional', 'Leave a Review (Optional)')}
          </Text>
          <TextInput
            style={[styles.commentInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder={isRatingClient 
              ? t('reviews.shareClientExp', 'Share your experience working with this client...') 
              : t('reviews.shareServiceExp', 'Tell others about the quality of service...')}
            placeholderTextColor={colors.placeholder}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: rating > 0 ? colors.accent : colors.border, opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {isRatingClient ? t('reviews.submitRemark', 'Submit Remark') : t('reviews.submitReview', 'Submit Review')}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20, paddingBottom: 15,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  placeholder: { width: 40 },
  scrollContent: { paddingBottom: 60 },
  providerHero: { alignItems: 'center', paddingVertical: 28 },
  avatarContainer: { position: 'relative', marginBottom: 14 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#E5E7EB' },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 36, fontWeight: '900' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#10B981', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  providerName: { fontSize: 22, fontWeight: '900', marginBottom: 6 },
  serviceText: { fontSize: 14, fontWeight: '500' },
  ratingSection: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
  ratingTitle: { fontSize: 18, fontWeight: '800', marginBottom: 18 },
  starsRow: { flexDirection: 'row', gap: 8 },
  ratingLabel: { fontSize: 16, fontWeight: '800', marginTop: 14 },
  tagsSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30, borderWidth: 1.5 },
  tagText: { fontSize: 13, fontWeight: '700' },
  commentSection: { paddingHorizontal: 20, marginBottom: 28 },
  commentInput: { borderRadius: 16, padding: 16, height: 120, fontSize: 15, borderWidth: 1 },
  footer: { paddingHorizontal: 20 },
  submitBtn: { height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

export default RatingScreen;
