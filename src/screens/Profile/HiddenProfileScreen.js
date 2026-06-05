import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';

const HiddenProfileScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [isHidden, setIsHidden] = useState(false);
  const [hideFrom, setHideFrom] = useState({ search: true, categories: true, recommendations: false });

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Hidden Profile</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Preview card */}
          <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: isHidden ? 0.4 : 1 }]}>
            <UserAvatar uri={user?.avatar} name={user?.fullName || 'Fixam User'} size={52} radius={16} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName || 'Fixam User'}</Text>
              <Text style={[styles.userRole, { color: colors.textSecondary }]}>{user?.role?.toLowerCase() === 'provider' ? 'Professional' : 'Client'}</Text>
            </View>
            {isHidden ? (
              <View style={styles.hiddenBadge}>
                <MaterialCommunityIcons name="eye-off" size={14} color="#FFF" />
                <Text style={styles.hiddenBadgeText}>Hidden</Text>
              </View>
            ) : (
              <View style={styles.visibleBadge}>
                <MaterialCommunityIcons name="eye" size={14} color="#22C55E" />
                <Text style={[styles.visibleBadgeText, { color: '#22C55E' }]}>Visible</Text>
              </View>
            )}
          </View>

          {/* Main toggle */}
          <View style={[styles.mainToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mainToggleTitle, { color: colors.text }]}>Hide My Profile</Text>
              <Text style={[styles.mainToggleSub, { color: colors.textSecondary }]}>
                When hidden, clients and pros won't be able to find you in searches, categories or recommendations.
              </Text>
            </View>
            <Switch
              value={isHidden}
              onValueChange={setIsHidden}
              trackColor={{ true: colors.accent }}
              thumbColor="#FFF"
            />
          </View>

          {/* Granular controls */}
          {isHidden && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Visibility Settings</Text>
              {[
                { key: 'search', label: 'Hide from Search Results', sub: 'Your profile won\'t appear in search' },
                { key: 'categories', label: 'Hide from Categories', sub: 'You won\'t appear under service categories' },
                { key: 'recommendations', label: 'Hide from Recommendations', sub: 'Not shown in "Nearby Professionals"' },
              ].map(opt => (
                <View key={opt.key} style={styles.optRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optLabel, { color: colors.text }]}>{opt.label}</Text>
                    <Text style={[styles.optSub, { color: colors.textSecondary }]}>{opt.sub}</Text>
                  </View>
                  <Switch
                    value={hideFrom[opt.key]}
                    onValueChange={v => setHideFrom(p => ({ ...p, [opt.key]: v }))}
                    trackColor={{ true: colors.accent }}
                    thumbColor="#FFF"
                  />
                </View>
              ))}
            </View>
          )}

          {/* Info box */}
          <View style={[styles.infoBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#EEF4FF', borderColor: colors.accent + '40' }]}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Unlike deleting your account, hiding your profile is fully reversible. Your data, wallet and task history are all preserved. You can make yourself visible again at any time.
            </Text>
          </View>

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={() => navigation.goBack()}>
            <Text style={styles.saveBtnText}>Save Preferences</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 22, paddingBottom: 48 },
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 18 },
  avatar: { width: 52, height: 52, borderRadius: 16 },
  userName: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  userRole: { fontSize: 13, textTransform: 'capitalize' },
  hiddenBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#6B7280', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  hiddenBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  visibleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  visibleBadgeText: { fontSize: 12, fontWeight: '700' },
  mainToggle: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 16 },
  mainToggleTitle: { fontSize: 16, fontWeight: '800', marginBottom: 5 },
  mainToggleSub: { fontSize: 13, lineHeight: 19 },
  section: { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 16 },
  optRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  optLabel: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  optSub: { fontSize: 12, lineHeight: 18 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 22 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  saveBtn: { height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});

export default HiddenProfileScreen;
