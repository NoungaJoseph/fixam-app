import React, { useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, StatusBar, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getMediaUrl } from '../../services/api';
import UserAvatar from '../../components/UserAvatar';

const FavoriteProvidersScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('providers'); // 'providers' or 'projects'

  const { 
    favoriteProviders, 
    favoriteProviderIds, 
    toggleFavoriteProvider,
    favoriteProjects,
    toggleLikeProject,
    favoriteProjectIds
  } = useAppContext();

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

  const renderProject = ({ item }) => {
    const prov = item.provider || {};
    const imgUrl = item.imageUrl || (item.images?.[0]) || (prov.user?.avatar);
    const title = item.title || 'Project';
    const isLiked = favoriteProjectIds?.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('ProjectDetail', { project: item, provider: prov })}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: getMediaUrl(imgUrl) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
          style={styles.projectImage}
          resizeMode="cover"
        />
        <View style={styles.cardBody}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.skill, { color: colors.accent }]} numberOfLines={1}>{item.category || 'Gig/Project'}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            By {prov.user?.fullName || 'Professional'} • XAF {Number(item.price || 0).toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity style={styles.heartBtn} onPress={() => toggleLikeProject?.(item.id)}>
          <MaterialCommunityIcons name={isLiked ? 'heart' : 'heart-outline'} size={24} color={isLiked ? '#EF4444' : colors.textSecondary} />
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
          <Text style={[styles.title, { color: colors.text }]}>Favorites</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProviderList')} style={[styles.headerBtn, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="account-search-outline" size={23} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Tab Bar Segment Controls */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'providers' && styles.activeTabBtn, activeTab === 'providers' && { borderBottomColor: '#0D9488' }]}
            onPress={() => setActiveTab('providers')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'providers' ? '#0D9488' : colors.textSecondary }]}>
              Providers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'projects' && styles.activeTabBtn, activeTab === 'projects' && { borderBottomColor: '#0D9488' }]}
            onPress={() => setActiveTab('projects')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'projects' ? '#0D9488' : colors.textSecondary }]}>
              Projects
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={activeTab === 'providers' ? favoriteProviders : favoriteProjects}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'providers' ? renderProvider : renderProject}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name={activeTab === 'providers' ? 'heart-outline' : 'briefcase-outline'} size={70} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeTab === 'providers' ? t('favorites.emptyTitle') : 'No favorite projects yet'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {activeTab === 'providers' 
                  ? t('favorites.emptyText') 
                  : 'Explore projects and tap the heart icon to save them for quick access.'}
              </Text>
              <TouchableOpacity 
                style={styles.discoverBtn} 
                onPress={() => {
                  if (activeTab === 'providers') {
                    navigation.navigate('ProviderList');
                  } else {
                    navigation.navigate('ProjectList');
                  }
                }}
              >
                <Text style={styles.discoverText}>
                  {activeTab === 'providers' ? t('favorites.discoverPros') : 'Discover Projects'}
                </Text>
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
  projectImage: { width: 58, height: 58, borderRadius: 8, backgroundColor: '#E2E8F0' },
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default FavoriteProvidersScreen;
