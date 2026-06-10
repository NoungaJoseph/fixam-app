import React, { useState, useEffect } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { Alert, ActivityIndicator, StyleSheet, View, Text, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const FeedbackScreen = ({ navigation, route }) => {
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route.params?.testimonialPreset) {
      setTopic('Testimonial request');
      setMessage('I would like to request a testimonial from a client I completed work for.');
    }
  }, [route.params?.testimonialPreset]);

  const handleSubmit = async () => {
    if (!topic.trim() || !message.trim()) {
      Alert.alert(t('feedback.missing'), t('validation.feedbackRequired'));
      return;
    }

    try {
      setLoading(true);
      await api.post('/users/feedback', { title: topic.trim(), message: message.trim() });
      Alert.alert(t('feedback.thankYou'), t('feedback.sent'));
      setTopic('');
      setMessage('');
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('feedback.failed'), t('errors.apiFallback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('feedback.title')}</Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('feedback.subtitle')}</Text>
          <Text style={[styles.label, { color: colors.text }]}>{t('feedback.topic')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={topic}
            onChangeText={setTopic}
            placeholder={t('feedback.topic')}
            placeholderTextColor={colors.placeholder}
          />
          <Text style={[styles.label, { color: colors.text }]}>{t('feedback.message')}</Text>
          <TextInput
            style={[styles.textarea, { borderColor: colors.border, color: colors.text }]}
            value={message}
            onChangeText={setMessage}
            placeholder={t('feedback.placeholder')}
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity disabled={loading} onPress={handleSubmit} style={[styles.submitBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Text style={styles.submitText}>{t('feedback.submit')}</Text>
                <MaterialCommunityIcons name="send" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 42, height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  content: { padding: 22 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 26 },
  label: { fontSize: 13, fontWeight: '900', marginBottom: 10, textTransform: 'uppercase' },
  input: { height: 56, borderRadius: 8, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, marginBottom: 20 },
  textarea: { minHeight: 170, borderRadius: 8, borderWidth: 1, padding: 16, fontSize: 15, marginBottom: 24 },
  submitBtn: { height: 56, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});

export default FeedbackScreen;
