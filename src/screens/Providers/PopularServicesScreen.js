import React, { useMemo, useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { FlatList, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { translateService } from '../../i18n/translate';
import { POPULAR_SERVICE_CATALOG, POPULAR_SERVICE_IMAGES } from '../../data/popularServices';

const GROUPS = ['All', 'Home', 'Repair', 'Lifestyle', 'Logistics', 'Care', 'Events', 'Professional', 'Outdoor', 'Auto'];

const PopularServicesScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [group, setGroup] = useState('All');
  const topServices = POPULAR_SERVICE_CATALOG.slice(0, 15);
  const visibleServices = useMemo(
    () => POPULAR_SERVICE_CATALOG.filter(service => group === 'All' || service.group === group),
    [group]
  );

  const openService = (service) => {
    navigation.navigate('ProviderList', { category: service.name, source: 'popular-services' });
  };

  const renderTopService = (service) => (
    <TouchableOpacity key={service.name} style={[styles.topServiceCard, { backgroundColor: isDarkMode ? '#18181B' : '#FFF' }]} onPress={() => openService(service)} activeOpacity={0.86}>
      <View style={styles.topImageSlot}>
        <Image source={POPULAR_SERVICE_IMAGES[service.imageName]} style={styles.serviceImage} resizeMode="cover" />
      </View>
      <Text style={[styles.topServiceTitle, { color: colors.text }]} numberOfLines={2}>{translateService(service.name)}</Text>
    </TouchableOpacity>
  );

  const renderExploreService = ({ item }) => (
    <TouchableOpacity style={[styles.exploreCard, { backgroundColor: isDarkMode ? '#18181B' : '#FFF', borderColor: colors.border }]} onPress={() => openService(item)} activeOpacity={0.84}>
      <View style={styles.exploreImageSlot}>
        <Image source={POPULAR_SERVICE_IMAGES[item.imageName]} style={styles.serviceImage} resizeMode="cover" />
      </View>
      <View style={styles.exploreCopy}>
        <View style={[styles.exploreIconWrap, { backgroundColor: item.colors?.[0] || '#0D9488' }]}>
          <MaterialCommunityIcons name={item.icon} size={17} color="#FFF" />
        </View>
        <View style={styles.exploreTextWrap}>
          <Text style={[styles.exploreTitle, { color: colors.text }]} numberOfLines={2}>{translateService(item.name)}</Text>
          <Text style={[styles.exploreSub, { color: colors.textSecondary }]} numberOfLines={1}>{item.group}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: isDarkMode ? '#18181B' : '#FFF', borderColor: colors.border }]} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: isDarkMode ? '#18181B' : '#FFF', borderColor: colors.border }]} onPress={() => navigation.navigate('ProviderList')}>
            <MaterialCommunityIcons name="magnify" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={visibleServices}
          numColumns={2}
          keyExtractor={(item) => item.name}
          renderItem={renderExploreService}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.exploreRow}
          extraData={group}
          ListHeaderComponent={(
            <>
              <View style={styles.hero}>
                <Text style={[styles.title, { color: colors.text }]}>{t('home.popularServices')}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('home.popularServicesSubtitle')}</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupScroll}>
                {GROUPS.map(item => {
                  const active = item === group;
                  return (
                    <TouchableOpacity key={item} style={[styles.groupChip, { borderColor: active ? '#0D9488' : colors.border, backgroundColor: active ? '#0D9488' : 'transparent' }]} onPress={() => setGroup(item)}>
                      <Text style={[styles.groupText, { color: active ? '#FFF' : colors.text }]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.popularServices')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topScroll}>
                {topServices.map(renderTopService)}
              </ScrollView>

              <View style={styles.exploreHeader}>
                <Text style={[styles.sectionTitle, styles.exploreTitleHeader, { color: colors.text }]}>{t('home.exploreMore')}</Text>
                {group !== 'All' && (
                  <TouchableOpacity onPress={() => setGroup('All')} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Text style={styles.clearFilter}>{t('home.viewAll')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12 },
  headerBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 36, paddingHorizontal: 14 },
  hero: { alignItems: 'center', paddingHorizontal: 14, paddingTop: 18, paddingBottom: 22 },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 21, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  groupScroll: { paddingHorizontal: 4, gap: 10, paddingBottom: 22 },
  groupChip: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  groupText: { fontSize: 13, fontWeight: '900' },
  sectionTitle: { fontSize: 21, fontWeight: '900', marginBottom: 14 },
  topScroll: { paddingLeft: 4, paddingRight: 4, gap: 12 },
  topServiceCard: { width: 150, borderRadius: 8, overflow: 'hidden' },
  topImageSlot: { height: 102, overflow: 'hidden', backgroundColor: '#E2E8F0' },
  serviceImage: { width: '100%', height: '100%' },
  topServiceTitle: { minHeight: 56, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, lineHeight: 18, fontWeight: '900' },
  exploreHeader: { marginTop: 26, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exploreTitleHeader: { marginBottom: 0 },
  clearFilter: { color: '#0D9488', fontSize: 13, fontWeight: '900' },
  exploreRow: { gap: 12 },
  exploreCard: { flex: 1, minHeight: 204, borderRadius: 8, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  exploreImageSlot: { height: 112, overflow: 'hidden', backgroundColor: '#E2E8F0' },
  exploreCopy: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },
  exploreIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  exploreTextWrap: { flex: 1, minWidth: 0 },
  exploreTitle: { minHeight: 38, fontSize: 14, lineHeight: 19, fontWeight: '900' },
  exploreSub: { marginTop: 4, fontSize: 12, fontWeight: '700' },
});

export default PopularServicesScreen;
