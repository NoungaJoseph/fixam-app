import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  findNodeHandle,
  UIManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TOUR_KEY = (uid) => `fixam:provider-tour:${uid || 'guest'}`;

const TOOLTIP_EST_HEIGHT = 145;
const ARROW_SIZE = 10;
const GAP = 12;
const TOOLTIP_PADDING_H = 16;

/**
 * steps: array of { ref, title, text, icon }
 * scrollViewRef: ref to the parent ScrollView so we can auto-scroll
 * scrollOffset: current scroll Y offset (tracked by the parent)
 */
const ProviderTour = ({ steps, userId, visible, onDone, scrollViewRef }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState(null); // { x, y, w, h }
  const [ready, setReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tooltipAnim = useRef(new Animated.Value(0)).current;
  const retryCount = useRef(0);

  /**
   * Scroll the target element into view, then measure its position.
   * Uses measureInWindow so we get screen-absolute coordinates.
   */
  const scrollAndMeasure = useCallback((index) => {
    const current = steps[index];
    if (!current?.ref?.current) {
      setSpotlight(null);
      setReady(true);
      return;
    }

    const doMeasure = () => {
      // Small delay after scroll to let layout settle
      setTimeout(() => {
        if (!current?.ref?.current) {
          setSpotlight(null);
          setReady(true);
          return;
        }
        current.ref.current.measureInWindow((x, y, w, h) => {
          // If measurement returns 0s or element is still off-screen, retry a few times
          if ((w === 0 && h === 0) || y > SCREEN_H || y + h < 0) {
            if (retryCount.current < 5) {
              retryCount.current += 1;
              setTimeout(() => doMeasure(), 200);
              return;
            }
          }
          retryCount.current = 0;
          setSpotlight({ x, y, w, h });
          setReady(true);
        });
      }, 150);
    };

    // First try to scroll the element into view using scrollTo
    if (scrollViewRef?.current) {
      const node = findNodeHandle(current.ref.current);
      const scrollNode = findNodeHandle(scrollViewRef.current);
      if (node && scrollNode) {
        UIManager.measureLayout(
          node,
          scrollNode,
          () => {
            // measureLayout failed, just measure in window directly
            doMeasure();
          },
          (_x, relY, _w, relH) => {
            // Scroll so the element is roughly centered vertically
            const targetScrollY = Math.max(0, relY - SCREEN_H / 3);
            scrollViewRef.current.scrollTo({ y: targetScrollY, animated: true });
            // Give the scroll animation time to finish
            setTimeout(doMeasure, 450);
          }
        );
        return;
      }
    }

    // No scrollViewRef, just measure directly
    doMeasure();
  }, [steps, scrollViewRef]);

  useEffect(() => {
    if (visible) {
      setStep(0);
      setReady(false);
      setSpotlight(null);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
      tooltipAnim.setValue(0);
      setSpotlight(null);
      setReady(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && steps.length > 0) {
      tooltipAnim.setValue(0);
      setReady(false);
      retryCount.current = 0;
      // Small delay to let screen settle before scrolling + measuring
      const timer = setTimeout(() => {
        scrollAndMeasure(step);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [visible, step, scrollAndMeasure]);

  // Animate tooltip in once ready
  useEffect(() => {
    if (ready) {
      Animated.spring(tooltipAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [ready]);

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

  // Tooltip positioning
  const getTooltipLayout = () => {
    const tooltipW = Math.min(SCREEN_W - 32, 280);

    if (!spotlight) {
      return {
        top: SCREEN_H / 2 - 70,
        left: 16,
        width: tooltipW,
        tooltipBelow: true,
        arrowLeft: tooltipW / 2 - ARROW_SIZE,
      };
    }

    const { x, y, w, h } = spotlight;

    // Decide above vs. below
    const spaceBelow = SCREEN_H - (y + h);
    const spaceAbove = y;
    const tooltipBelow = spaceBelow >= TOOLTIP_EST_HEIGHT + GAP || spaceBelow >= spaceAbove;

    let top;
    if (tooltipBelow) {
      top = y + h + GAP;
    } else {
      top = Math.max(8, y - TOOLTIP_EST_HEIGHT - GAP);
    }

    // Clamp top to screen
    top = Math.max(8, Math.min(top, SCREEN_H - TOOLTIP_EST_HEIGHT - 8));

    // Horizontal: try to center tooltip on the spotlight element
    let left = x + w / 2 - tooltipW / 2;
    left = Math.max(TOOLTIP_PADDING_H, Math.min(left, SCREEN_W - tooltipW - TOOLTIP_PADDING_H));

    // Arrow should point at the center of the spotlight element
    const elementCenterX = x + w / 2;
    let arrowLeft = elementCenterX - left - ARROW_SIZE;
    // Clamp arrow within tooltip bounds (with some padding)
    arrowLeft = Math.max(14, Math.min(arrowLeft, tooltipW - 28));

    return { top, left, width: tooltipW, tooltipBelow, arrowLeft };
  };

  const layout = getTooltipLayout();

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
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={finish}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Dark overlay */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none" />

        {/* Spotlight highlight ring */}
        {highlightStyle && <View style={highlightStyle} pointerEvents="none" />}

        {/* Tooltip box */}
        <Animated.View
          style={[
            styles.tooltip,
            { backgroundColor: colors.card },
            {
              top: layout.top,
              left: layout.left,
              width: layout.width,
            },
            {
              opacity: tooltipAnim,
              transform: [
                {
                  translateY: tooltipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layout.tooltipBelow ? 12 : -12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Arrow pointing UP toward element (tooltip is below element) */}
          {spotlight && layout.tooltipBelow && (
            <View
              style={[
                styles.arrowUp,
                { borderBottomColor: colors.card, left: layout.arrowLeft },
              ]}
            />
          )}
          {/* Arrow pointing DOWN toward element (tooltip is above element) */}
          {spotlight && !layout.tooltipBelow && (
            <View
              style={[
                styles.arrowDown,
                { borderTopColor: colors.card, left: layout.arrowLeft },
              ]}
            />
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
    top: -ARROW_SIZE,
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowDown: {
    position: 'absolute',
    bottom: -ARROW_SIZE,
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
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
