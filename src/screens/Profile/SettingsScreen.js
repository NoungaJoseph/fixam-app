import React, { useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, Switch, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { translateStatus } from '../../i18n/translate';
import UserAvatar from '../../components/UserAvatar';

const SettingsScreen = ({ navigation, route }) => {
  const { isDarkMode, colors, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [location, setLocation] = useState(true);
  const isProviderMode = user?.providerProfile?.profileMode === 'WORK';

  const handleLogout = () => {
    Alert.alert(t('settings.logoutConfirmTitle'), t('settings.logoutConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  const verStatus = user?.providerProfile?.verification;
  const verColor = verStatus === 'VERIFIED' ? '#22C55E' : verStatus === 'PENDING' ? '#F59E0B' : '#EF4444';
  const verBg = verStatus === 'VERIFIED' ? '#F0FDF4' : verStatus === 'PENDING' ? '#FFFBEB' : '#FEF2F2';
  const verLabel = translateStatus(verStatus || 'UNVERIFIED');

  // Icon config: [iconName, bgColor]
  const ICON_COLORS = {
    'account-circle-outline': ['#0D9488', '#F0FDFA'],
    'lock-outline':            ['#8B5CF6', '#F5F3FF'],
    'check-decagram-outline':  ['#F59E0B', '#FFFBEB'],
    'translate':               ['#2563EB', '#EFF6FF'],
    'weather-night':           ['#6366F1', '#EEF2FF'],
    'map-marker-outline':      ['#0D9488', '#F0FDFA'],
    'eye-off-outline':         ['#64748B', '#F1F5F9'],
    'shield-check-outline':    ['#0D9488', '#F0FDFA'],
    'bell-outline':            ['#EF4444', '#FEF2F2'],
    'help-circle-outline':     ['#0D9488', '#F0FDFA'],
    'message-draw':            ['#8B5CF6', '#F5F3FF'],
    'logout':                  ['#EF4444', '#FEF2F2'],
  };

  const SettingItem = ({ icon, title, desc, onPress, right, danger }) => {
    const [iconColor, iconBg] = ICON_COLORS[icon] || [colors.accent, colors.accentSoft];
    return (
      <TouchableOpacity
        style={styles.settingRow}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <View style={styles.settingRowLeft}>
          <View style={[styles.iconBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.07)' : iconBg }]}>
            <MaterialCommunityIcons name={icon} size={20} color={danger ? '#EF4444' : iconColor} />
          </View>
          <View style={styles.settingBody}>
            <Text style={[styles.settingTitle, { color: danger ? '#EF4444' : colors.text }]}>{title}</Text>
            {desc ? <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>{desc}</Text> : null}
          </View>
        </View>
        {right || (onPress && (
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.placeholder} />
        ))}
      </TouchableOpacity>
    );
  };

  const SectionHeader = ({ icon, label }) => (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={15} color={colors.placeholder} />
      <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>{label}</Text>
    </View>
  );

  const SectionCard = ({ children }) => {
    const items = React.Children.toArray(children).filter(Boolean);
    return (
      <View style={styles.sectionCard}>
        {items.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < items.length - 1 && <View style={[styles.separator, { backgroundColor: isDarkMode ? '#333' : '#F0F0F0' }]} />}
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Page Title */}
          <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>{t('settings.title')}</Text>
            <Text style={[styles.pageSub, { color: colors.textSecondary }]}>{t('settings.subtitle')}</Text>
          </View>

          {/* Hero Profile Card */}
          <TouchableOpacity
            onPress={() => navigation.navigate('UserProfile')}
            activeOpacity={0.9}
            style={styles.heroWrapper}
          >
            <LinearGradient
              colors={['#0D9488', '#2563EB']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              {/* Decorative gear */}
              <View style={styles.gearDecor}>
                <MaterialCommunityIcons name="cog" size={100} color="rgba(255,255,255,0.08)" />
              </View>

              <View style={styles.heroLeft}>
                <View style={styles.heroAvatarWrap}>
                  <UserAvatar
                    uri={user?.avatar}
                    name={user?.fullName || t('settings.yourName')}
                    size={66}
                    style={styles.heroAvatar}
                  />
                  <View style={[styles.editDot, { backgroundColor: colors.accent }]}>
                    <MaterialCommunityIcons name="pencil" size={10} color="#FFF" />
                  </View>
                </View>
                <View>
                  <Text style={styles.heroName}>{user?.fullName || t('settings.yourName')}</Text>
                  <Text style={styles.heroRole}>{isProviderMode ? t('settings.providerAccount') : t('settings.clientAccount')}</Text>
                  <View style={[styles.verBadge, { backgroundColor: verBg }]}>
                    <MaterialCommunityIcons name="shield-check" size={12} color={verColor} />
                    <Text style={[styles.verText, { color: verColor }]}>{verLabel}</Text>
                  </View>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>

          {/* ACCOUNT */}
          <SectionHeader icon="account-outline" label={t('settings.account')} />
          <SectionCard>
            <SettingItem icon="account-circle-outline" title={t('settings.profile')} desc={t('settings.profileDesc')} onPress={() => navigation.navigate('UserProfile')} />
            <SettingItem icon="lock-outline" title={t('settings.changePassword')} desc={t('settings.changePasswordDesc')} onPress={() => navigation.navigate('ChangePassword')} />
            <SettingItem
              icon="check-decagram-outline"
              title={t('settings.verification')}
              desc={t('settings.verificationDesc')}
              onPress={(verStatus === 'PENDING' || verStatus === 'VERIFIED') ? null : () => navigation.navigate('Verification')}
              right={
                <View style={[styles.statusPill, { backgroundColor: verBg }]}>
                  <Text style={[styles.statusPillText, { color: verColor }]}>{verLabel}</Text>
                </View>
              }
            />
          </SectionCard>

          {/* PREFERENCES */}
          <SectionHeader icon="tune" label={t('settings.preferences')} />
          <SectionCard>
            <SettingItem icon="translate" title={t('settings.language')} desc={t('settings.languageDesc')} onPress={() => navigation.navigate('LanguageSelection')} />
            <SettingItem
              icon="weather-night"
              title={t('settings.darkMode')}
              desc={t('settings.darkModeDesc')}
              right={
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ true: '#0D9488', false: '#CBD5E1' }}
                  thumbColor="#FFF"
                />
              }
            />
            <SettingItem
              icon="map-marker-outline"
              title={t('settings.location')}
              desc={t('settings.locationDesc')}
              right={
                <Switch
                  value={location}
                  onValueChange={setLocation}
                  trackColor={{ true: '#0D9488', false: '#CBD5E1' }}
                  thumbColor="#FFF"
                />
              }
            />
             <SettingItem icon="shield-check-outline" title={t('settings.privacy')} desc={t('settings.privacyDesc')} onPress={() => navigation.navigate('PrivacySecurity')} />
          </SectionCard>

          {/* NOTIFICATIONS */}
          <SectionHeader icon="bell-outline" label={t('settings.notifications')} />
          <SectionCard>
            <SettingItem icon="bell-outline" title={t('settings.push')} desc={t('settings.pushDesc')} onPress={() => navigation.navigate('Notifications')} />
          </SectionCard>

          {/* SUPPORT */}
          <SectionHeader icon="help-circle-outline" label={t('settings.support')} />
          <SectionCard>
            <SettingItem icon="help-circle-outline" title={t('settings.help')} desc={t('settings.helpDesc')} onPress={() => navigation.navigate('HelpCenter')} />
            <SettingItem icon="message-draw" title={t('settings.feedback')} desc={t('settings.feedbackDesc')} onPress={() => navigation.navigate('Feedback')} />
          </SectionCard>

          {/* ACTIONS */}
          <SectionHeader icon="power" label={t('settings.actions')} />
          <SectionCard>
            <SettingItem icon="logout" title={t('settings.logout')} desc={t('settings.logoutDesc')} onPress={handleLogout} />
          </SectionCard>

          <Text style={[styles.version, { color: colors.placeholder }]}>{t('settings.version')}</Text>
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 20 },

  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 12,
  },
  pageTitle: { fontSize: 28, fontWeight: '900' },
  pageSub: { fontSize: 13 },

  // Hero card
  heroWrapper: { marginHorizontal: 16, marginBottom: 24, borderRadius: 20, overflow: 'hidden' },
  heroCard: { flexDirection: 'row', alignItems: 'center', padding: 20, position: 'relative', overflow: 'hidden' },
  gearDecor: { position: 'absolute', right: 40, top: -20 },
  heroLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroAvatarWrap: { position: 'relative' },
  heroAvatar: { width: 66, height: 66, borderRadius: 33, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  heroInitial: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  editDot: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  heroName: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  heroRole: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  verBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  verText: { fontSize: 11, fontWeight: '800' },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 20, marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionCard: {
    marginBottom: 24,
  },

  // Row
  settingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    backgroundColor: 'transparent'
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20
  },
  iconBox: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  settingBody: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '700' },
  settingDesc: { fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 10, fontWeight: '900' },

  version: { textAlign: 'center', fontSize: 12, fontWeight: '600', marginTop: 10 },
});

export default SettingsScreen;
