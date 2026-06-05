import React from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  StatusBar, ImageBackground, Dimensions, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

const { width, height } = Dimensions.get('window');

const RoleSelectionScreen = ({ navigation }) => {
  const { t } = useLanguage();

  const handleSelectRole = (role) => {
    navigation.navigate('Register', { role });
  };

  return (
    <ImageBackground 
      source={require('../../../assets/select.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={styles.overlay}>
        <View style={styles.topSpacer} />

        <ScrollView 
          style={styles.scrollWrapper}
          contentContainerStyle={styles.contentPanel}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text style={styles.title}>{t('roleSelection.title')}</Text>
          <Text style={styles.subtitle}>{t('roleSelection.subtitle')}</Text>
          <View style={styles.optionsContainer}>
          
          {/* Hiring Option */}
          <TouchableOpacity 
            style={styles.optionCard} 
            onPress={() => handleSelectRole('client')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardContent, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <View style={styles.roleIcon}><MaterialCommunityIcons name="account-search-outline" size={26} color="#FFF" /></View>
              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>{t('roleSelection.hireTitle')}</Text>
                <Text style={styles.cardSubtitle}>{t('roleSelection.hireDesc')}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#FFF" />
            </View>
          </TouchableOpacity>

          {/* Service Provider Option */}
          <TouchableOpacity 
            style={styles.optionCard} 
            onPress={() => handleSelectRole('provider')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardContent, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <View style={styles.roleIcon}><MaterialCommunityIcons name="toolbox-outline" size={26} color="#FFF" /></View>
              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>{t('roleSelection.workTitle')}</Text>
                <Text style={styles.cardSubtitle}>{t('roleSelection.workDesc')}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#FFF" />
            </View>
          </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>{t('roleSelection.already')} <Text style={styles.loginTextStrong}>{t('roleSelection.login')}</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: width, height: height },
  overlay: { flex: 1, backgroundColor: 'rgba(3,7,18,0.22)', justifyContent: 'space-between' },
  topSpacer: { flex: 1, minHeight: height * 0.35, alignItems: 'center', paddingTop: height * 0.08 },
  scrollWrapper: { flexGrow: 0 },
  contentPanel: { 
    paddingHorizontal: 22, 
    paddingTop: 28, 
    paddingBottom: 40, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.16)',
    minHeight: height * 0.5
  },
  title: { fontSize: 32, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.82)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  optionsContainer: { gap: 14 },
  optionCard: { overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.22)' },
  cardContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 12 },
  roleIcon: { width: 46, height: 46, backgroundColor: 'rgba(30,103,209,0.72)', alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 5 },
  cardSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 18 },
  loginLink: { marginTop: 24, marginBottom: 10, alignItems: 'center' },
  loginText: { color: 'rgba(255,255,255,0.78)', fontSize: 14 },
  loginTextStrong: { color: '#FFF', fontWeight: '900', textDecorationLine: 'underline' },
});

export default RoleSelectionScreen;
