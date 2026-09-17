import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    titleKey: 'onboarding.slide1Title',
    descKey: 'onboarding.slide1Desc',
    accent: '#0D9488',
    image: require('../../../assets/onboarding/experts.png'),
  },
  {
    id: '2',
    titleKey: 'onboarding.slide2Title',
    descKey: 'onboarding.slide2Desc',
    accent: '#14B8A6',
    image: require('../../../assets/onboarding/verified.png'),
  },
  {
    id: '3',
    titleKey: 'onboarding.slide3Title',
    descKey: 'onboarding.slide3Desc',
    accent: '#0D9488',
    image: require('../../../assets/onboarding/payment.png'),
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems[0]) setCurrentIndex(viewableItems[0].index);
  }).current;
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const goTo = (index) => {
    if (index < 0 || index >= SLIDES.length) return;
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      goTo(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => navigation.replace('Login');

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <LinearGradient
        colors={['#0D9488', '#14B8A6', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <View style={styles.colorPanel}>
          <Image source={item.image} style={styles.panelImage} resizeMode="contain" />
        </View>
        <View style={styles.copyWrap}>
          <View style={[styles.kicker, { borderColor: item.accent }]}>
            <Text style={styles.kickerText}>FIXAM</Text>
          </View>
          <Text style={styles.title}>{t(item.titleKey)}</Text>
          <Text style={styles.desc}>{t(item.descKey)}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
      />

      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.8}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {SLIDES.map((slide, index) => (
              <View
                key={slide.id}
                style={[
                  styles.dot,
                  currentIndex === index && [styles.dotActive, { backgroundColor: slide.accent }],
                ]}
              />
            ))}
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
              onPress={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              activeOpacity={0.85}
            >
              <MaterialIcons name="arrow-back" size={20} color="#FFF" />
              <Text style={styles.navText}>{t('onboarding.previous')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButtonPrimary} onPress={handleNext} activeOpacity={0.9}>
              <Text style={styles.navText}>{currentIndex === SLIDES.length - 1 ? t('onboarding.getStarted') : t('onboarding.next')}</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D9488' },
  slide: { width, flex: 1 },
  background: { flex: 1, justifyContent: 'flex-end' },
  colorPanel: {
    position: 'absolute',
    top: '12%',
    alignSelf: 'center',
    width: width * 0.9,
    height: width * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelImage: {
    width: '100%',
    height: '100%',
  },
  copyWrap: {
    paddingHorizontal: 24,
    paddingBottom: 158,
  },
  kicker: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 14,
  },
  kickerText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: {
    color: '#FFF',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    maxWidth: 330,
  },
  desc: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    marginTop: 12,
    maxWidth: 330,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginRight: 18,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  skipText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  footer: { paddingHorizontal: 18, paddingBottom: 20 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.42)' },
  dotActive: { width: 28 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  navButton: {
    minWidth: 128,
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(15,23,42,0.54)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  navButtonDisabled: { opacity: 0.35 },
  navButtonPrimary: {
    minWidth: 128,
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
  },
  navText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
});

export default OnboardingScreen;
