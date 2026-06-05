import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const guideKey = (userId) => `fixam:first-run-guide:${userId || 'guest'}`;

const FirstRunGuide = ({ user }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  const steps = useMemo(() => ([
    { icon: 'home-search-outline', title: t('guide.findTitle'), text: t('guide.findText') },
    { icon: 'clipboard-plus-outline', title: t('guide.postTitle'), text: t('guide.postText') },
    { icon: 'calendar-check-outline', title: t('guide.bookingTitle'), text: t('guide.bookingText') },
    { icon: 'message-lock-outline', title: t('guide.chatTitle'), text: t('guide.chatText') },
    { icon: 'wallet-outline', title: t('guide.coinsTitle'), text: t('guide.coinsText') },
    { icon: 'shield-check-outline', title: t('guide.verifyTitle'), text: t('guide.verifyText') },
    { icon: 'star-check-outline', title: t('guide.reviewTitle'), text: t('guide.reviewText') },
  ]), [t]);

  useEffect(() => {
    let mounted = true;
    if (!user?.id) return undefined;
    AsyncStorage.getItem(guideKey(user.id))
      .then((seen) => {
        if (mounted && !seen) setVisible(true);
      })
      .catch(() => {
        if (mounted) setVisible(true);
      });
    return () => { mounted = false; };
  }, [user?.id]);

  const finish = async () => {
    setVisible(false);
    setStep(0);
    if (user?.id) {
      await AsyncStorage.setItem(guideKey(user.id), 'seen').catch(() => {});
    }
  };

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={finish}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.topRow}>
            <Text style={[styles.count, { color: colors.textSecondary }]}>{step + 1} / {steps.length}</Text>
            <TouchableOpacity onPress={finish} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? 'rgba(13,148,136,0.14)' : '#E6FDF3' }]}>
            <MaterialCommunityIcons name={current.icon} size={38} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{current.title}</Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>{current.text}</Text>

          <View style={styles.dots}>
            {steps.map((item, index) => (
              <View key={item.icon} style={[styles.dot, index === step && { width: 24, backgroundColor: colors.accent }]} />
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={finish}>
              <Text style={[styles.secondaryText, { color: colors.text }]}>{t('common.skip')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={() => (isLast ? finish() : setStep((value) => value + 1))}
            >
              <Text style={styles.primaryText}>{isLast ? t('common.done') : t('common.continue')}</Text>
              <MaterialCommunityIcons name={isLast ? 'check' : 'arrow-right'} size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.58)', justifyContent: 'center', padding: 24 },
  card: { borderRadius: 8, borderWidth: 1, padding: 22 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  count: { fontSize: 12, fontWeight: '900' },
  closeBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 72, height: 72, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '900', marginBottom: 10 },
  text: { fontSize: 14, lineHeight: 22, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 7, marginTop: 24, marginBottom: 22 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  actions: { flexDirection: 'row', gap: 12 },
  secondaryBtn: { flex: 1, height: 50, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 14, fontWeight: '900' },
  primaryBtn: { flex: 1.35, height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
});

export default FirstRunGuide;
