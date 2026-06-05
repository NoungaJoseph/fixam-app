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

const { width } = Dimensions.get('window');
const LOGO_TEXT = 'Fixam';
const LOGO_WIDTH = Math.min(width - 56, 300);
const LOGO_HEIGHT = 92;
const DRAW_DURATION = 2400;

const AnimatedSplashScreen = ({ navigation, onFinish }) => {
  const drawProgress = useRef(new Animated.Value(0)).current;
  const penBob = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;

  const revealWidth = useMemo(
    () => drawProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, LOGO_WIDTH],
      extrapolate: 'clamp',
    }),
    [drawProgress]
  );

  const penX = useMemo(
    () => drawProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [-10, LOGO_WIDTH - 8],
      extrapolate: 'clamp',
    }),
    [drawProgress]
  );

  const penRotate = useMemo(
    () => drawProgress.interpolate({
      inputRange: [0, 0.25, 0.5, 0.75, 1],
      outputRange: ['-24deg', '-12deg', '-20deg', '-8deg', '-18deg'],
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

    const bobAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(penBob, { toValue: -5, duration: 170, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(penBob, { toValue: 3, duration: 150, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(penBob, { toValue: 0, duration: 110, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ])
    );

    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: false }),
        Animated.delay(300),
      ])
    );

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

    bobAnimation.start();
    shimmerAnimation.start();

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
      bobAnimation.stop();
      shimmerAnimation.stop();
      if (!onFinish) {
        navigation?.replace('LanguageSelection');
      }
    });

    return () => {
      introAnimation.stop();
      drawProgress.stopAnimation();
      penBob.stopAnimation();
      shimmer.stopAnimation();
      containerOpacity.stopAnimation();
      containerScale.stopAnimation();
    };
  }, [containerOpacity, containerScale, drawProgress, navigation, onFinish, penBob, shimmer]);

  return (
    <LinearGradient
      colors={['#0D9488', '#14B8A6', '#2563EB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.main}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Animated.View
        style={[
          styles.container,
          {
            opacity: containerOpacity,
            transform: [{ scale: containerScale }],
          },
        ]}
      >
        <View style={styles.logoStage}>
          <Text style={[styles.logoText, styles.logoGhost]}>{LOGO_TEXT}</Text>

          <Animated.View style={[styles.logoReveal, { width: revealWidth }]}>
            <Text style={styles.logoText}>{LOGO_TEXT}</Text>
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.shine,
              {
                transform: [
                  {
                    translateX: shimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-LOGO_WIDTH, LOGO_WIDTH],
                    }),
                  },
                  { rotate: '-12deg' },
                ],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.pen,
              {
                transform: [
                  { translateX: penX },
                  { translateY: penBob },
                  { rotate: penRotate },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons name="pen" size={34} color="#FFFFFF" />
            <View style={styles.penTip} />
          </Animated.View>
        </View>

        <View style={styles.underlineTrack}>
          <Animated.View style={[styles.underlineFill, { width: revealWidth }]} />
        </View>
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
