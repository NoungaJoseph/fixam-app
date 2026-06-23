import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ScrollView, StatusBar, TextInput, Modal, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeAreaView from '../../components/Common/TealSafeAreaView';

import { useTheme } from '../../context/ThemeContext';

import api from '../../services/api';

const ReviewTaskScreen = ({ route, navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { task, provider } = route.params;
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (route.params?.onOptimisticSubmit) {
      route.params.onOptimisticSubmit(task.id, provider.id, rating, comment);
      navigation.goBack();
      return;
    }

    // Fallback for non-optimistic usage
    setLoading(true);
    try {
      await api.post(`/reviews`, {
        jobId: task.id,
        targetUserId: provider.id,
        rating,
        comment
      });

      Alert.alert('Success', 'Thank you for your review!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit review');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Rate & Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Provider Info */}
        <View style={[styles.providerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.providerHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>You worked with</Text>
          </View>
          <View style={styles.providerInfo}>
            <View style={styles.providerAvatar}>
              <MaterialCommunityIcons name="account" size={40} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.providerName, { color: colors.text }]}>{provider?.fullName || 'Professional'}</Text>
              <Text style={[styles.providerRole, { color: colors.textSecondary }]}>{provider?.specialization || 'Service Provider'}</Text>
            </View>
          </View>
        </View>

        {/* Task Info */}
        <View style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: 12 }]}>On task</Text>
          <Text style={[styles.taskTitle, { color: colors.text }]}>{task?.title || 'Task'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.textSecondary} />
            <Text style={[styles.taskDate, { color: colors.textSecondary }]}>
              {task?.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Recently completed'}
            </Text>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How would you rate this experience?</Text>
          <StarRating />
          {rating > 0 && (
            <Text style={[styles.ratingLabel, { color: colors.accent }]}>
              {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
            </Text>
          )}
        </View>

        {/* Comments Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Share your feedback (optional)</Text>
          <TextInput
            style={[styles.commentInput, { 
              color: colors.text, 
              borderColor: colors.border,
              backgroundColor: colors.background
            }]}
            placeholder="Tell us more about your experience..."
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick feedback (tap to add)</Text>
          <View style={styles.tagsContainer}>
            {['Professional', 'Punctual', 'Friendly', 'Quality Work', 'Recommended'].map(tag => (
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
            <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.accent }]}
            onPress={handleSubmitReview}
            disabled={loading || rating === 0}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </Text>
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
