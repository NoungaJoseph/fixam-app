import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';

const DocUploadScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { docType } = route.params || {};
  const isTwoSided = docType?.sides === 2;

  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);



  const pickImage = async (side) => {
    Alert.alert(
      side === 'front' ? 'Upload Front Side' : 'Upload Back Side',
      'How would you like to add the image?',
      [
        {
          text: 'Take a Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') { Alert.alert('Permission required', 'Camera access is needed.'); return; }
            const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false });
            if (!result.canceled) {
              if (side === 'front') setFrontImage(result.assets[0].uri);
              else setBackImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Upload from Device',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: false, mediaTypes: ImagePicker.MediaTypeOptions.Images });
            if (!result.canceled) {
              if (side === 'front') setFrontImage(result.assets[0].uri);
              else setBackImage(result.assets[0].uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const canContinue = frontImage && (isTwoSided ? backImage : true);

  const handleContinue = () => {
    if (!canContinue) {
      Alert.alert('Missing Document', isTwoSided ? 'Please upload both sides of your document.' : 'Please upload your document.');
      return;
    }
    navigation.navigate('Selfie', { docType, frontImage, backImage });
  };

  const UploadBox = ({ side, image, label, instruction }) => (
    <View style={styles.uploadSection}>
      <Text style={[styles.uploadLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.uploadInstruction, { color: colors.textSecondary }]}>{instruction}</Text>
      <TouchableOpacity
        style={[styles.uploadBox, { borderColor: image ? colors.accent : colors.border, backgroundColor: colors.card }]}
        onPress={() => pickImage(side)}
      >
        {image ? (
          <View style={styles.imagePreviewWrap}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <TouchableOpacity style={[styles.retakeBtn, { backgroundColor: colors.accent }]} onPress={() => pickImage(side)}>
              <MaterialCommunityIcons name="camera-retake" size={16} color="#FFF" />
              <Text style={styles.retakeBtnText}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.uploadIconCircle, { backgroundColor: isDarkMode ? colors.surface : '#EEF4FF' }]}>
              <MaterialCommunityIcons name="camera-plus-outline" size={32} color={colors.accent} />
            </View>
            <Text style={[styles.uploadBoxTitle, { color: colors.text }]}>Tap to upload</Text>
            <Text style={[styles.uploadBoxHint, { color: colors.textSecondary }]}>Take a photo or upload from device</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View 
      style={[styles.background, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{docType?.title || 'Upload Document'}</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress */}
          <View style={styles.progressRow}>
            {[1, 2, 3].map(step => (
              <View key={step} style={styles.progressItem}>
                <View style={[styles.progressDot, { backgroundColor: step <= 1 ? colors.accent : colors.border }]}>
                  {step < 1 ? (
                    <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                  ) : (
                    <Text style={[styles.progressNum, { color: step <= 1 ? '#FFF' : colors.textSecondary }]}>{step}</Text>
                  )}
                </View>
                <Text style={[styles.progressLabel, { color: step <= 1 ? colors.accent : colors.textSecondary }]}>
                  {step === 1 ? 'Document' : step === 2 ? 'Selfie' : 'Done'}
                </Text>
                {step < 3 && <View style={[styles.progressLine, { backgroundColor: colors.border }]} />}
              </View>
            ))}
          </View>

          <UploadBox
            side="front"
            image={frontImage}
            label={isTwoSided ? '📸 Front Side' : '📸 Document Page'}
            instruction={
              isTwoSided
                ? 'Place the front of your document on a flat surface in good light. Make sure all four corners are visible and the text is clearly readable.'
                : docType?.id === 'passport'
                ? 'Open your passport to the data page (the page with your photo). Place it on a flat surface and ensure all text is clearly visible.'
                : 'Make sure all text and your photo are clearly visible.'
            }
          />

          {isTwoSided && (
            <UploadBox
              side="back"
              image={backImage}
              label="📸 Back Side"
              instruction="Now flip your document over and photograph the back. Ensure the barcode or chip area is clearly captured without glare."
            />
          )}

          {/* Tips */}
          <View style={[styles.tipsBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>📌 Tips for a great photo</Text>
            {[
              'Use good lighting — avoid shadows and glare',
              'Keep the document flat on a surface',
              'Make sure all 4 corners are visible',
              'Ensure all text is sharp and readable',
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.accent} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: canContinue ? colors.accent : colors.border }]}
            onPress={handleContinue}
          >
            <Text style={styles.continueBtnText}>Continue to Selfie</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
          </TouchableOpacity>
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
  content: { padding: 22, paddingBottom: 42 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  progressItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  progressNum: { fontSize: 14, fontWeight: '800' },
  progressLabel: { fontSize: 12, fontWeight: '700' },
  progressLine: { width: 28, height: 2, borderRadius: 1, marginHorizontal: 4 },
  uploadSection: { marginBottom: 24 },
  uploadLabel: { fontSize: 17, fontWeight: '900', marginBottom: 6 },
  uploadInstruction: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  uploadBox: {
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 22,
    minHeight: 180, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  uploadIconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  uploadBoxTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  uploadBoxHint: { fontSize: 13, textAlign: 'center' },
  imagePreviewWrap: { width: '100%', alignItems: 'center' },
  imagePreview: { width: '100%', height: 200, borderRadius: 16, resizeMode: 'cover' },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
  retakeBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  tipsBox: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 22 },
  tipsTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  tipText: { fontSize: 13, flex: 1, lineHeight: 19 },
  continueBtn: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});

export default DocUploadScreen;
