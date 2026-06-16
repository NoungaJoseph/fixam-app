import SafeAreaView from '../../components/Common/TealSafeAreaView';
import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const TermsPolicyScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();

  const termsSections = t('legal.termsSections', { returnObjects: true });
  const privacySections = t('legal.privacySections', { returnObjects: true });

  return (
    <View
      style={[styles.background, { backgroundColor: colors.background }]}
    >

      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('legal.title')}</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>{t('legal.lastUpdated')}</Text>

          <Text style={[styles.mainSectionTitle, { color: colors.text }]}>{t('legal.termsTitle')}</Text>
          {Array.isArray(termsSections) && termsSections.map((section, index) => (
            <View key={`terms-${index}`} style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>{section.body}</Text>
            </View>
          ))}

          <Text style={[styles.mainSectionTitle, { color: colors.text, marginTop: 40 }]}>{t('legal.privacyTitle')}</Text>
          {Array.isArray(privacySections) && privacySections.map((section, index) => (
            <View key={`privacy-${index}`} style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>{section.body}</Text>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 30 }]}>{t('legal.contact')}</Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 25 },
  lastUpdated: { fontSize: 13, marginBottom: 25 },
  mainSectionTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  sectionContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  text: { fontSize: 15, lineHeight: 24, marginBottom: 5 },
});

export default TermsPolicyScreen;
