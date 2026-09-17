import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ScrollView, StatusBar, TextInput, Modal, Alert, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeAreaView from '../../components/Common/TealSafeAreaView';

import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAppContext } from '../../context/AppContext';

import api from '../../services/api';
import { translateApiError } from '../../utils/eligibilityMessages';

const ReviewTaskScreen = ({ route, navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();
  const { fetchAppData } = useAppContext();
  const { task, provider } = route.params;
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert(t('common.error'), t('jobs.selectRating', 'Please select a rating.'));
      return;
    }

    setLoading(true);
    try {
      await api.post(`/reviews`, {
        jobId: task.id,
        targetUserId: provider.id,
        rating,
        comment
      });

      await fetchAppData?.(true);

      if (route.params?.onReviewSubmitted) {
        route.params.onReviewSubmitted(task.id);
      } else if (route.params?.onOptimisticSubmit) {
        route.params.onOptimisticSubmit(task.id, provider.id, rating, comment);
      }

      Alert.alert(t('common.success'), t('jobs.reviewThanks', 'Thank you for your review!'), [
        { text: t('common.close'), onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), translateApiError(error, t, 'jobs.reviewSubmitFailed'));
    } finally {
      setLoading(false);
    }
  };

  const StarRating = () => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <MaterialCommunityIcons
            name={star <= rating ? 'star' : 'star-outline'}
            size={40}
            color={star <= rating ? '#FCD34D' : '#D1D5DB'}
            style={{ marginHorizontal: 6 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('jobs.rateReview', 'Rate & Review')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Provider Info */}
        <View style={[styles.providerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.providerHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('jobs.youWorkedWith', 'You worked with')}</Text>
          </View>
          <View style={styles.providerInfo}>
            <View style={styles.providerAvatar}>
              <MaterialCommunityIcons name="account" size={40} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.providerName, { color: colors.text }]}>{provider?.fullName || t('common.provider')}</Text>
              <Text style={[styles.providerRole, { color: colors.textSecondary }]}>{provider?.specialization || t('jobs.serviceProvider', 'Service Provider')}</Text>
            </View>
          </View>
        </View>

        {/* Task Info */}
        <View style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: 12 }]}>{t('jobs.onTask', 'On task')}</Text>
          <Text style={[styles.taskTitle, { color: colors.text }]}>{task?.title || t('jobs.task')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.textSecondary} />
            <Text style={[styles.taskDate, { color: colors.textSecondary }]}>
              {task?.completedAt ? new Date(task.completedAt).toLocaleDateString() : t('jobs.recentlyCompleted', 'Recently completed')}
            </Text>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('jobs.rateExperience', 'How would you rate this experience?')}</Text>
          <StarRating />
          {rating > 0 && (
            <Text style={[styles.ratingLabel, { color: colors.accent }]}>
              {t(`jobs.ratingLabels.${rating}`, rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent')}
            </Text>
          )}
        </View>

        {/* Comments Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('jobs.shareFeedbackOptional', 'Share your feedback (optional)')}</Text>
          <TextInput
            style={[styles.commentInput, { 
              color: colors.text, 
              borderColor: colors.border,
              backgroundColor: colors.background
            }]}
            placeholder={t('jobs.reviewPlaceholder', 'Tell us more about your experience...')}
            placeholderTextColor={colors.placeholder}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Quick Tags */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('jobs.quickFeedback', 'Quick feedback (tap to add)')}</Text>
          <View style={styles.tagsContainer}>
            {[
              t('jobs.reviewTags.professional', 'Professional'),
              t('jobs.reviewTags.punctual', 'Punctual'),
              t('jobs.reviewTags.friendly', 'Friendly'),
              t('jobs.reviewTags.qualityWork', 'Quality Work'),
              t('jobs.reviewTags.recommended', 'Recommended'),
            ].map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  { 
                    backgroundColor: comment.includes(tag) ? colors.accent : colors.background,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => {
                  if (comment.includes(tag)) {
                    setComment(comment.replace(tag + ' ', '').replace(tag, ''));
                  } else {
                    setComment(comment + (comment ? ' ' : '') + tag);
                  }
                }}
              >
                <Text style={[styles.tagText, { color: comment.includes(tag) ? '#FFF' : colors.text }]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.cancelBtnText, { color: colors.text }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.accent, flexDirection: 'row', gap: 8 }]}
            onPress={handleSubmitReview}
            disabled={loading || rating === 0}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {t('jobs.submitReview', 'Submit Review')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  providerCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  providerHeader: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  providerRole: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  taskDate: {
    fontSize: 13,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  commentInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 120,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ReviewTaskScreen;
