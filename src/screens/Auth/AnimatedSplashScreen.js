import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');
const LOGO_TEXT = 'Fixam';
const LOGO_WIDTH = Math.min(width - 56, 300);
const LOGO_HEIGHT = 92;
const DRAW_DURATION = 2400;

const AnimatedSplashScreen = ({ navigation, onFinish }) => {
  const drawProgress = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;
  const { t } = useLanguage();

  const revealWidth = useMemo(
    () => drawProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, LOGO_WIDTH],
      extrapolate: 'clamp',
    }),
    [drawProgress]
  );

  useEffect(() => {
    const drawAnimation = Animated.timing(drawProgress, {
      toValue: 1,
      duration: DRAW_DURATION,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });

    const exitAnimation = Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(containerScale, {
        toValue: 1.08,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]);

    const introAnimation = onFinish
      ? Animated.loop(
        Animated.sequence([
          drawAnimation,
          Animated.delay(680),
          Animated.timing(drawProgress, { toValue: 0, duration: 0, useNativeDriver: false }),
          Animated.delay(160),
        ])
      )
      : Animated.sequence([
        drawAnimation,
        Animated.delay(760),
        exitAnimation,
      ]);

    introAnimation.start(() => {
      if (!onFinish) {
        navigation?.replace('LanguageSelection');
      }
    });

    return () => {
      introAnimation.stop();
      drawProgress.stopAnimation();
      containerOpacity.stopAnimation();
      containerScale.stopAnimation();
    };
  }, [containerOpacity, containerScale, drawProgress, navigation, onFinish]);

  return (
    <LinearGradient
      colors={['#0D9488', '#14B8A6', '#2563EB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.main}
    >
      
      <Animated.View
        style={[
          styles.container,
          {
            opacity: containerOpacity,
            transform: [{ scale: containerScale }],
          },
        ]}
      >
        <Text style={{
          fontSize: 48,
          fontWeight: '800',
          color: '#FFFFFF',
          letterSpacing: 3
        }}>
          Fixam
        </Text>
        
        <Text style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.8)',
          marginTop: 8,
          letterSpacing: 1,
          fontStyle: 'italic'
        }}>
          {t('splash.subtitle', 'Services at your doorstep')}
        </Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoStage: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    justifyContent: 'center',
    overflow: 'visible',
  },
  logoText: {
    width: LOGO_WIDTH,
    color: '#FFFFFF',
    fontSize: 70,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: LOGO_HEIGHT,
    textAlign: 'center',
    includeFontPadding: false,
  },
  logoGhost: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.14)',
  },
  logoReveal: {
    height: LOGO_HEIGHT,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 12,
    width: 46,
    height: LOGO_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  pen: {
    position: 'absolute',
    left: 0,
    bottom: 10,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  penTip: {
    position: 'absolute',
    right: 4,
    bottom: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F8FAFC',
  },
  underlineTrack: {
    width: LOGO_WIDTH,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    marginTop: 8,
  },
  underlineFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});

export default AnimatedSplashScreen;
