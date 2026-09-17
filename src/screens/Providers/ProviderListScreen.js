import React, { useMemo, useState, useEffect } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, StatusBar, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { translateService } from '../../i18n/translate';
import api, { getMediaUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';
import { getCurrencyForUser } from '../../constants/countries';

const REMOTE_KEYWORDS = [
  'web', 'design', 'software', 'development', 'programming', 'developer',
  'graphic', 'logo', 'marketing', 'translation', 'writing', 'copywriter',
  'seo', 'accounting', 'bookkeeping', 'virtual assistant', 'social media',
  'freelancer', 'content creator', 'tutor', 'teacher', 'coding', 'editor',
  'video editing'
];

const isRemoteSkill = (skillName) => {
  if (!skillName) return false;
  const s = skillName.toLowerCase().trim();
  return REMOTE_KEYWORDS.some(keyword => s.includes(keyword));
};

const CATEGORY_KEYWORDS = {
  'home tutor': ['tutor', 'tutoring', 'teacher', 'teach', 'soutien scolaire', 'cours', 'domicile', 'enseignant', 'prof', 'educat', 'math', 'physic', 'chem', 'english', 'french', 'tutoring'],
  'plumbing': ['plumb', 'pipe', 'leak', 'water pump', 'borehole', 'drain', 'plombier', 'plomberie', 'tuyau', 'forage', 'pompe'],
  'electrical': ['electr', 'wire', 'solar', 'inverter', 'light', 'electricien', 'électricité', 'câblage', 'solaire', 'onduleur'],
  'tricycle': ['tricycle', 'triporteur', 'gambia', 'moto', '3 wheel', 'three wheel'],
  'cleaning': ['clean', 'sweep', 'broom', 'dust', 'wash', 'laundry', 'nettoy', 'balai', 'lessive', 'ménag', 'propreté', 'vide', 'poubelle', 'trash', 'waste', 'disinfect', 'disinfectant'],
  'graphic designer': ['graphic', 'design', 'logo', 'illustrat', 'photoshop', 'infograph', 'dessin', 'sketch', 'brand'],
  'website designer': ['web', 'website', 'developer', 'program', 'code', 'software', 'site', 'logiciel', 'appli', 'frontend', 'backend', 'dev'],
  'waste removal': ['waste', 'removal', 'trash', 'garbage', 'pest', 'bug', 'insect', 'fumigat', 'déchet', 'poubelle', 'ordure', 'désinfect', 'nuisible', 'rat', 'souris', 'cafard'],
  'house maid': ['maid', 'nanny', 'sitting', 'sitter', 'baby', 'housekeeper', 'ménagère', 'nounou', 'garde', 'foyer', 'sitting'],
  'painting': ['paint', 'peint', 'color', 'brush', 'pinceau', 'enduit'],
  'beauty': ['beauty', 'beauté', 'makeup', 'maquillage', 'hair', 'coiffure', 'barber', 'barb', 'nail', 'ongle', 'massage', 'esthet', 'salon', 'tress', 'wig', 'perruque', 'pédicure', 'manucure'],
  'carpentry': ['carpent', 'wood', 'furniture', 'cabinet', 'upholster', 'menuis', 'bois', 'meuble', 'placard', 'charpent'],
  'real estate agent': ['real estate', 'agent', 'house', 'land', 'property', 'rent', 'immob', 'maison', 'terrain', 'location', 'bail'],
  'moving service': ['move', 'moving', 'truck', 'déménag', 'camion', 'transport', 'towing', 'remorqu'],
  'delivery service': ['deliver', 'courier', 'driver', 'courier', 'taxi', 'bike', 'motorcycl', 'livrai', 'coursier', 'chauffeur', 'moto'],
  'child care': ['child', 'baby', 'sitting', 'sitter', 'nanny', 'kid', 'enfant', 'nounou', 'crèche', 'garde'],
  'elder care': ['elder', 'senior', 'nurse', 'nursing', 'medical', 'patient', 'personne âgée', 'vieux', 'infirm', 'santé'],
  'home nursing': ['nurse', 'nursing', 'medical', 'care', 'doctor', 'infirm', 'soin', 'médic', 'santé', 'docteur'],
  'shoe repair': ['shoe', 'cobbler', 'leather', 'cordonnier', 'chaussure', 'cuir'],
  'ac repair': ['ac ', 'air con', 'climat', 'ac-repair', 'fridge', 'refrigerat', 'frigo'],
  'appliance repair': ['appliance', 'repair', 'fix', 'machine', 'tv', 'fridge', 'microwave', 'stove', 'generator', 'répar', 'électroménag', 'télé', 'générateur'],
  'phone repair': ['phone', 'mobile', 'cell', 'repair', 'screen', 'téléphone', 'portable', 'répar', 'écran', 'laptop', 'tablet'],
  'computer repair': ['computer', 'laptop', 'desktop', 'pc', 'repair', 'software', 'network', 'ordinat', 'portable', 'répar', 'logiciel', 'réseau'],
  'generator repair': ['generator', 'engine', 'repair', 'fix', 'générateur', 'moteur', 'répar', 'groupe électrogène'],
  'roof repair': ['roof', 'leak', 'repair', 'toit', 'fuite', 'répar', 'charpente', 'étanchéité'],
  'masonry': ['mason', 'brick', 'cement', 'concrete', 'stone', 'maçon', 'brique', 'ciment', 'béton', 'pierre'],
  'tiling': ['tile', 'tiling', 'floor', 'carrel', 'sol'],
  'welding': ['weld', 'iron', 'metal', 'steel', 'soud', 'fer', 'métal', 'acier'],
  'pest control': ['pest', 'bug', 'insect', 'rat', 'fumigat', 'nuisible', 'cafard', 'souris'],
  'laundry service': ['laundry', 'wash', 'clean', 'dry clean', 'cloth', 'ironing', 'lessive', 'lavage', 'repassage', 'pressing', 'vêtement'],
  'tailoring': ['tailor', 'sew', 'coutur', 'hanger', 'fashion', 'design', 'dress', 'cloth', 'mode', 'styliste', 'vêtement'],
  'makeup artist': ['makeup', 'maquillage', 'artist', 'visage', 'beauty', 'beauté'],
  'hair stylist': ['hair', 'coiffure', 'stylist', 'braid', 'salon', 'tress', 'wig', 'perruque', 'cheveux'],
  'barber': ['barber', 'barb', 'shave', 'coiffeur', 'rasage'],
  'massage therapy': ['massage', 'therap', 'relax', 'spa', 'masseur'],
  'fitness trainer': ['fitness', 'train', 'coach', 'gym', 'workout', 'sport', 'muscu'],
  'event planning': ['event', 'plan', 'organiz', 'wedding', 'party', 'évèn', 'fête', 'mariage', 'anniversaire'],
  'catering': ['cater', 'food', 'cook', 'chef', 'meal', 'traiteur', 'nourriture', 'cuisine', 'repas'],
  'photography': ['photograph', 'photo', 'camera', 'shoot'],
  'videography': ['video', 'film', 'editor', 'movie', 'montage', 'caméra'],
  'dj service': ['dj', 'music', 'mix', 'disc jockey', 'musique', 'sono'],
  'decoration': ['decor', 'interior', 'design', 'event', 'party', 'décora', 'intérieur', 'fête', 'salle']
};

const matchesCategory = (providerSkills, categoryName) => {
  if (!categoryName || categoryName.toLowerCase() === 'all') return true;
  
  const catLower = categoryName.toLowerCase().trim();
  
  const skillsList = (providerSkills || []).flatMap(s => [
    s.toLowerCase(),
    translateService(s, { lng: 'en' }).toLowerCase(),
    translateService(s, { lng: 'fr' }).toLowerCase()
  ]);
  const skillsString = skillsList.join(' ');
  
  const keywords = CATEGORY_KEYWORDS[catLower];
  if (keywords) {
    return keywords.some(keyword => skillsString.includes(keyword));
  }
  
  return skillsString.includes(catLower);
};

const FILTERS = ['Rating', 'Price', 'Distance', 'Availability'];

const ProviderListScreen = ({ route, navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const { providers, favoriteProviderIds, toggleFavoriteProvider } = useAppContext();
  const category = route.params?.category;
  const verifiedOnly = Boolean(route.params?.verifiedOnly);
  const favoritesOnly = Boolean(route.params?.favoritesOnly);
  const [search, setSearch] = useState(route.params?.search || '');
  const [activeFilter, setActiveFilter] = useState('Rating');
  const [pendingFilter, setPendingFilter] = useState('Rating');
  const [showFilters, setShowFilters] = useState(false);
  const [topProviders, setTopProviders] = useState([]);

  useEffect(() => {
    if (!category || category === 'all') {
      api.get('/providers/top-of-month')
        .then(res => {
          if (res.data?.success) {
            setTopProviders(res.data.data);
          }
        })
        .catch(err => console.log('Error fetching top providers:', err));
    }
  }, [category]);

  const applyFilter = () => {
    setActiveFilter(pendingFilter);
    setShowFilters(false);
  };

  const resetFilter = () => {
    setPendingFilter('Rating');
    setActiveFilter('Rating');
  };



  // Improved filtering logic for real backend data
  const getProviderDistance = (provider) => {
    const rawDistance = provider.distanceKm ?? provider.distance ?? provider.distanceInKm;
    const parsedDistance = Number(rawDistance);
    return Number.isFinite(parsedDistance) ? parsedDistance : null;
  };

  const filtered = useMemo(() => providers.filter(p => {
    const searchLower = search.trim().toLowerCase();
    const catLower = category?.toLowerCase();
    
    const name = (p.user?.fullName || '').toLowerCase();
    const skills = (p.skills || []).flatMap(s => [
      s.toLowerCase(),
      translateService(s, { lng: 'en' }).toLowerCase(),
      translateService(s, { lng: 'fr' }).toLowerCase()
    ]).join(' ');
    const area = (p.serviceArea || '').toLowerCase();
    const combinedInfo = `${name} ${skills} ${area}`;

    // Filter by Category if provided in route
    if (catLower && catLower !== 'all' && !matchesCategory(p.skills || [], category)) return false;
    if (verifiedOnly && p.verification !== 'VERIFIED') return false;
    if (favoritesOnly && !favoriteProviderIds?.includes(p.id)) return false;

    // City locking filter for physical services
    const isRemote = isRemoteSkill(category || search);
    if (!isRemote) {
      if (p.user?.country && user?.country && p.user.country !== user.country) {
        return false;
      }
      const clientLoc = (user?.location || '').toLowerCase().trim();
      const providerArea = (p.serviceArea || '').toLowerCase().trim();
      if (clientLoc && providerArea) {
        const clientParts = clientLoc.split(',').map(s => s.trim()).filter(Boolean);
        const providerParts = providerArea.split(',').map(s => s.trim()).filter(Boolean);
        const hasOverlap = clientParts.some(cp => providerArea.includes(cp)) || 
                           providerParts.some(pp => clientLoc.includes(pp)) ||
                           providerArea.includes('all');
        if (!hasOverlap && !providerArea.includes('douala') && !providerArea.includes('yaoundé') && !providerArea.includes('buea') && !providerArea.includes('bamenda')) {
          return false;
        }
      }
    }

    // Filter by Search terms
    if (!searchLower) return true;
    const searchTerms = searchLower.split(/\s+/).filter(t => t.length > 0);
    return searchTerms.every(term => combinedInfo.includes(term));
  }).sort((a, b) => {
    // Sort by active profile boost first!
    const isBoostedA = a.boostExpiresAt && new Date(a.boostExpiresAt) > new Date();
    const isBoostedB = b.boostExpiresAt && new Date(b.boostExpiresAt) > new Date();
    if (isBoostedA && !isBoostedB) return -1;
    if (!isBoostedA && isBoostedB) return 1;

    // Prioritize provider in client's quarter/city for physical jobs
    const isRemote = isRemoteSkill(category || search);
    if (!isRemote) {
      const clientLoc = (user?.location || '').toLowerCase().trim();
      if (clientLoc) {
        const quartersA = (a.serviceArea || '').toLowerCase().split(',').map(s => s.trim());
        const quartersB = (b.serviceArea || '').toLowerCase().split(',').map(s => s.trim());
        
        // Exact quarter match priority (e.g. client is in "Kotto", provider operates in "Kotto")
        const exactA = quartersA.some(q => q.length > 2 && clientLoc.includes(q));
        const exactB = quartersB.some(q => q.length > 2 && clientLoc.includes(q));
        if (exactA && !exactB) return -1;
        if (!exactA && exactB) return 1;

        // General city overlap priority
        const cityA = (a.serviceArea || '').toLowerCase();
        const cityB = (b.serviceArea || '').toLowerCase();
        const matchesA = cityA.includes(clientLoc) || clientLoc.includes(cityA);
        const matchesB = cityB.includes(clientLoc) || clientLoc.includes(cityB);
        if (matchesA && !matchesB) return -1;
        if (!matchesA && matchesB) return 1;
      }
    }

    if (activeFilter === 'Rating') {
      return Number(b.rating || 0) - Number(a.rating || 0);
    }

    if (activeFilter === 'Price') {
      return Number(a.rate || Number.MAX_SAFE_INTEGER) - Number(b.rate || Number.MAX_SAFE_INTEGER);
    }

    if (activeFilter === 'Distance') {
      const distanceA = getProviderDistance(a) ?? Number.MAX_SAFE_INTEGER;
      const distanceB = getProviderDistance(b) ?? Number.MAX_SAFE_INTEGER;
      return distanceA - distanceB;
    }

    if (activeFilter === 'Availability') {
      return Number(Boolean(b.isAvailable ?? b.user?.isOnline)) - Number(Boolean(a.isAvailable ?? a.user?.isOnline));
    }

    return 0;
  }), [providers, search, category, verifiedOnly, favoritesOnly, favoriteProviderIds, activeFilter]);

  const renderProvider = ({ item }) => {
    const rawAvatar = item.user?.avatar 
      || item.avatar 
      || item.image 
      || (typeof item.portfolio?.[0] === 'string' ? item.portfolio[0] : (item.portfolio?.[0]?.imageUrl || item.portfolio?.[0]?.url || item.portfolio?.[0]?.image));
    const avatarUri = getMediaUrl(rawAvatar);
    const isFavorite = favoriteProviderIds?.includes(item.id);
    const isVerified = item.verification === 'VERIFIED' || (item.boostExpiresAt && new Date(item.boostExpiresAt) > new Date());
    const ratingVal = Number(item.rating || 0).toFixed(1);
    const reviewCountVal = item.reviewCount || (item.reviews?.length) || 0;

    const titleText = item.portfolio?.[0]?.title || item.bio || (item.skills && item.skills.length > 0 ? translateService(item.skills[0]) : item.user?.fullName);
    const currencyStr = getCurrencyForUser(item.user?.country || user?.country || 'Cameroon');
    const priceText = item.rate ? `${item.rate.toLocaleString()} ${currencyStr}` : t('profile.contactForPrice', 'Contact for price');

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('ProviderProfile', { provider: item })}
        activeOpacity={0.88}
      >
        {/* Left Provider Avatar Column */}
        <View style={styles.cardImageContainer}>
          <UserAvatar
            uri={avatarUri}
            name={item.user?.fullName || item.name || 'User'}
            size={110}
            radius={12}
            style={styles.cardImage}
          />

          {isVerified && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>{t('common.pro', 'Pro')}</Text>
            </View>
          )}
        </View>

        {/* Right Info Column */}
        <View style={styles.cardContent}>
          {/* Top Row: Rating & Heart */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardRatingGroup}>
              <MaterialCommunityIcons name="star" size={15} color="#F59E0B" />
              <Text style={[styles.cardRatingVal, { color: colors.text }]}>{ratingVal}</Text>
              <Text style={[styles.cardReviewCount, { color: colors.textSecondary }]}>({reviewCountVal})</Text>
            </View>
            <TouchableOpacity
              style={styles.cardFavoriteBtn}
              onPress={() => toggleFavoriteProvider?.(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? '#EF4444' : (isDarkMode ? '#94A3B8' : '#CBD5E1')}
              />
            </TouchableOpacity>
          </View>

          {/* Title / Description Excerpt */}
          <Text style={[styles.cardTitleText, { color: colors.text }]} numberOfLines={2}>
            {titleText}
          </Text>

          {/* Bottom Row: Price */}
          <View style={styles.cardPriceRow}>
            <Text style={[styles.cardPriceFrom, { color: colors.textSecondary }]}>
              {t('common.from', 'From')}{' '}
              <Text style={[styles.cardPriceValue, { color: colors.text }]}>{priceText}</Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {favoritesOnly ? t('favorites.title') : verifiedOnly ? t('auth.verifiedPros') : category && category !== 'all' ? (currentLanguage === 'fr' ? `Pros - ${translateService(category)}` : `${translateService(category)} Pros`) : t('favorites.discoverPros')}
          </Text>
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: showFilters ? colors.accent : colors.card }]}
            onPress={() => {
              setPendingFilter(activeFilter);
              setShowFilters((value) => !value);
            }}
          >
            <MaterialCommunityIcons name="tune-variant" size={20} color={showFilters ? '#FFF' : colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={colors.placeholder} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('bookings.searchPlaceholder')}
              placeholderTextColor={colors.placeholder}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.placeholder} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showFilters && (
          <View style={[styles.filterPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.filterPanelHeader}>
              <View>
                <Text style={[styles.filterPanelTitle, { color: colors.text }]}>{t('bookings.sortResults')}</Text>
                <Text style={[styles.filterPanelSub, { color: colors.textSecondary }]}>{t('bookings.filterChooseApply')}</Text>
              </View>
              {activeFilter !== 'Rating' && (
                <TouchableOpacity onPress={resetFilter} style={styles.resetFilterBtn}>
                  <Text style={styles.resetFilterText}>{t('bookings.reset')}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.filtersRow}>
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterChip,
                    { backgroundColor: pendingFilter === f ? colors.accent : (isDarkMode ? '#0F172A' : '#F8FAFC'), borderColor: pendingFilter === f ? colors.accent : colors.border },
                  ]}
                  onPress={() => setPendingFilter(f)}
                >
                  <Text style={[styles.filterText, { color: pendingFilter === f ? '#FFF' : colors.textSecondary }]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.applyFilterBtn,
                { backgroundColor: pendingFilter === activeFilter ? (isDarkMode ? '#334155' : '#CBD5E1') : colors.accent },
              ]}
              onPress={applyFilter}
              disabled={pendingFilter === activeFilter}
            >
              <MaterialCommunityIcons name="check" size={18} color="#FFF" />
              <Text style={styles.applyFilterText}>
                {pendingFilter === activeFilter ? `Applied: ${activeFilter}` : `Apply ${pendingFilter}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          ListHeaderComponent={(!category || category === 'all') && !search && !verifiedOnly && !favoritesOnly && topProviders.length > 0 ? (
            <View style={styles.topProvidersSection}>
              <Text style={[styles.topProvidersTitle, { color: colors.text }]}>{t('bookings.providersOfMonth')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topProvidersScroll}>
                {topProviders.map(item => (
                  <TouchableOpacity key={`top-${item.id}`} style={[styles.topCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('ProviderProfile', { provider: item })}>
                    <UserAvatar uri={getMediaUrl(item.image || item.avatar || item.user?.avatar)} name={item.user?.fullName} size={50} radius={25} style={styles.topAvatar} />
                    <Text style={[styles.topProvName, { color: colors.text }]} numberOfLines={1}>{item.user?.fullName}</Text>
                    <View style={styles.topRatingRow}>
                      <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.topRatingText}>{Number(item.rating || 0).toFixed(1)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
          renderItem={renderProvider}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="account-search-outline" size={80} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('bookings.noProfessionalsFound')}</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{t('bookings.emptySearchInstructions')}</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingVertical: 15,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  filterBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, paddingHorizontal: 15, height: 52,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  filterPanel: { marginHorizontal: 20, marginBottom: 15, borderRadius: 0, borderWidth: 1, padding: 14 },
  filterPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  filterPanelTitle: { fontSize: 13, fontWeight: '900', marginBottom: 4 },
  filterPanelSub: { fontSize: 11, lineHeight: 15, fontWeight: '600', maxWidth: 230 },
  resetFilterBtn: { paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  resetFilterText: { color: '#0D9488', fontSize: 12, fontWeight: '900' },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 0,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: '700' },
  applyFilterBtn: {
    height: 46,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyFilterText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    height: 108,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  cardImageContainer: {
    width: 110,
    height: 108,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#F97316',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardContent: {
    flex: 1,
    height: 108,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardRatingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardRatingVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  cardReviewCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFavoriteBtn: {
    padding: 2,
  },
  cardTitleText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    marginVertical: 2,
  },
  cardPriceRow: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  cardPriceFrom: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardPriceValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  chatBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 0, paddingVertical: 12,
  },
  chatBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  callBtn: {
    width: 48, height: 48, borderRadius: 0, justifyContent: 'center', alignItems: 'center', borderWidth: 1
  },
  topProvidersScroll: { paddingHorizontal: 20, gap: 12 },
  topCard: { width: 110, padding: 12, borderRadius: 0, borderWidth: 1, alignItems: 'center' },
  topAvatar: { marginBottom: 8 },
  topProvName: { fontSize: 13, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  topRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  topRatingText: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
});

export default ProviderListScreen;
