import React from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  StatusBar, ScrollView, Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const ProviderDocUploadScreen = ({ navigation, route }) => {
  const { isDarkMode, colors } = useTheme();
  const [frontUploaded, setFrontUploaded] = React.useState(false);
  const [backUploaded, setBackUploaded] = React.useState(false);

  const handleNext = () => {
    if (!frontUploaded || !backUploaded) {
      alert("Please upload both sides of your ID to continue.");
      return;
    }
    navigation.navigate('ProviderPhoto', { userData: route.params?.userData });
  };

  return (
    <View 
      style={[styles.background, { backgroundColor: colors.background }]}
    >
      
      <View style={[styles.overlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.4)' : 'transparent' }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.logoContainer}>
            <Text style={[styles.logoText, { color: isDarkMode ? '#FFF' : colors.primary }]}>fixam</Text>
          </View>

          <View style={[styles.card, { backgroundColor: isDarkMode ? 'rgba(25, 30, 40, 0.9)' : colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFF' : colors.text }]}>Identity Verification</Text>
            <Text style={[styles.cardDesc, { color: isDarkMode ? 'rgba(255,255,255,0.6)' : colors.textSecondary }]}>To ensure safety and trust, please upload a clear photo of your National ID or Passport.</Text>

            <View style={styles.uploadSection}>
              <Text style={[styles.label, { color: isDarkMode ? 'rgba(255,255,255,0.9)' : colors.text }]}>Front Side of ID</Text>
              <TouchableOpacity
                style={[styles.uploadBox, frontUploaded && { backgroundColor: 'rgba(30, 103, 209, 0.1)', borderColor: colors.accent, borderStyle: 'solid' }]}
                onPress={() => setFrontUploaded(!frontUploaded)}
              >
                <MaterialCommunityIcons
                  name={frontUploaded ? "check-circle" : "camera-plus-outline"}
                  size={40}
                  color={frontUploaded ? colors.accent : colors.placeholder}
                />
                <Text style={[styles.uploadText, frontUploaded && { color: isDarkMode ? '#FFF' : colors.text, fontWeight: '700' }]}>
                  {frontUploaded ? "Front ID Uploaded" : "Click to upload front"}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.label, { color: isDarkMode ? 'rgba(255,255,255,0.9)' : colors.text }]}>Back Side of ID</Text>
              <TouchableOpacity
                style={[styles.uploadBox, backUploaded && { backgroundColor: 'rgba(30, 103, 209, 0.1)', borderColor: colors.accent, borderStyle: 'solid' }]}
                onPress={() => setBackUploaded(!backUploaded)}
              >
                <MaterialCommunityIcons
                  name={backUploaded ? "check-circle" : "camera-plus-outline"}
                  size={40}
                  color={backUploaded ? colors.accent : colors.placeholder}
                />
                <Text style={[styles.uploadText, backUploaded && { color: isDarkMode ? '#FFF' : colors.text, fontWeight: '700' }]}>
                  {backUploaded ? "Back ID Uploaded" : "Click to upload back"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.accent }]} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next: Profile Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipLink} onPress={() => navigation.navigate('ProviderPhoto', { userData: route.params?.userData })}>
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip for now</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: width, height: height },
  overlay: { flex: 1 },
  scrollContent: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  logoContainer: { marginBottom: 30 },
  logoText: { fontSize: 34, fontWeight: '700', letterSpacing: 2 },
  card: {
    width: '100%',
    borderRadius: 30,
    padding: 30,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 15 },
  cardDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 30 },
  uploadSection: { gap: 20, marginBottom: 35 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  uploadBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    height: 140,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  uploadText: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  nextBtn: {
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  skipLink: { alignItems: 'center', marginTop: 15 },
  skipText: { fontSize: 13, textDecorationLine: 'underline' },
});

export default ProviderDocUploadScreen;
