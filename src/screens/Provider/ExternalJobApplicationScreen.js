import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';
import { optimizeImageForUpload } from '../../utils/imageOptimizer';
import ScreeningQuestionFields, { missingRequiredAnswer } from '../../components/ScreeningQuestionFields';

const ExternalJobApplicationScreen = ({ route, navigation }) => {
  const initialJob = route.params?.job || route.params?.task || {};
  const [job, setJob] = useState(initialJob);
  const jobId = initialJob.id || route.params?.jobId || route.params?.taskId;

  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { markJobApplied } = useAppContext();
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedCv, setSelectedCv] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [screeningAnswers, setScreeningAnswers] = useState({});

  React.useEffect(() => {
    if (jobId) {
      api.get(`/external-jobs/${jobId}`)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setJob((prev) => ({ ...prev, ...res.data.data }));
          }
        })
        .catch(() => {});
    }
  }, [jobId]);

  const uploadCv = async (asset) => {
    if (!asset?.uri) return;
    setUploading(true);
    try {
      const originalName = asset.fileName || asset.name || `application-cv-${Date.now()}.jpg`;
      const isImage = asset.mimeType?.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(originalName);
      let uri = asset.uri;
      if (isImage) {
        const optimized = await optimizeImageForUpload(uri, { maxWidth: 1600, quality: 0.78 });
        uri = optimized?.uri || uri;
      }
      const fileName = isImage ? `${originalName.replace(/\.[^.]+$/, '') || 'application-cv'}.jpg` : originalName;
      const mimeType = isImage ? 'image/jpeg' : (asset.mimeType || 'application/pdf');
      const formData = new FormData();
      formData.append('file', { uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri, name: fileName, type: mimeType });
      const response = await api.post('/upload/proposal', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
      const url = response.data?.url || response.data?.data?.url;
      if (!url) throw new Error(t('jobs.uploadFailed', 'Failed to upload file.'));
      setSelectedCv({ url, name: fileName, type: mimeType, source: 'upload' });
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || error.message || t('jobs.uploadFailed', 'Failed to upload file.'));
    } finally {
      setUploading(false);
    }
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.[0]) await uploadCv(result.assets[0]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.9 });
    if (!result.canceled && result.assets?.[0]) await uploadCv(result.assets[0]);
  };

  const useProfileCv = () => {
    if (user?.cvUrl) setSelectedCv({ url: user.cvUrl, name: user.cvName || t('jobs.savedProfileCv'), source: 'profile' });
  };

  const submit = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert(t('common.error'), t('jobs.externalApplicantRequired', 'Enter your name and email address.'));
      return;
    }
    const missingQuestion = missingRequiredAnswer(job.applicationQuestions || [], screeningAnswers);
    if (missingQuestion) {
      Alert.alert(t('jobs.answerRequired', 'Answer required'), missingQuestion.prompt);
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/external-jobs/${job.id}/apply`, {
        applicantName: name.trim(), applicantEmail: email.trim(), applicantPhone: phone.trim(),
        coverLetter: coverLetter.trim(), cvUrl: selectedCv?.url || null, cvName: selectedCv?.name || null, screeningAnswers,
      });
      if (job?.id) markJobApplied?.(job.id);
      if (route.params?.onApplied && job?.id) route.params.onApplied(job.id);
      Alert.alert(t('common.success'), t('jobs.externalApplicationSent', 'Your application was sent successfully.'), [
        { text: t('common.done', 'Done'), onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('jobs.applicationSendFailed', 'Unable to send your application.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: colors.card }]}><MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={[styles.title, { color: colors.text }]}>{t('jobs.submitApplication', 'Submit Application')}</Text><Text style={{ color: colors.textSecondary }} numberOfLines={1}>{job.title}</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: colors.text }]}>{t('jobs.fullName', 'Full name')}</Text><TextInput value={name} onChangeText={setName} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.text }]}>{t('common.email', 'Email')}</Text><TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.text }]}>{t('common.phone', 'Phone')}</Text><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.text }]}>{t('jobs.coverLetterLabel')}</Text><TextInput value={coverLetter} onChangeText={setCoverLetter} multiline placeholder={t('jobs.coverLetterPlaceholder')} placeholderTextColor={colors.textSecondary} style={[styles.input, styles.area, { color: colors.text, borderColor: colors.border }]} />

        <Text style={[styles.label, { color: colors.text }]}>{t('jobs.applicationCvOptional')}</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('jobs.applicationCvPrivacyHint')}</Text>
        {user?.cvUrl && selectedCv?.source !== 'profile' ? <TouchableOpacity onPress={useProfileCv} style={[styles.choice, { borderColor: colors.border, backgroundColor: colors.card }]}><MaterialCommunityIcons name="file-account-outline" size={23} color={colors.accent} /><View style={{ flex: 1 }}><Text style={[styles.choiceTitle, { color: colors.text }]}>{t('jobs.useSavedProfileCv')}</Text><Text style={{ color: colors.textSecondary }} numberOfLines={1}>{user.cvName || t('jobs.savedProfileCv')}</Text></View></TouchableOpacity> : null}
        <View style={styles.choiceRow}>
          <TouchableOpacity disabled={uploading} onPress={pickPdf} style={[styles.uploadChoice, { borderColor: colors.accent }]}><MaterialCommunityIcons name="file-pdf-box" size={22} color={colors.accent} /><Text style={[styles.uploadText, { color: colors.accent }]}>{t('jobs.uploadCvPdf')}</Text></TouchableOpacity>
          <TouchableOpacity disabled={uploading} onPress={pickImage} style={[styles.uploadChoice, { borderColor: colors.accent }]}><MaterialCommunityIcons name="image-outline" size={22} color={colors.accent} /><Text style={[styles.uploadText, { color: colors.accent }]}>{t('jobs.uploadCvPhoto')}</Text></TouchableOpacity>
        </View>
        {uploading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 14 }} /> : null}
        {selectedCv ? <View style={[styles.selected, { borderColor: colors.border, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}><MaterialCommunityIcons name="file-check-outline" size={24} color="#10B981" /><View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: '800' }} numberOfLines={1}>{selectedCv.name}</Text><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{selectedCv.source === 'profile' ? t('jobs.profileCvSelected') : t('jobs.uploadedCvSelected')}</Text></View><TouchableOpacity onPress={() => setSelectedCv(null)}><MaterialCommunityIcons name="close-circle" size={22} color="#EF4444" /></TouchableOpacity></View> : null}

        <ScreeningQuestionFields questions={job.applicationQuestions || []} answers={screeningAnswers} onChange={setScreeningAnswers} />

        <TouchableOpacity disabled={submitting || uploading} onPress={submit} style={[styles.submit, { backgroundColor: colors.accent, opacity: submitting || uploading ? 0.65 : 1 }]}>{submitting ? <ActivityIndicator color="#FFF" /> : <><MaterialCommunityIcons name="send" size={20} color="#FFF" /><Text style={styles.submitText}>{t('jobs.submitApplication', 'Submit Application')}</Text></>}</TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderBottomWidth: 1 }, back: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 20, fontWeight: '900' }, content: { padding: 20, paddingBottom: 50 }, label: { fontSize: 14, fontWeight: '800', marginTop: 18, marginBottom: 7 }, hint: { fontSize: 12, lineHeight: 18, marginBottom: 10 }, input: { minHeight: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, fontSize: 15 }, area: { minHeight: 130, paddingTop: 12, textAlignVertical: 'top' }, choice: { minHeight: 66, borderWidth: 1, borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }, choiceTitle: { fontWeight: '800', marginBottom: 3 }, choiceRow: { flexDirection: 'row', gap: 10 }, uploadChoice: { flex: 1, minHeight: 70, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 5, padding: 8 }, uploadText: { fontSize: 12, fontWeight: '800', textAlign: 'center' }, selected: { marginTop: 12, borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, submit: { height: 56, borderRadius: 12, marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, submitText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});

export default ExternalJobApplicationScreen;
