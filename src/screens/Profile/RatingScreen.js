import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  StatusBar, ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';

import api from '../../services/api';

const CLIENT_TAGS = ['Friendly', 'Clear Instructions', 'Paid on Time', 'Respectful', 'Easy to Work With'];
const PROVIDER_TAGS = ['Punctual', 'Professional', 'Clean Work', 'Great Value', 'Highly Skilled'];

const RatingScreen = ({ route, navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { user } = useAuth();

  // mode: 'rate_provider' (client rates provider) OR 'rate_client' (provider rates client)
  const { jobId, targetUser, mode = 'rate_provider' } = route.params || {};
  const isRatingClient = mode === 'rate_client';

  const displayName = targetUser?.fullName || targetUser?.name || (isRatingClient ? 'Client' : 'Provider');
  const displayAvatar = targetUser?.avatar;
  const isVerified = targetUser?.providerProfile?.verification === 'VERIFIED';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TAGS = isRatingClient ? CLIENT_TAGS : PROVIDER_TAGS;

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    if (!jobId || !targetUser?.id) {
      Alert.alert('Error', 'Missing job or user information. Please go back and try again.');
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

      Alert.alert(
        'Review Submitted!',
        `Thank you for rating ${displayName}.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const msg = error.response?.data?.message || 'Could not submit your review. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabel = rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : rating === 1 ? 'Needs Improvement' : 'Tap to rate';

  return (
    <View 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isRatingClient ? 'Rate Client' : 'Rate Service'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

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
            {isRatingClient ? 'How was this client to work with?' : 'Service completed successfully'}
          </Text>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={[styles.ratingTitle, { color: colors.text }]}>
            {isRatingClient ? 'How was your experience?' : 'How was the service?'}
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
            {ratingLabel}
          </Text>
        </View>

        {/* Quick Tags */}
        <View style={styles.tagsSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>What stood out?</Text>
          <View style={styles.tagsRow}>
            {TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  selectedTags.includes(tag) && { backgroundColor: colors.accent, borderColor: colors.accent }
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[
                  styles.tagText,
                  { color: colors.textSecondary },
                  selectedTags.includes(tag) && { color: '#FFF' }
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comment Box */}
        <View style={styles.commentSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {isRatingClient ? 'Leave a remark (Optional)' : 'Leave a Review (Optional)'}
          </Text>
          <TextInput
            style={[styles.commentInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder={isRatingClient ? 'Share your experience working with this client...' : 'Tell others about the quality of service...'}
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
                <Text style={styles.submitBtnText}>Submit {isRatingClient ? 'Remark' : 'Review'}</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
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
