import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TOUR_KEY = (uid) => `fixam:provider-tour:${uid || 'guest'}`;

/**
 * steps: array of { ref, title, text, icon, position: 'top'|'bottom' }
 * position is where the tooltip appears relative to the highlighted element
 */
const ProviderTour = ({ steps, userId, visible, onDone }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState(null); // { x, y, w, h }
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tooltipAnim = useRef(new Animated.Value(0)).current;

  const measureStep = (index) => {
    const current = steps[index];
    if (!current?.ref?.current) {
      setSpotlight(null);
      return;
    }
    current.ref.current.measureInWindow((x, y, w, h) => {
      setSpotlight({ x, y, w, h });
    });
  };

  useEffect(() => {
    if (visible) {
      setStep(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
      tooltipAnim.setValue(0);
      setSpotlight(null);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && steps.length > 0) {
      tooltipAnim.setValue(0);
      // Small delay to let screen settle before measuring
      const t = setTimeout(() => {
        measureStep(step);
        Animated.spring(tooltipAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }, 120);
      return () => clearTimeout(t);
    }
  }, [visible, step]);

  const finish = async () => {
    onDone();
    if (userId) {
      await AsyncStorage.setItem(TOUR_KEY(userId), 'seen').catch(() => {});
    }
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  };

  if (!visible || steps.length === 0) return null;

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  // Tooltip positioning: place beside the highlighted element
  const getTooltipStyle = () => {
    if (!spotlight) return { top: SCREEN_H / 2 - 70, left: 16, right: 16 };

    const { x, y, w, h } = spotlight;
    const tooltipW = Math.min(SCREEN_W - 32, 280);
    const gap = 12;

    // Prefer below the element
    const spaceBelow = SCREEN_H - (y + h);
    const spaceAbove = y;

    let top, left;

    if (spaceBelow >= 140 || spaceBelow >= spaceAbove) {
      top = y + h + gap;
    } else {
      top = y - 130 - gap;
    }

    // Horizontally: center on element, clamp to screen
    left = x + w / 2 - tooltipW / 2;
    left = Math.max(16, Math.min(left, SCREEN_W - tooltipW - 16));

    return { top, left, width: tooltipW };
  };

  // Highlight border around the element
  const highlightStyle = spotlight
    ? {
        position: 'absolute',
        left: spotlight.x - 4,
        top: spotlight.y - 4,
        width: spotlight.w + 8,
        height: spotlight.h + 8,
        borderRadius: 12,
        borderWidth: 2.5,
        borderColor: '#0D9488',
        backgroundColor: 'rgba(13,148,136,0.08)',
      }
    : null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={finish}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Dark overlay with hole effect via highlight border */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none" />

        {/* Spotlight highlight ring */}
        {highlightStyle && <View style={highlightStyle} pointerEvents="none" />}

        {/* Tooltip box */}
        <Animated.View
          style={[
            styles.tooltip,
            { backgroundColor: colors.card },
            getTooltipStyle(),
            {
              opacity: tooltipAnim,
              transform: [
                {
                  translateY: tooltipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Arrow pointing up to element if tooltip is below */}
          {spotlight && spotlight.y + spotlight.h < SCREEN_H / 2 + 50 && (
            <View style={[styles.arrowUp, { borderBottomColor: colors.card }]} />
          )}

          <View style={styles.tooltipHeader}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={currentStep.icon} size={18} color="#FFF" />
            </View>
            <Text style={[styles.tooltipTitle, { color: colors.text }]}>{currentStep.title}</Text>
            <TouchableOpacity onPress={finish} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.tooltipText, { color: colors.textSecondary }]}>
            {currentStep.text}
          </Text>

          <View style={styles.tooltipFooter}>
            {/* Step dots */}
            <View style={styles.dotsRow}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === step && { width: 14, backgroundColor: '#0D9488' },
                    i !== step && { backgroundColor: colors.border },
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextText}>{isLast ? t('tour.done') : t('tour.next')}</Text>
              <MaterialCommunityIcons
                name={isLast ? 'check' : 'arrow-right'}
                size={14}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,40,0.6)',
  },
  tooltip: {
    position: 'absolute',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  arrowUp: {
    position: 'absolute',
    top: -8,
    left: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
  },
  tooltipText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  tooltipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0D9488',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  nextText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
});

export default ProviderTour;
