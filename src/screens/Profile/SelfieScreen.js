import React, { useState, useRef } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Alert, Image, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const SelfieScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { uploadFile } = useAuth();
  const { t } = useLanguage();
  const [selfieImage, setSelfieImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const params = route.params || {};



  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('verification.permissionRequired'), t('verification.cameraAccessSelfie'));
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        quality: 0.85,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled) {
        setSelfieImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t('verification.error'), t('verification.camError'));
    }
  };

  const uploadOne = async (uri, label) => {
    const filename = `${label}-${uri.split('/').pop() || Date.now()}.jpg`;
    const formData = new FormData();
    formData.append('file', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: filename,
      type: 'image/jpeg',
    });
    formData.append('type', 'verification');
    const res = await uploadFile(formData);
    return res.url || res.data?.url;
  };

  const handleSubmit = async () => {
    if (!selfieImage) {
      Alert.alert(t('verification.selfieReq'), t('verification.selfieReqDesc'));
      return;
    }
    setSubmitting(true);
    try {
      const uploads = [
        { type: `${params.docType?.id || 'document'}_front`, uri: params.frontImage },
        params.backImage ? { type: `${params.docType?.id || 'document'}_back`, uri: params.backImage } : null,
        { type: 'selfie', uri: selfieImage },
      ].filter(Boolean);

      for (const item of uploads) {
        const url = await uploadOne(item.uri, item.type);
        await api.post('/providers/verify', { type: item.type, url });
      }
      navigation.navigate('VerificationSuccess');
    } catch (error) {
      Alert.alert(t('verification.submitFailed'), error.response?.data?.message || t('verification.submitFailedDesc'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View 
      style={[styles.background, { backgroundColor: colors.background }]}
    >
      
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('verification.takeSelfie')}</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.content}>
            {/* Progress */}
            <View style={styles.progressRow}>
              {[1, 2, 3].map(step => (
                <View key={step} style={styles.progressItem}>
                  <View style={[styles.progressDot, { backgroundColor: step <= 2 ? colors.accent : colors.border }]}>
                    {step < 2 ? (
                      <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                    ) : (
                      <Text style={[styles.progressNum, { color: step <= 2 ? '#FFF' : colors.textSecondary }]}>{step}</Text>
                    )}
                  </View>
                  <Text style={[styles.progressLabel, { color: step <= 2 ? colors.accent : colors.textSecondary }]}>
                    {step === 1 ? t('verification.document') : step === 2 ? t('verification.selfie') : t('common.done')}
                  </Text>
                  {step < 3 && <View style={[styles.progressLine, { backgroundColor: step < 2 ? colors.accent : colors.border }]} />}
                </View>
              ))}
            </View>

            <Text style={[styles.title, { color: colors.text }]}>{t('verification.takeSelfie')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('verification.selfieInstructions')}
            </Text>

            {/* Selfie area */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.selfieCircle, { borderColor: selfieImage ? colors.accent : colors.border, backgroundColor: colors.card }]}
              onPress={takeSelfie}
            >
              {selfieImage ? (
                <Image source={{ uri: selfieImage }} style={styles.selfieImg} />
              ) : (
                <View style={styles.selfiePlaceholder}>
                  <MaterialCommunityIcons name="face-recognition" size={56} color={colors.placeholder} />
                  <Text style={[styles.selfiePlaceholderText, { color: colors.textSecondary }]}>{t('verification.tapToTake')}</Text>
                </View>
              )}
            </TouchableOpacity>

            {selfieImage && (
              <TouchableOpacity style={styles.retakeLink} onPress={takeSelfie}>
                <MaterialCommunityIcons name="camera-retake" size={18} color={colors.accent} />
                <Text style={[styles.retakeLinkText, { color: colors.accent }]}>{t('verification.retake')}</Text>
              </TouchableOpacity>
            )}

            {/* Instructions */}
            <View style={[styles.tipsBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
              {[
                { icon: 'white-balance-sunny', text: t('verification.selfieTipLight') },
                { icon: 'eye-outline', text: t('verification.selfieTipEye') },
                { icon: 'hat-fedora', text: t('verification.selfieTipHat') },
                { icon: 'face-man-outline', text: t('verification.selfieTipOne') },
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <MaterialCommunityIcons name={tip.icon} size={18} color={colors.accent} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: selfieImage ? colors.accent : colors.border, opacity: submitting ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#FFF" /> : <MaterialCommunityIcons name="send-check" size={20} color="#FFF" />}
              <Text style={styles.submitBtnText}>{submitting ? t('common.loading') : t('verification.submitDocuments')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingBottom: 36 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  progressItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  progressNum: { fontSize: 14, fontWeight: '800' },
  progressLabel: { fontSize: 12, fontWeight: '700' },
  progressLine: { width: 28, height: 2, borderRadius: 1, marginHorizontal: 4 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 28 },
  selfieCircle: {
    width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderStyle: 'dashed',
    alignSelf: 'center', overflow: 'hidden', marginBottom: 12, justifyContent: 'center', alignItems: 'center',
  },
  selfieImg: { width: '100%', height: '100%', borderRadius: 100 },
  selfiePlaceholder: { alignItems: 'center', gap: 10 },
  selfiePlaceholderText: { fontSize: 13, fontWeight: '600' },
  retakeLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginBottom: 20 },
  retakeLinkText: { fontSize: 14, fontWeight: '700' },
  tipsBox: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 24 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  tipText: { fontSize: 13, flex: 1, lineHeight: 19 },
  submitBtn: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});

export default SelfieScreen;
