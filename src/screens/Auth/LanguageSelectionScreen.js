import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ImageBackground, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useLanguage } from '../../context/LanguageContext';

const { width, height } = Dimensions.get('window');

const LanguageSelectionScreen = ({ navigation }) => {
  const { changeLanguage, t } = useLanguage();

  const handleSelectLanguage = async (lang) => {
    await changeLanguage(lang);
    navigation.replace('Onboarding');
  };

  return (
    <ImageBackground 
      source={require('../../../assets/language_bg.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      
      
      <View style={styles.shade}>
        <View style={styles.logoSpace} />

        <View style={styles.content}>
          <Text style={styles.kicker}>{t('languageSelection.title')}</Text>
          <Text style={styles.title}>Fixam</Text>
        
          <TouchableOpacity style={styles.langBtn} activeOpacity={0.86} onPress={() => handleSelectLanguage('en')}>
            <View style={styles.langIcon}>
              <Text style={styles.flagText}>🇬🇧</Text>
            </View>
            <View style={styles.langCopy}>
              <Text style={styles.langText}>{t('languageSelection.english')}</Text>
              <Text style={styles.langSub}>{t('languageSelection.english')}</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        
          <TouchableOpacity style={styles.langBtn} activeOpacity={0.86} onPress={() => handleSelectLanguage('fr')}>
            <View style={styles.langIcon}>
              <Text style={styles.flagText}>🇫🇷</Text>
            </View>
            <View style={styles.langCopy}>
              <Text style={styles.langText}>{t('languageSelection.french')}</Text>
              <Text style={styles.langSub}>{t('languageSelection.french')}</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  shade: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.28)',
    justifyContent: 'space-between',
  },
  logoSpace: { height: height * 0.48, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 58 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    backgroundColor: 'rgba(3, 7, 18, 0.54)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  kicker: { fontSize: 13, fontWeight: '700', color: '#BFD7FF', textAlign: 'center', marginBottom: 8, textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 20, lineHeight: 32 },
  langBtn: { 
    backgroundColor: 'rgba(255, 255, 255, 0.13)', 
    borderBottomWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.22)', 
    borderRadius: 0, 
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12, 
    alignItems: 'center',
    flexDirection: 'row',
  },
  langIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  flagText: { fontSize: 22 },
  langCopy: { flex: 1 },
  langText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  langSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.64)', marginTop: 2 },
});

export default LanguageSelectionScreen;
