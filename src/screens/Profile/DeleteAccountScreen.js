import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const DeleteAccountScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [confirmed, setConfirmed] = useState(false);

  const handleNext = () => {
    if (!confirmed) {
      Alert.alert(t('common.error'), 'You must check the confirmation box before proceeding.');
      return;
    }
    navigation.navigate('ConfirmDelete');
  };

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#EF4444' }]}>{t('deleteAccount.title')}</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Warning badge */}
          <View style={[styles.warningBadge, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <MaterialCommunityIcons name="alert-octagon" size={42} color="#EF4444" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t('deleteAccount.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('deleteAccount.subtitle')}
          </Text>

          {/* What gets deleted */}
          <View style={[styles.dangerCard, { backgroundColor: isDarkMode ? '#1A0A0A' : '#FEF2F2', borderColor: '#FECACA' }]}>
            <Text style={[styles.dangerCardTitle, { color: '#EF4444' }]}>⚠️ What will be permanently deleted:</Text>
            {[
              t('deleteAccount.warning1'),
              t('deleteAccount.warning2'),
              t('deleteAccount.warning3'),
              t('deleteAccount.warning4'),
            ].map((item, i) => (
              <View key={i} style={styles.dangerItem}>
                <MaterialCommunityIcons name="close-circle" size={16} color="#EF4444" />
                <Text style={[styles.dangerItemText, { color: isDarkMode ? '#FCA5A5' : '#991B1B' }]}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Confirmation checkbox */}
          <TouchableOpacity style={styles.checkRow} onPress={() => setConfirmed(v => !v)}>
            <View style={[styles.checkbox, { borderColor: confirmed ? '#EF4444' : colors.border, backgroundColor: confirmed ? '#EF4444' : 'transparent' }]}>
              {confirmed && <MaterialCommunityIcons name="check" size={14} color="#FFF" />}
            </View>
            <Text style={[styles.checkText, { color: colors.textSecondary }]}>
              I understand this is permanent and cannot be reversed.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: confirmed ? '#EF4444' : '#9CA3AF', opacity: confirmed ? 1 : 0.6 }]}
            onPress={handleNext}
          >
            <Text style={styles.deleteBtnText}>{t('deleteAccount.continue')}</Text>
            <MaterialCommunityIcons name="arrow-right" size={22} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>{t('deleteAccount.cancel')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 22, paddingBottom: 50 },
  warningBadge: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 18, borderWidth: 2 },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 22 },
  dangerCard: { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 22 },
  dangerCardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 14 },
  dangerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dangerItemText: { fontSize: 13, flex: 1, lineHeight: 19 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 30 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginTop: 1, flexShrink: 0 },
  checkText: { fontSize: 14, flex: 1, lineHeight: 21 },
  deleteBtn: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 },
  deleteBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelBtnText: { fontSize: 15, fontWeight: '700' },
});

export default DeleteAccountScreen;
