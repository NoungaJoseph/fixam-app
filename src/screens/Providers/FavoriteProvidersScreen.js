import React from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { getMediaUrl } from '../../services/api';
import UserAvatar from '../../components/UserAvatar';

const FavoriteProvidersScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { favoriteProviders, favoriteProviderIds, toggleFavoriteProvider } = useAppContext();

  const renderProvider = ({ item }) => {
    const avatarUri = getMediaUrl(item.user?.avatar);
    const name = item.user?.fullName || 'Professional';
    const isFavorite = favoriteProviderIds?.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('ProviderProfile', { provider: item })}
        activeOpacity={0.85}
      >
        <UserAvatar uri={avatarUri} name={name} size={58} radius={8} style={styles.avatar} />
        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
            {item.verification === 'VERIFIED' && <MaterialCommunityIcons name="check-decagram" size={18} color="#0D9488" />}
          </View>
          <Text style={[styles.skill, { color: colors.accent }]} numberOfLines={1}>{item.skills?.[0] || 'Professional'}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>{item.serviceArea || 'Nearby'} • {item.rating || '0.0'} rating</Text>
        </View>
        <TouchableOpacity style={styles.heartBtn} onPress={() => toggleFavoriteProvider?.(item.id)}>
          <MaterialCommunityIcons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#EF4444' : colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerBtn, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Favorite Pros</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProviderList')} style={[styles.headerBtn, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="account-search-outline" size={23} color={colors.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={favoriteProviders}
          keyExtractor={(item) => item.id}
          renderItem={renderProvider}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="heart-outline" size={70} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No favorites yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Save providers from their profile or the discover page and they will appear here.</Text>
              <TouchableOpacity style={styles.discoverBtn} onPress={() => navigation.navigate('ProviderList')}>
                <Text style={styles.discoverText}>Discover Pros</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '900' },
  list: { padding: 20, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 12 },
  avatar: { width: 58, height: 58, borderRadius: 8, backgroundColor: '#E2E8F0' },
  cardBody: { flex: 1, marginLeft: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flex: 1, fontSize: 16, fontWeight: '900' },
  skill: { fontSize: 13, fontWeight: '800', marginTop: 3 },
  meta: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  heartBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 28 },
  emptyTitle: { fontSize: 19, fontWeight: '900', marginTop: 18 },
  emptyText: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  discoverBtn: { marginTop: 20, backgroundColor: '#0D9488', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 13 },
  discoverText: { color: '#FFF', fontWeight: '900' },
});

export default FavoriteProvidersScreen;
