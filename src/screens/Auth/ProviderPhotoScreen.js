import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  StatusBar, ScrollView, Dimensions,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const ProviderPhotoScreen = ({ navigation, route }) => {
  const { isDarkMode, colors } = useTheme();
  const [photoUploaded, setPhotoUploaded] = useState(false);

  const handleFinish = () => {
    if (!photoUploaded) {
      alert("Please upload a profile photo to complete your professional profile.");
      return;
    }
    navigation.navigate('PostRegistrationOnboarding', {
      role: 'provider',
      userData: route.params?.userData,
    });
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
            <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFF' : colors.text }]}>Profile Picture</Text>
            <Text style={[styles.cardDesc, { color: isDarkMode ? 'rgba(255,255,255,0.85)' : colors.textSecondary }]}>Upload a professional photo to build trust with your future clients.</Text>

            <View style={styles.photoSection}>
              <View style={[styles.photoOutline, photoUploaded && { borderColor: colors.accent }]}>
                <TouchableOpacity
                  style={[styles.photoContainer, photoUploaded && { backgroundColor: colors.accent }]}
                  onPress={() => setPhotoUploaded(!photoUploaded)}
                >
                  <MaterialCommunityIcons
                    name={photoUploaded ? "account-check" : "account"}
                    size={100}
                    color={photoUploaded ? "#FFF" : colors.placeholder}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.accent, borderColor: isDarkMode ? '#191E28' : colors.card }]} onPress={() => setPhotoUploaded(!photoUploaded)}>
                  <MaterialCommunityIcons name={photoUploaded ? "check" : "camera"} size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.finishBtn, { backgroundColor: colors.accent }]} onPress={handleFinish}>
              <Text style={styles.finishBtnText}>Complete Registration</Text>
            </TouchableOpacity>

            <Text style={[styles.infoText, { color: colors.textSecondary }]}>You can always change your photo later in settings.</Text>
          </View>

        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: width, height: height },
  overlay: { flex: 1 },
  scrollContent: { paddingHorizontal: 25, paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  logoContainer: { marginBottom: 40 },
  logoText: { fontSize: 34, fontWeight: '700', letterSpacing: 2 },
  card: {
    width: '100%',
    borderRadius: 30,
    padding: 35,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 15 },
  cardDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  photoSection: { marginBottom: 45 },
  photoOutline: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  editBtn: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  finishBtn: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  finishBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  infoText: { fontSize: 12, textAlign: 'center' },
});

export default ProviderPhotoScreen;
