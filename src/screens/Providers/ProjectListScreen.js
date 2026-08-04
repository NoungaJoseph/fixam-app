import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import TealSafeAreaView from '../../components/Common/TealSafeAreaView';
import { getCurrencyForUser } from '../../constants/countries';
import { getMediaUrl } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 36) / 2;

const ProjectListScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { publishedProjects, toggleLikeProject, popularCategories } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const currencyStr = getCurrencyForUser(user?.country || 'Cameroon');

  // Filter projects by search query and category (excluding own projects)
  const filteredProjects = useMemo(() => {
    let list = Array.isArray(publishedProjects) ? publishedProjects : [];
    const currentId = String(user?.id || user?._id || user?.userId || '');
    const currentProfId = String(user?.providerProfile?.id || user?.provider?.id || '');

    list = list.filter(item => {
      const itemProvUserId = String(item.providerId || item.provider?.user?.id || item.provider?.id || '');
      const itemProfId = String(item.provider?.id || '');

      const isMine = Boolean(
        (currentId && itemProvUserId === currentId) ||
        (currentProfId && itemProfId === currentProfId)
      );
      return !isMine;
    });

    if (selectedCategory !== 'All') {
      list = list.filter(p =>
        (p.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [publishedProjects, selectedCategory, searchQuery, user]);

  const categories = ['All', ...((popularCategories || []).map(c => c.name).slice(0, 8))];

  const renderProjectItem = ({ item }) => {
    const prov = item.provider || {};
    const imgUrl = item.imageUrl || (item.images?.[0]) || (prov.user?.avatar);
    const isLiked = Boolean(item.isLikedByMe);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderColor: isDarkMode ? '#1F2937' : '#E2E8F0',
          }
        ]}
        onPress={() => navigation.navigate('ProjectDetail', { project: item, provider: prov })}
        activeOpacity={0.88}
      >
        {/* Thumbnail Wrap */}
        <View style={styles.thumbWrap}>
          <Image
            source={{ uri: getMediaUrl(imgUrl) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
            style={styles.thumbImage}
            resizeMode="cover"
          />

          {/* Video Badge */}
          {item.video && (
            <View style={styles.videoBadge}>
              <MaterialCommunityIcons name="play-circle" size={16} color="#FFF" />
              <Text style={styles.videoBadgeText}>Video</Text>
            </View>
          )}

          {/* Heart Like Button */}
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => toggleLikeProject?.(item.id)}
          >
            <MaterialCommunityIcons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={isLiked ? '#EF4444' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <Text style={[styles.projectTitle, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]} numberOfLines={2}>
            {item.title}
          </Text>

          {item.category ? (
            <Text style={[styles.categoryTag, { color: colors.accent }]} numberOfLines={1}>
              {item.category}
            </Text>
          ) : null}

          {/* Price & Rating Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
              <Text style={[styles.ratingVal, { color: colors.text }]}>
                {Number(prov.rating || 4.8).toFixed(1)}
              </Text>
            </View>

            <Text style={[styles.priceText, { color: colors.text }]}>
              {currencyStr} {item.price || 50}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <TealSafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#1F2937' : '#E2E8F0' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('project.browseProjects', 'Projects & Deliverables')}
        </Text>
        {user?.role?.toUpperCase() === 'PROVIDER' ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('PostProject')}
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Search Input Box */}
      <View style={{ paddingHorizontal: 12, paddingTop: 12 }}>
        <View style={[styles.searchBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('project.searchPlaceholder', 'Search projects by title or category...')}
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>



      {/* 2-COLUMN GRID OF PROJECTS */}
      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item.id || `proj_${Math.random()}`}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        renderItem={renderProjectItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="folder-search-outline" size={60} color={colors.placeholder} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('project.noProjectsFound', 'No Projects Found')}
            </Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {t('project.noProjectsDesc', 'Try searching with different keywords or custom categories.')}
            </Text>
          </View>
        }
      />
    </TealSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },

  // Grid Card Styles
  card: {
    width: CARD_WIDTH,
    margin: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbWrap: { width: '100%', height: 125, position: 'relative' },
  thumbImage: { width: '100%', height: '100%' },
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  likeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBody: { padding: 10 },
  projectTitle: { fontSize: 13, fontWeight: '800', lineHeight: 17, marginBottom: 4 },
  categoryTag: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingVal: { fontSize: 12, fontWeight: '800' },
  priceText: { fontSize: 13, fontWeight: '900' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '900', marginTop: 12 },
  emptySub: { fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});

export default ProjectListScreen;
