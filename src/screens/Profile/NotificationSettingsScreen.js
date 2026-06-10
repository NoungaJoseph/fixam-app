import React, { useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, Switch, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const NotificationSettingsScreen = ({ navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    jobAlerts: true,
    messageAlerts: true,
    walletAlerts: true,
    promotions: false,
  });

  const toggleSwitch = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingRow = ({ title, description, value, onToggle, icon }) => (
    <View style={[styles.settingCard, { borderBottomColor: colors.border }]}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: colors.border, true: colors.accent + '50' }}
        thumbColor={value ? colors.accent : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notification Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>GENERAL PREFERENCES</Text>
          
          <SettingRow 
            icon="bell-ring-outline"
            title="Push Notifications"
            description="Enable or disable all push notifications"
            value={settings.pushNotifications}
            onToggle={() => toggleSwitch('pushNotifications')}
          />

          <SettingRow 
            icon="email-outline"
            title="Email Notifications"
            description="Receive updates via email"
            value={settings.emailNotifications}
            onToggle={() => toggleSwitch('emailNotifications')}
          />

          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 25 }]}>ALERT TYPES</Text>

          <SettingRow 
            icon="briefcase-outline"
            title="Job Updates"
            description="Notifications about your posted or accepted jobs"
            value={settings.jobAlerts}
            onToggle={() => toggleSwitch('jobAlerts')}
          />

          <SettingRow 
            icon="message-text-outline"
            title="Messages"
            description="Alerts for new chat messages"
            value={settings.messageAlerts}
            onToggle={() => toggleSwitch('messageAlerts')}
          />

          <SettingRow 
            icon="wallet-outline"
            title="Wallet & Payments"
            description="Alerts for coins, refills and transactions"
            value={settings.walletAlerts}
            onToggle={() => toggleSwitch('walletAlerts')}
          />

          <SettingRow 
            icon="tag-outline"
            title="Promotions & News"
            description="Receive special offers and platform news"
            value={settings.promotions}
            onToggle={() => toggleSwitch('promotions')}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 15, textTransform: 'uppercase' },
  settingCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 17, borderBottomWidth: 1 },
  iconBox: { width: 34, height: 34, justifyContent: 'center', alignItems: 'flex-start' },
  settingInfo: { flex: 1, marginLeft: 15, marginRight: 10 },
  settingTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  settingDesc: { fontSize: 12, lineHeight: 16 },
});

export default NotificationSettingsScreen;
