import React, { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated, StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const ProfileLanguageScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { changeLanguage, t, language } = useLanguage();
  const scale = useRef(new Animated.Value(1)).current;

  const handleSelectLanguage = async (lang) => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.98, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    await changeLanguage(lang);
  };

  const LangOption = ({ langCode, label }) => {
    const isSelected = language === langCode;
    return (
      <TouchableOpacity
        style={[
          styles.langCard,
          {
            backgroundColor: isSelected ? (isDarkMode ? 'rgba(20,184,166,0.14)' : '#ECFDF5') : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => handleSelectLanguage(langCode)}
        activeOpacity={0.82}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.iconWrap, { backgroundColor: isSelected ? colors.primary : (isDarkMode ? '#111827' : '#F1F5F9') }]}>
            <MaterialCommunityIcons name="translate" size={22} color={isSelected ? '#FFFFFF' : colors.primary} />
          </View>
          <Text style={[styles.langText, { color: colors.text }]}>{label}</Text>
        </View>
        <MaterialCommunityIcons name={isSelected ? 'check-circle' : 'checkbox-blank-circle-outline'} size={24} color={isSelected ? colors.primary : colors.placeholder} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.language')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
            {t('settings.languageSubtitle')}
          </Text>

          <LangOption langCode="fr" label={t('languageSelection.french')} />
          <LangOption langCode="en" label={t('languageSelection.english')} />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
  },
  backBtn: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  sectionDesc: { fontSize: 14, marginBottom: 30, lineHeight: 22 },
  langCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 17, paddingHorizontal: 16, borderWidth: 1, borderRadius: 16, marginBottom: 12,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  langText: { fontSize: 16, fontWeight: '700' },
});

export default ProfileLanguageScreen;
