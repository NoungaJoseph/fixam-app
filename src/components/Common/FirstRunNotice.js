import React, { useState } from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

const FirstRunNotice = ({ role, colors, isDarkMode }) => {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);
  const { t } = useLanguage();
  const isProvider = role === 'provider';
  const notices = [
    { icon: 'map-marker-radius-outline', title: t('permissions.locationTitle'), text: t('permissions.locationText') },
    { icon: 'bell-ring-outline', title: t('permissions.notificationTitle'), text: t('permissions.notificationText') },
    {
      icon: isProvider ? 'account-check-outline' : 'shield-check-outline',
      title: t('permissions.safetyTitle'),
      text: isProvider ? t('permissions.safetyTextProvider') : t('permissions.safetyTextClient'),
    },
    { icon: 'cash-check', title: t('permissions.paymentTitle'), text: t('permissions.paymentText') },
  ];
  const current = notices[step];
  const finishStep = () => {
    if (step >= notices.length - 1) {
      setVisible(false);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.topIcon, { backgroundColor: colors.accent }]}>
            <MaterialCommunityIcons name={current.icon} size={28} color="#FFF" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{current.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{current.text}</Text>
          <View style={styles.dots}>
            {notices.map((notice, index) => (
              <View key={notice.title} style={[styles.dot, { backgroundColor: index === step ? colors.accent : colors.border }]} />
            ))}
          </View>

          {step >= 2 ? (
            <TouchableOpacity style={[styles.okBtn, { backgroundColor: colors.accent }]} onPress={finishStep}>
              <Text style={styles.primaryText}>OK</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={finishStep}>
                <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>{t('common.notNow')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={finishStep}>
                <Text style={styles.primaryText}>{t('common.allow')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.62)', justifyContent: 'center', padding: 22 },
  card: { borderRadius: 10, padding: 22, borderWidth: 1 },
  topIcon: { width: 58, height: 58, borderRadius: 10, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  noticeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  noticeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  noticeTitle: { fontSize: 14, fontWeight: '900', marginBottom: 3 },
  noticeText: { fontSize: 12, lineHeight: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 22 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  secondaryBtn: { flex: 1, height: 54, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  secondaryText: { fontSize: 15, fontWeight: '900' },
  primaryBtn: { flex: 1, height: 54, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  okBtn: { width: '100%', height: 54, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
});

export default FirstRunNotice;
