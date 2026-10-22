import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  StatusBar, ImageBackground, Dimensions, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const RoleSelectionScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleContinue = () => selectedRole && navigation.navigate('Register', { role: selectedRole });

  return (
    <ImageBackground 
      source={require('../../../assets/select.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      
      
      <SafeAreaView style={[styles.overlay, isDarkMode && styles.overlayDark]} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel={t('common.back', 'Back')}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>FIXAM</Text>
          </View>
        </View>

        <View style={styles.topSpacer} />

        <ScrollView 
          style={styles.scrollWrapper}
          contentContainerStyle={styles.contentPanel}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.handle} />
          <Text style={styles.eyebrow}>FIXAM</Text>
          <Text style={styles.title}>{t('roleSelection.title')}</Text>
          <Text style={styles.subtitle}>{t('roleSelection.subtitle')}</Text>
          <View style={styles.optionsContainer}>
          
          {/* Hiring Option */}
          <TouchableOpacity 
            style={[styles.optionCard, selectedRole === 'client' && styles.optionCardSelected]}
            onPress={() => setSelectedRole('client')}
            activeOpacity={0.8}
          >
            <View style={styles.cardContent}>
              <View style={[styles.roleIcon, selectedRole === 'client' && styles.roleIconSelected]}><MaterialCommunityIcons name="account-search-outline" size={25} color={selectedRole === 'client' ? '#FFFFFF' : '#5EEAD4'} /></View>
              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>{t('roleSelection.hireTitle')}</Text>
                <Text style={styles.cardSubtitle}>{t('roleSelection.hireDesc')}</Text>
              </View>
              <MaterialCommunityIcons name={selectedRole === 'client' ? 'check-circle' : 'circle-outline'} size={23} color={selectedRole === 'client' ? '#2DD4BF' : '#64748B'} />
            </View>
          </TouchableOpacity>

          {/* Service Provider Option */}
          <TouchableOpacity 
            style={[styles.optionCard, selectedRole === 'provider' && styles.optionCardSelected]}
            onPress={() => setSelectedRole('provider')}
            activeOpacity={0.8}
          >
            <View style={styles.cardContent}>
              <View style={[styles.roleIcon, selectedRole === 'provider' && styles.roleIconSelected]}><MaterialCommunityIcons name="toolbox-outline" size={25} color={selectedRole === 'provider' ? '#FFFFFF' : '#5EEAD4'} /></View>
              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>{t('roleSelection.workTitle')}</Text>
                <Text style={styles.cardSubtitle}>{t('roleSelection.workDesc')}</Text>
              </View>
              <MaterialCommunityIcons name={selectedRole === 'provider' ? 'check-circle' : 'circle-outline'} size={23} color={selectedRole === 'provider' ? '#2DD4BF' : '#64748B'} />
            </View>
          </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.continueButton, !selectedRole && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!selectedRole}
            activeOpacity={0.86}
          >
            <Text style={styles.continueText}>{t('common.continue', 'Continue')}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>{t('roleSelection.already')} <Text style={styles.loginTextStrong}>{t('roleSelection.login')}</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: width, height: height },
  overlay: { flex: 1, backgroundColor: 'rgba(3,7,18,0.28)', justifyContent: 'space-between' },
  overlayDark: { backgroundColor: 'rgba(2,6,23,0.46)' },
  topBar: { paddingHorizontal: 20, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(3,7,18,0.54)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  brandBadge: { paddingHorizontal: 12, height: 34, borderRadius: 9, justifyContent: 'center', backgroundColor: 'rgba(3,7,18,0.54)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  brandText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  topSpacer: { flex: 1, minHeight: height * 0.25 },
  scrollWrapper: { flexGrow: 0 },
  contentPanel: { 
    paddingHorizontal: 22, 
    paddingTop: 16,
    paddingBottom: 40, 
    backgroundColor: 'rgba(4,10,22,0.92)',
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.16)',
    minHeight: height * 0.56
  },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.28)', alignSelf: 'center', marginBottom: 20 },
  eyebrow: { color: '#5EEAD4', fontSize: 11, fontWeight: '900', letterSpacing: 1.8, marginBottom: 8 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900', color: '#FFF', marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 21, marginBottom: 22 },
  optionsContainer: { gap: 14 },
  optionCard: { overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(148,163,184,0.24)', borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.76)' },
  optionCardSelected: { borderColor: '#2DD4BF', backgroundColor: 'rgba(13,148,136,0.14)' },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 13 },
  roleIcon: { width: 46, height: 46, borderRadius: 11, backgroundColor: 'rgba(45,212,191,0.12)', alignItems: 'center', justifyContent: 'center' },
  roleIconSelected: { backgroundColor: '#0D9488' },
  textWrap: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 5 },
  cardSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 18 },
  continueButton: { height: 54, borderRadius: 10, backgroundColor: '#0D9488', marginTop: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  continueButtonDisabled: { opacity: 0.42 },
  continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  loginLink: { marginTop: 20, marginBottom: 4, alignItems: 'center' },
  loginText: { color: 'rgba(255,255,255,0.78)', fontSize: 14 },
  loginTextStrong: { color: '#FFF', fontWeight: '900', textDecorationLine: 'underline' },
});

export default RoleSelectionScreen;
