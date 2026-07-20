import React from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Platform, Linking, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const { width, height } = Dimensions.get('window');

const LiveTaskMapScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const task = route.params?.task || {};
  const lat = task.latitude != null ? Number(task.latitude) : null;
  const lng = task.longitude != null ? Number(task.longitude) : null;
  const hasCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  const selectedAssignment = task.assignments?.find((assignment) =>
    ['ACCEPTED', 'IN_PROGRESS'].includes(String(assignment.status || '').toUpperCase())
  );
  const providerUser = selectedAssignment?.provider?.user;

  const openInGoogleMaps = () => {
    if (hasCoords) {
      const q = `${lat},${lng}`;
      const url =
        Platform.OS === 'ios'
          ? `http://maps.apple.com/?ll=${q}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
      Linking.openURL(url);
      return;
    }
    const addr = encodeURIComponent(task.location || task.title || '');
    if (addr) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${addr}`);
  };

  const chatUser = providerUser || task.client;
  const openChat = () => {
    navigation.navigate('Chat', {
      receiverId: chatUser?.id || task.clientId,
      userName: chatUser?.fullName || chatUser?.name || 'Task contact',
      avatar: chatUser?.avatar,
      task,
    });
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.card }]} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontWeight: '900', fontSize: 17, color: colors.text }}>{task.title || 'Live tracking'}</Text>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 26, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : colors.accentSoft, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <MaterialCommunityIcons name="crosshairs-gps" size={50} color={colors.accent} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text, textAlign: 'center', marginBottom: 12 }}>
          {task.title || 'Live Tracking'}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textSecondary, textAlign: 'center', marginBottom: 35, lineHeight: 22 }}>
          {task.location || 'Location shared for this task'}
        </Text>
        <TouchableOpacity 
          style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, paddingVertical: 18, borderRadius: 16, gap: 12 }} 
          onPress={openInGoogleMaps}
        >
          <MaterialCommunityIcons name="google-maps" size={24} color="#FFF" />
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFF' }}>{t('jobs.trackInGoogleMaps')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 12, borderWidth: 1, borderColor: colors.border, marginTop: 12 }} onPress={openChat}>
          <MaterialCommunityIcons name="message-text-outline" size={22} color={colors.text} />
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>{t('common.messages')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default LiveTaskMapScreen;
