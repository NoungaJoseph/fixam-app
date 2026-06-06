import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const EMOJIS = ['🎉', '🥳', '✨', '🎊', '💪'];

const WelcomeModal = ({ visible, name, role, onDone }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const emojiAnims = useRef(EMOJIS.map(() => new Animated.Value(0))).current;

  const isProvider = role === 'PROVIDER';

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 7 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      Animated.stagger(
        120,
        emojiAnims.map((anim) =>
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.spring(anim, { toValue: 0.85, useNativeDriver: true, tension: 120, friction: 5 }),
          ])
        )
      ).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      emojiAnims.forEach((a) => a.setValue(0));
    }
  }, [visible]);

  const title = isProvider
    ? t('tour.welcomeProviderTitle', { name })
    : t('tour.welcomeClientTitle', { name });

  const body = isProvider
    ? t('tour.welcomeProviderBody')
    : t('tour.welcomeClientBody');

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDone}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[styles.card, { backgroundColor: colors.card, transform: [{ scale: scaleAnim }] }]}
        >
          <View style={styles.emojiRow}>
            {EMOJIS.map((emoji, i) => (
              <Animated.Text
                key={i}
                style={[
                  styles.emoji,
                  {
                    transform: [{
                      scale: emojiAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.3] }),
                    }],
                    opacity: emojiAnims[i],
                  },
                ]}
              >
                {emoji}
              </Animated.Text>
            ))}
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>

          <TouchableOpacity style={styles.btn} onPress={onDone}>
            <Text style={styles.btnText}>{t('tour.takeTour')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDone} style={styles.skipLink}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t('tour.skipNow')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,40,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  emoji: {
    fontSize: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 24,
  },
  btn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 999,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  skipLink: {
    padding: 6,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default WelcomeModal;
