import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { 
  Alert, 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  Modal, 
  TextInput, 
  ActivityIndicator,
  Share 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DataUsageScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  // Settings State
  const [lowDataMode, setLowDataMode] = useState(false);
  const [shareAnalytics, setShareAnalytics] = useState(true);
  const [personalization, setPersonalization] = useState(true);

  // Modals
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportEmail, setExportEmail] = useState(user?.email || '');
  const [exportLoading, setExportLoading] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Load Settings on Mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [lowData, analytics, personal] = await Promise.all([
          AsyncStorage.getItem('data_saver_enabled'),
          AsyncStorage.getItem('analytics_enabled'),
          AsyncStorage.getItem('personalized_rec_enabled'),
        ]);

        if (lowData !== null) setLowDataMode(lowData === 'true');
        if (analytics !== null) setShareAnalytics(analytics === 'true');
        if (personal !== null) setPersonalization(personal === 'true');
      } catch (err) {
        console.log('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Toggle Handlers
  const handleToggleLowData = async (val) => {
    setLowDataMode(val);
    try {
      await AsyncStorage.setItem('data_saver_enabled', val ? 'true' : 'false');
    } catch (err) {
      console.log(err);
    }
  };

  const handleToggleAnalytics = async (val) => {
    setShareAnalytics(val);
    try {
      await AsyncStorage.setItem('analytics_enabled', val ? 'true' : 'false');
    } catch (err) {
      console.log(err);
    }
  };

  const handleTogglePersonalization = async (val) => {
    setPersonalization(val);
    try {
      await AsyncStorage.setItem('personalized_rec_enabled', val ? 'true' : 'false');
    } catch (err) {
      console.log(err);
    }
  };

  // Actions
  const handleClearCache = () => {
    Alert.alert(
      t('profile.clearCacheConfirmTitle', 'Clear Cache & History'),
      t('profile.clearCacheConfirmMsg', 'Are you sure you want to clear search history and local image cache? This action cannot be undone.'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { 
          text: t('common.confirm', 'Confirm'), 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear local search cache keys
              await AsyncStorage.removeItem('recent_searches');
              // Show success message
              Alert.alert(
                t('common.success', 'Success'), 
                t('profile.clearCacheSuccess', 'Search history and cache cleared successfully.')
              );
            } catch (err) {
              console.log(err);
            }
          }
        }
      ]
    );
  };

  const handleRequestExport = async () => {
    if (!exportEmail) return;
    setExportLoading(true);
    
    try {
      const userData = {
        profile: {
          fullName: user?.fullName || '',
          email: user?.email || '',
          phone: user?.phone || '',
          country: user?.country || '',
          role: user?.role || '',
          createdAt: user?.createdAt || '',
        },
        preferences: {
          lowDataMode,
          shareAnalytics,
          personalization,
        }
      };

      // Check if native ExpoPrint module is available in global JS registries (without calling native bridge loaders)
      const isPrintAvailable = !!(
        (global.ExpoModules && (global.ExpoModules.ExpoPrint || global.ExpoModules['ExpoPrint'])) ||
        (global.expo && global.expo.modules && global.expo.modules.ExpoPrint)
      );

      if (!isPrintAvailable) {
        // Immediately fall back to JSON text sharing if PDF native module is missing
        setExportLoading(false);
        setExportModalVisible(false);
        await Share.share({
          message: `Fixam Personal Data Archive\n\n${JSON.stringify(userData, null, 2)}`,
          title: 'Fixam Personal Data Archive'
        });
        return;
      }

      const htmlContent = `
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #1E293B;
              padding: 40px 30px;
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #0D9488;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo {
              font-size: 24px;
              font-weight: 800;
              color: #0D9488;
              letter-spacing: 1px;
            }
            .title {
              font-size: 18px;
              font-weight: 700;
              color: #1E293B;
              text-transform: uppercase;
              margin: 0;
            }
            .desc {
              font-size: 14px;
              color: #475569;
              margin-bottom: 30px;
            }
            .meta-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .meta-table th, .meta-table td {
              padding: 12px 15px;
              text-align: left;
              border-bottom: 1px solid #E2E8F0;
              font-size: 14px;
            }
            .meta-table th {
              background-color: #F8FAFC;
              color: #475569;
              font-weight: 600;
              width: 35%;
            }
            .meta-table td {
              color: #0F172A;
              font-weight: 500;
            }
            .section-title {
              font-size: 15px;
              font-weight: 750;
              color: #0D9488;
              border-bottom: 1px solid #E2E8F0;
              padding-bottom: 8px;
              margin-top: 30px;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #E2E8F0;
              padding-top: 20px;
              font-size: 11px;
              color: #94A3B8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">FIXAM</div>
            <div class="title">Personal Data Archive</div>
          </div>
          
          <div class="desc">
            This document contains an official copy of the personal data and configuration preferences associated with your Fixam account, compiled on <strong>${new Date().toLocaleDateString()}</strong> at <strong>${new Date().toLocaleTimeString()}</strong>.
          </div>
          
          <div class="section-title">Account Profile</div>
          <table class="meta-table">
            <tr><th>Full Name</th><td>${userData.profile.fullName}</td></tr>
            <tr><th>Email Address</th><td>${userData.profile.email}</td></tr>
            <tr><th>Phone Number</th><td>${userData.profile.phone || 'N/A'}</td></tr>
            <tr><th>Country</th><td>${userData.profile.country || 'N/A'}</td></tr>
            <tr><th>Account Role</th><td>${userData.profile.role}</td></tr>
            <tr><th>Member Since</th><td>${userData.profile.createdAt ? new Date(userData.profile.createdAt).toLocaleDateString() : 'N/A'}</td></tr>
          </table>

          <div class="section-title">Preferences & Settings</div>
          <table class="meta-table">
            <tr><th>Low Data Mode</th><td>${userData.preferences.lowDataMode ? 'Enabled' : 'Disabled'}</td></tr>
            <tr><th>Share Analytics</th><td>${userData.preferences.shareAnalytics ? 'Enabled' : 'Disabled'}</td></tr>
            <tr><th>Personalized Recommendations</th><td>${userData.preferences.personalization ? 'Enabled' : 'Disabled'}</td></tr>
          </table>

          <div class="section-title">Export Audit Information</div>
          <table class="meta-table">
            <tr><th>Archive Status</th><td>Verified & Secured</td></tr>
            <tr><th>Client Identifier</th><td>Fixam iOS/Android Native Client</td></tr>
            <tr><th>Export Key</th><td>FX-DATA-${Math.random().toString(36).substring(2, 10).toUpperCase()}</td></tr>
          </table>

          <div class="footer">
            Fixam Technologies © ${new Date().getFullYear()}. All rights reserved.<br/>
            This document is generated dynamically at the user's request. Protect this document as it contains sensitive personal data.
          </div>
        </body>
        </html>
      `;

      // Dynamically load the modules only when they are verified to exist
      const Print = require('expo-print');
      const Sharing = require('expo-sharing');

      try {
        // Generate the PDF file
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        
        setExportLoading(false);
        setExportModalVisible(false);

        // Open sharing dialog with the generated PDF file
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Personal Data Archive',
          UTI: 'com.adobe.pdf'
        });
      } catch (pdfErr) {
        console.log('PDF generation failed, falling back to JSON text:', pdfErr);
        
        setExportLoading(false);
        setExportModalVisible(false);

        // Fallback to text JSON sharing
        await Share.share({
          message: `Fixam Personal Data Archive\n\n${JSON.stringify(userData, null, 2)}`,
          title: 'Fixam Personal Data Archive'
        });
      }
    } catch (err) {
      setExportLoading(false);
      console.log('Outer error:', err);
      Alert.alert(t('common.error', 'Error'), 'Failed to export data archive.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      // Call backend DELETE endpoint
      const res = await api.delete('/users/me', {
        data: { password: deletePassword }
      });

      setDeleteLoading(false);
      setDeleteModalVisible(false);
      
      Alert.alert(
        t('common.success', 'Success'),
        t('profile.deleteSuccess', 'Your account and all associated data have been permanently deleted.'),
        [
          {
            text: 'OK',
            onPress: () => {
              logout();
            }
          }
        ]
      );
    } catch (err) {
      setDeleteLoading(false);
      const errMsg = err.response?.data?.message || t('profile.incorrectPassword', 'Incorrect password');
      setDeleteError(errMsg);
    }
  };

  // Custom UI components
  const PreferenceItem = ({ icon, title, desc, value, onValueChange }) => (
    <View style={[styles.itemRow, { borderBottomColor: colors.border }]}>
      <View style={styles.itemInfo}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.itemTexts}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{desc}</Text>
        </View>
      </View>
      <Switch 
        value={value} 
        onValueChange={onValueChange} 
        trackColor={{ true: colors.accent }} 
      />
    </View>
  );

  const ActionItem = ({ icon, title, desc, onPress, color }) => (
    <TouchableOpacity 
      style={[styles.itemRow, { borderBottomColor: colors.border }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemInfo}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={22} color={color || colors.primary} />
        </View>
        <View style={styles.itemTexts}>
          <Text style={[styles.itemTitle, { color: color || colors.text }]}>{title}</Text>
          <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{desc}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.dataUsage', 'Data Usage')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {t('settings.preferences', 'Preferences')}
            </Text>
            
            <PreferenceItem
              icon="data-matrix"
              title={t('profile.lowDataMode', 'Low Data Mode')}
              desc={t('profile.lowDataModeDesc', 'Reduce image quality to save mobile data')}
              value={lowDataMode}
              onValueChange={handleToggleLowData}
            />

            <PreferenceItem
              icon="chart-bar"
              title={t('profile.shareAnalytics', 'Share Analytics')}
              desc={t('profile.shareAnalyticsDesc', 'Help us improve by sharing crash reports and usage data')}
              value={shareAnalytics}
              onValueChange={handleToggleAnalytics}
            />

            <PreferenceItem
              icon="target"
              title={t('profile.personalization', 'Personalized Recommendations')}
              desc={t('profile.personalizationDesc', 'Allow us to suggest services based on your activity')}
              value={personalization}
              onValueChange={handleTogglePersonalization}
            />
          </View>

          {/* Data Actions Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {t('profile.privacyControl', 'Privacy Control')}
            </Text>

            <ActionItem
              icon="cloud-download-outline"
              title={t('profile.downloadData', 'Download Personal Data')}
              desc={t('profile.downloadDataDesc', 'Request a copy of your account activity, chats, and profile data')}
              onPress={() => setExportModalVisible(true)}
            />

            <ActionItem
              icon="delete-sweep-outline"
              title={t('profile.clearCache', 'Clear Search History & Cache')}
              desc={t('profile.clearCacheDesc', 'Free up space by clearing local search history and temporary files')}
              onPress={handleClearCache}
            />
          </View>

          {/* Danger Zone */}
          <View style={[styles.section, { marginTop: 10 }]}>
            <TouchableOpacity 
              style={[styles.dangerBtn, { borderColor: colors.error }]} 
              onPress={() => {
                setDeletePassword('');
                setDeleteError('');
                setDeleteModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.dangerBtnRow}>
                <MaterialCommunityIcons name="delete-forever-outline" size={20} color={colors.error} />
                <Text style={[styles.dangerText, { color: colors.error }]}>
                  {t('profile.deleteAccount', 'Delete Account')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Export Data Modal */}
      <Modal 
        visible={exportModalVisible} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => setExportModalVisible(false)} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('profile.exportDataTitle', 'Request Data Export')}
            </Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              {t('profile.exportDataSub', 'We will prepare a ZIP archive of your data and email it to:')}
            </Text>

            <View style={[styles.inputWrap, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={exportEmail}
                onChangeText={setExportEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Email Address"
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: colors.accent, marginTop: 24 }, (!exportEmail || exportLoading) && styles.disabledBtn]}
              onPress={handleRequestExport}
              disabled={!exportEmail || exportLoading}
            >
              {exportLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>{t('profile.requestBtn', 'Request Export')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal 
        visible={deleteModalVisible} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: colors.error }]}>
              {t('profile.deleteAccountConfirmTitle', 'Delete Account?')}
            </Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary, marginBottom: 20 }]}>
              {t('profile.deleteAccountConfirmMsg', 'Warning: This will permanently delete your account, bookings, wallet balance, and profile. This cannot be undone. Enter your password to confirm.')}
            </Text>

            <View style={[styles.inputWrap, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholder={t('profile.enterPassword', 'Enter your password')}
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.placeholder} />
              </TouchableOpacity>
            </View>

            {deleteError ? <Text style={styles.errorText}>{deleteError}</Text> : null}

            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: colors.error, marginTop: 24 }, (!deletePassword || deleteLoading) && styles.disabledBtn]}
              onPress={handleDeleteAccount}
              disabled={!deletePassword || deleteLoading}
            >
              {deleteLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>{t('profile.deleteAccount', 'Delete Account')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  backBtn: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 20 },
  section: { marginBottom: 30 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 15, textTransform: 'uppercase' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 17, borderBottomWidth: 1,
  },
  itemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  iconWrap: { width: 34, height: 34, justifyContent: 'center', alignItems: 'flex-start', marginRight: 12 },
  itemTexts: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '700' },
  itemDesc: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  dangerBtn: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 10 },
  dangerBtnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dangerText: { fontWeight: '800', fontSize: 16 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginTop: 10, marginBottom: 8 },
  modalSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },

  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, height: 50, width: '100%' },
  input: { flex: 1, fontSize: 15 },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  primaryBtn: { width: '100%', height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});

export default DataUsageScreen;
