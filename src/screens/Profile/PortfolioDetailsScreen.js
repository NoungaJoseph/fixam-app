import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import TealSafeAreaView from '../../components/Common/TealSafeAreaView';

const { width } = Dimensions.get('window');

const PortfolioDetailsScreen = ({ route, navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { title, items = [], type } = route.params || {};

  const [selectedProject, setSelectedProject] = React.useState(null);
  const [projectModalVisible, setProjectModalVisible] = React.useState(false);

  const handleOpenProjectDetail = (project) => {
    setSelectedProject(project);
    setProjectModalVisible(true);
  };

  const renderProjectItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.8}
        onPress={() => handleOpenProjectDetail(item)}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.projectImage} />
        ) : (
          <View style={[styles.projectImage, styles.projectImageFallback, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
            <MaterialCommunityIcons name="image-outline" size={32} color="#94A3B8" />
          </View>
        )}
        <View style={styles.projectContent}>
          <Text style={[styles.projectTitle, { color: colors.text }]} numberOfLines={1}>{item.title || 'Project'}</Text>
          {item.description ? (
            <Text style={[styles.projectDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCertificateItem = ({ item }) => {
    return (
      <View style={[styles.credentialRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.credentialIcon, { backgroundColor: isDarkMode ? '#115E5920' : '#E6FDF3' }]}>
          <MaterialCommunityIcons name="certificate-outline" size={24} color="#0D9488" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.credentialTitle, { color: colors.text }]}>{item.title || 'Certificate'}</Text>
          <Text style={[styles.credentialMeta, { color: colors.textSecondary }]}>
            {[item.issuer, item.year].filter(Boolean).join(' | ') || 'Credential added'}
          </Text>
        </View>
      </View>
    );
  };

  const renderWorkHistoryItem = ({ item }) => {
    return (
      <View style={[styles.credentialRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.credentialIcon, { backgroundColor: isDarkMode ? '#1E3A8A20' : '#EFF6FF' }]}>
          <MaterialCommunityIcons name="briefcase-outline" size={24} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.credentialTitle, { color: colors.text }]}>{item.title || item.company || 'Work Experience'}</Text>
          <Text style={[styles.credentialMeta, { color: colors.textSecondary }]}>
            {[item.company, item.period].filter(Boolean).join(' | ')}
          </Text>
          {item.description ? (
            <Text style={[styles.credentialDesc, { color: colors.textSecondary }]}>{item.description}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    if (type === 'projects') return renderProjectItem({ item });
    if (type === 'certificates') return renderCertificateItem({ item });
    return renderWorkHistoryItem({ item });
  };

  return (
    <TealSafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title || t('common.details', 'Details')}</Text>
        <View style={{ width: 42 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, index) => `${type}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        numColumns={type === 'projects' ? 2 : 1}
        columnWrapperStyle={type === 'projects' ? styles.gridRow : null}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#94A3B8" />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('common.noItems', 'No details available.')}
            </Text>
          </View>
        }
      />

      {/* Project Details Modal */}
      {selectedProject && (
        <Modal
          visible={projectModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setProjectModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>{selectedProject.title || 'Project Details'}</Text>
                <TouchableOpacity onPress={() => setProjectModalVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                  <MaterialCommunityIcons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              {selectedProject.imageUrl && (
                <Image source={{ uri: selectedProject.imageUrl }} style={styles.modalImage} />
              )}

              <View style={styles.modalBody}>
                <Text style={[styles.modalDescLabel, { color: colors.textSecondary }]}>{t('jobs.description', 'Description')}</Text>
                <Text style={[styles.modalDescText, { color: colors.text }]}>
                  {selectedProject.description || t('jobs.noAdditionalDetails', 'No details provided.')}
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </TealSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  listContent: { padding: 16, paddingBottom: 32 },
  gridRow: { justifyContent: 'space-between' },
  projectCard: {
    width: (width - 44) / 2,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  projectImage: { width: '100%', height: 110, resizeMode: 'cover' },
  projectImageFallback: { height: 110, justifyContent: 'center', alignItems: 'center' },
  projectContent: { padding: 12, gap: 4 },
  projectTitle: { fontSize: 14, fontWeight: '800' },
  projectDesc: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  credentialIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  credentialTitle: { fontSize: 15, fontWeight: '800' },
  credentialMeta: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  credentialDesc: { fontSize: 13, fontWeight: '500', marginTop: 6, lineHeight: 18 },
  emptyContainer: { flex: 1, paddingVertical: 100, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 450, borderRadius: 16, borderWidth: 1, padding: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', flex: 1, marginRight: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalImage: { width: '100%', height: 220, borderRadius: 8, resizeMode: 'cover', marginBottom: 16 },
  modalBody: { gap: 6 },
  modalDescLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  modalDescText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
});

export default PortfolioDetailsScreen;
