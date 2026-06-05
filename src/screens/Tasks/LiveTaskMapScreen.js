import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Platform, Linking, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const LiveTaskMapScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
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
    navigation.getParent()?.navigate('Messages', {
      screen: 'Chat',
      params: {
        receiverId: chatUser?.id || task.clientId,
        userName: chatUser?.fullName || chatUser?.name || 'Task contact',
        avatar: chatUser?.avatar,
        task,
      },
    });
  };

  const region = hasCoords
    ? {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
      }
    : {
        latitude: 4.0511,
        longitude: 9.7679,
        latitudeDelta: 0.35,
        longitudeDelta: 0.35,
      };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.card }]} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontWeight: '900', fontSize: 17, color: colors.text }}>{task.title || 'Live tracking'}</Text>
        </View>
        <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 20 }}>
            Interactive maps run on the Fixam mobile app. Open this location in Google Maps instead.
          </Text>
          <TouchableOpacity style={[styles.sheetBtn, { borderColor: colors.border }]} onPress={openInGoogleMaps}>
            <MaterialCommunityIcons name="map-search-outline" size={20} color={colors.text} />
            <Text style={[styles.sheetBtnText, { color: colors.text }]}>Open in Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sheetBtn, { borderColor: colors.border, marginTop: 12 }]} onPress={openChat}>
            <MaterialCommunityIcons name="message-text-outline" size={20} color={colors.text} />
            <Text style={[styles.sheetBtnText, { color: colors.text }]}>Messages</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <MapView
        style={{ width, height }}
        mapType="standard"
        showsUserLocation={Platform.OS !== 'web'}
        showsMyLocationButton={Platform.OS === 'android'}
        showsCompass
        toolbarEnabled={Platform.OS === 'android'}
        loadingEnabled
        region={region}
      >
        {hasCoords ? (
          <Marker
            coordinate={{ latitude: lat, longitude: lng }}
            title={task.title || 'Task location'}
            description={task.location || undefined}
          />
        ) : null}
      </MapView>

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.card }]} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.titleBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.titleText, { color: colors.text }]} numberOfLines={1}>{task.title || 'Live tracking'}</Text>
            {!hasCoords ? (
              <Text style={styles.subMuted}>Precise pins appear when the task includes coordinates.</Text>
            ) : (
              <Text style={styles.subMuted}>{task.location || 'Open in Maps for turn-by-turn directions'}</Text>
            )}
          </View>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.card }]} onPress={openInGoogleMaps}>
            <MaterialCommunityIcons name="directions" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.bottomSheet, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>{task.title || 'Accepted task'}</Text>
        <Text style={[styles.sheetAddr, { color: colors.textSecondary }]}>{task.location || 'Location shared for this task'}</Text>
        <View style={styles.sheetActions}>
          <TouchableOpacity style={[styles.sheetBtn, { borderColor: colors.border }]} onPress={openInGoogleMaps}>
            <MaterialCommunityIcons name="map-search-outline" size={20} color={colors.text} />
            <Text style={[styles.sheetBtnText, { color: colors.text }]}>Open in Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sheetBtn, { borderColor: colors.border }]} onPress={openChat}>
            <MaterialCommunityIcons name="message-text-outline" size={20} color={colors.text} />
            <Text style={[styles.sheetBtnText, { color: colors.text }]}>Messages</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, pointerEvents: 'box-none' },
  topBar: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 14, paddingTop: 8 },
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
  titleBox: {
    flex: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  titleText: { fontSize: 16, fontWeight: '900', color: '#111' },
  subMuted: { fontSize: 12, fontWeight: '600', color: '#444', marginTop: 4 },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
  },
  sheetTitle: { fontSize: 17, fontWeight: '900' },
  sheetAddr: { fontSize: 14, marginTop: 6, fontWeight: '600', lineHeight: 20 },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  sheetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  sheetBtnText: { fontSize: 14, fontWeight: '800' },
});

export default LiveTaskMapScreen;
