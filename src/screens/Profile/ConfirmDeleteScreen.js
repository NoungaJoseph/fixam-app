import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ConfirmDeleteScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!password) {
      Alert.alert(t('common.error'), t('deleteAccount.passwordPlaceholder'));
      return;
    }

    Alert.alert(
      t('deleteAccount.title'),
      t('deleteAccount.subtitle'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('deleteAccount.deleteBtn'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.delete('/user/me', { data: { password } });
              Alert.alert(t('common.success'), t('deleteAccount.success'));
              await logout();
            } catch (error) {
              Alert.alert(t('common.error'), error.response?.data?.message || t('deleteAccount.incorrectPassword'));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBadge, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <MaterialCommunityIcons name="shield-lock-outline" size={42} color="#EF4444" />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t('deleteAccount.confirmTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('deleteAccount.confirmSubtitle')}
          </Text>

          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={colors.placeholder} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder={t('deleteAccount.passwordPlaceholder')}
              placeholderTextColor={colors.placeholder}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPw(v => !v)}>
              <MaterialCommunityIcons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.placeholder} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: password ? '#EF4444' : '#9CA3AF', opacity: password && !loading ? 1 : 0.6 }]}
            onPress={handleDelete}
            disabled={!password || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="delete-forever-outline" size={22} color="#FFF" />
                <Text style={styles.deleteBtnText}>{t('deleteAccount.deleteBtn')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 22, flex: 1 },
  iconContainer: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  iconBadge: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 30 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, height: 52, marginBottom: 30, gap: 10 },
  input: { flex: 1, fontSize: 15 },
  deleteBtn: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  deleteBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
});

export default ConfirmDeleteScreen;
