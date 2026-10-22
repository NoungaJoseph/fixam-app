import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const { height } = Dimensions.get('window');

const LanguageSelectionScreen = ({ navigation }) => {
  const { changeLanguage, t } = useLanguage();
  const { isDarkMode } = useTheme();

  const handleSelectLanguage = async (lang) => {
    await changeLanguage(lang);
    navigation.replace('Onboarding');
  };

  const languages = [
    { id: 'en', code: 'EN', title: t('languageSelection.english'), nativeName: 'English' },
    { id: 'fr', code: 'FR', title: t('languageSelection.french'), nativeName: 'Français' },
  ];

  return (
    <ImageBackground source={require('../../../assets/language_bg.jpg')} style={styles.container} resizeMode="cover">
      <View style={[styles.shade, isDarkMode && styles.shadeDark]}>
        <View style={styles.topBrand}><View style={styles.brandBadge}><Text style={styles.brandText}>FIXAM</Text></View></View>
        <View style={styles.logoSpace} />
        <View style={styles.content}>
          <View style={styles.handle} />
          <Text style={styles.kicker}>FIXAM</Text>
          <Text style={styles.title}>{t('languageSelection.title')}</Text>
          <Text style={styles.subtitle}>{t('languageSelection.subtitle', 'Choose the language you are most comfortable with.')}</Text>
          {languages.map((language) => (
            <TouchableOpacity key={language.id} style={styles.langBtn} activeOpacity={0.86} onPress={() => handleSelectLanguage(language.id)} accessibilityRole="button" accessibilityLabel={language.title}>
              <View style={styles.langIcon}><Text style={styles.languageCode}>{language.code}</Text></View>
              <View style={styles.langCopy}>
                <Text style={styles.langText}>{language.title}</Text>
                <Text style={styles.langSub}>{language.nativeName}</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color="rgba(255,255,255,0.78)" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  shade: { flex: 1, backgroundColor: 'rgba(3,7,18,0.34)', justifyContent: 'space-between' },
  shadeDark: { backgroundColor: 'rgba(2,6,23,0.5)' },
  topBrand: { position: 'absolute', top: 54, left: 24, zIndex: 2 },
  brandBadge: { height: 34, paddingHorizontal: 12, borderRadius: 9, justifyContent: 'center', backgroundColor: 'rgba(3,7,18,0.52)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  brandText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  logoSpace: { height: height * 0.43 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 34, backgroundColor: 'rgba(4,10,22,0.92)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)' },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.28)', alignSelf: 'center', marginBottom: 20 },
  kicker: { fontSize: 11, fontWeight: '900', color: '#5EEAD4', marginBottom: 8, letterSpacing: 1.8 },
  title: { fontSize: 29, fontWeight: '900', color: '#FFFFFF', marginBottom: 8, lineHeight: 35, letterSpacing: -0.4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 21, marginBottom: 22 },
  langBtn: { height: 66, backgroundColor: 'rgba(15,23,42,0.78)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)', borderRadius: 12, paddingHorizontal: 14, marginBottom: 12, alignItems: 'center', flexDirection: 'row' },
  langIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(45,212,191,0.13)', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  languageCode: { color: '#5EEAD4', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  langCopy: { flex: 1 },
  langText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  langSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
});

export default LanguageSelectionScreen;
