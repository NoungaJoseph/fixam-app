import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import TealSafeAreaView from '../../components/Common/TealSafeAreaView';
import UserAvatar from '../../components/UserAvatar';
import { getCurrencyForUser } from '../../constants/countries';
import api, { getMediaUrl } from '../../services/api';

const PostProjectScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { publishedProjects, publishProject, deleteProject, popularCategories } = useAppContext();

  const editProject = route.params?.editProject;
  const [editingId, setEditingId] = useState(editProject?.id || null);

  // Mode: 'LIST' (shows published projects) vs 'FORM' (create new project)
  const [viewMode, setViewMode] = useState(editProject ? 'FORM' : 'LIST');
  const [loading, setLoading] = useState(false);

  // Form States
  const [title, setTitle] = useState(editProject?.title || '');
  const [category, setCategory] = useState(editProject?.category || popularCategories?.[0]?.name || 'Web Development');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategorySelected, setIsCustomCategorySelected] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [modalKeyboardOffset, setModalKeyboardOffset] = useState(0);
  const categoryScrollRef = useRef(null);

  useEffect(() => {
    if (editProject) {
      setViewMode('FORM');
      setEditingId(editProject.id);
      setTitle(editProject.title || '');
      setCategory(editProject.category || 'Web Development');
      setDescription(editProject.description || '');
      if (Array.isArray(editProject.images) && editProject.images.length > 0) {
        setImageUris(editProject.images);
      } else if (editProject.imageUrl) {
        setImageUris([editProject.imageUrl]);
      }
      if (Array.isArray(editProject.videos) && editProject.videos.length > 0) {
        setVideoUris(editProject.videos);
      } else if (editProject.video || editProject.videoUrl) {
        const existingVideo = editProject.video || editProject.videoUrl;
        setVideoUris(Array.isArray(existingVideo) ? existingVideo : [existingVideo]);
      }
      if (editProject.packages) setTierData(editProject.packages);
    }
  }, [editProject]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        if (showCategoryModal) {
          setModalKeyboardOffset(e.endCoordinates.height);
          setTimeout(() => {
            categoryScrollRef.current?.scrollToEnd({ animated: true });
          }, 80);
        }
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setModalKeyboardOffset(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [showCategoryModal]);

  const [description, setDescription] = useState('');
  const [imageUris, setImageUris] = useState([]);
  const [videoUris, setVideoUris] = useState([]);
  const [pickingMedia, setPickingMedia] = useState(false);

  // Tier Package Config (Basic, Standard, Premium)
  const [activeTierId, setActiveTierId] = useState('standard'); // 'basic' | 'standard' | 'premium'

  const [tierData, setTierData] = useState({
    basic: {
      enabled: false,
      name: 'Basic Package',
      summary: '',
      price: '',
      deliveryDays: '',
      revisions: '',
      expressDeliveryEnabled: false,
      expressDeliveryDays: '4',
      expressDeliveryPrice: '',
      features: [],
    },
    standard: {
      enabled: true,
      name: 'Standard Package',
      summary: '',
      price: '',
      deliveryDays: '',
      revisions: '',
      expressDeliveryEnabled: false,
      expressDeliveryDays: '4',
      expressDeliveryPrice: '',
      features: [],
    },
    premium: {
      enabled: false,
      name: 'Premium Package',
      summary: '',
      price: '',
      deliveryDays: '',
      revisions: '',
      expressDeliveryEnabled: false,
      expressDeliveryDays: '4',
      expressDeliveryPrice: '',
      features: [],
    },
  });

  const currencyStr = getCurrencyForUser(user?.country || 'Cameroon');

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory(popularCategories?.[0]?.name || 'Web Development');
    setCustomCategory('');
    setIsCustomCategorySelected(false);
    setDescription('');
    setImageUris([]);
    setVideoUris([]);
    setTierData({
      basic: { enabled: false, name: 'Basic Package', summary: '', price: '', deliveryDays: '', revisions: '', expressDeliveryDays: '', expressDeliveryPrice: '', features: [] },
      standard: { enabled: true, name: 'Standard Package', summary: '', price: '', deliveryDays: '', revisions: '', expressDeliveryDays: '', expressDeliveryPrice: '', features: [] },
      premium: { enabled: false, name: 'Premium Package', summary: '', price: '', deliveryDays: '', revisions: '', expressDeliveryDays: '', expressDeliveryPrice: '', features: [] },
    });
    setActiveTierId('standard');
  };

  // Filter provider's own projects
  const myProjects = (publishedProjects || []).filter(
    p => p.provider?.id === user?.id || p.provider?.user?.id === user?.id
  );

  // Helper to upload a single local file URI to the backend storage
  const uploadMediaToBackend = async (uri, type = 'file') => {
    if (!uri || typeof uri !== 'string') return null;
    if (!uri.startsWith('file:') && !uri.startsWith('content:')) {
      return uri; // Already a remote backend/cloud URL
    }
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || (type === 'video' ? 'video.mp4' : 'image.jpg');
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : (type === 'video' ? 'mp4' : 'jpg');
      const mimeType = type === 'video'
        ? `video/${ext === 'mov' ? 'quicktime' : (ext === '3gp' ? '3gpp' : ext)}`
        : `image/${ext === 'png' ? 'png' : 'jpeg'}`;

      formData.append('file', {
        uri,
        name: filename,
        type: mimeType,
      });

      const res = await api.post('/upload/portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const serverUrl = res.data?.url || res.data?.data?.url;
      if (!serverUrl) {
        throw new Error('Server did not return a valid media URL.');
      }
      return serverUrl;
    } catch (err) {
      console.log('[Media Upload Error]:', err?.response?.data || err.message);
      throw new Error(`Failed to upload ${type}: ${err?.response?.data?.message || err.message}`);
    }
  };

  // Pick Images from device
  const handlePickImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('common.error'), t('permissions.mediaLibraryRequired', 'Media library permission is required to select photos.'));
        return;
      }

      setPickingMedia(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const picked = result.assets.map(a => a.uri);
        setImageUris(prev => [...prev, ...picked]);
      }
    } catch (err) {
      Alert.alert(t('common.error'), err.message || t('common.tryAgain'));
    } finally {
      setPickingMedia(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImageUris(prev => prev.filter((_, idx) => idx !== index));
  };

  // Pick Multiple Videos from device (Max 1 min duration per video, NO file size limit)
  const handlePickVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('common.error'), t('permissions.mediaLibraryRequired', 'Media library permission is required to select video.'));
        return;
      }

      setPickingMedia(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: true,
        videoMaxDuration: 60,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const validVideos = [];
        for (const asset of result.assets) {
          const durationSec = asset.duration ? (asset.duration > 1000 ? asset.duration / 1000 : asset.duration) : 0;
          if (durationSec > 60) {
            Alert.alert(
              t('common.error'),
              t('project.videoDurationLimit', 'Demo video duration must not exceed 1 minute (60 seconds).')
            );
            setPickingMedia(false);
            return;
          }
          validVideos.push(asset.uri);
        }
        setVideoUris(prev => [...prev, ...validVideos]);
      }
    } catch (err) {
      Alert.alert(t('common.error'), err.message || t('common.tryAgain'));
    } finally {
      setPickingMedia(false);
    }
  };

  const handleRemoveVideo = (index) => {
    setVideoUris(prev => prev.filter((_, idx) => idx !== index));
  };

  // Dynamic Features handler for active tier
  const handleAddFeature = (tierId) => {
    setTierData(prev => ({
      ...prev,
      [tierId]: {
        ...prev[tierId],
        features: [...prev[tierId].features, '']
      }
    }));
  };

  const handleUpdateFeature = (tierId, featureIndex, text) => {
    setTierData(prev => {
      const updatedFeatures = [...prev[tierId].features];
      updatedFeatures[featureIndex] = text;
      return {
        ...prev,
        [tierId]: { ...prev[tierId], features: updatedFeatures }
      };
    });
  };

  const handleRemoveFeature = (tierId, featureIndex) => {
    setTierData(prev => {
      const updatedFeatures = prev[tierId].features.filter((_, idx) => idx !== featureIndex);
      return {
        ...prev,
        [tierId]: { ...prev[tierId], features: updatedFeatures }
      };
    });
  };

  const handleToggleTier = (tierId) => {
    setTierData(prev => ({
      ...prev,
      [tierId]: { ...prev[tierId], enabled: !prev[tierId].enabled }
    }));
  };

  const handleUpdateTierField = (tierId, field, val) => {
    setTierData(prev => ({
      ...prev,
      [tierId]: { ...prev[tierId], [field]: val }
    }));
  };

  // Form Submission
  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('project.titleRequired', 'Please enter a project title'));
      return;
    }
    if (!description.trim()) {
      Alert.alert(t('common.error'), t('project.descRequired', 'Please enter a project description'));
      return;
    }

    const finalCat = isCustomCategorySelected ? (customCategory.trim() || 'Other') : category;

    // Filter enabled tiers
    const enabledTiers = Object.keys(tierData)
      .filter(id => tierData[id].enabled)
      .map(id => {
        const item = tierData[id];
        return {
          id,
          name: item.name,
          price: Number(item.price || 50),
          deliveryDays: Number(item.deliveryDays || 3),
          revisions: Number(item.revisions || 1),
          features: item.features.filter(f => f.trim().length > 0),
        };
      });

    if (enabledTiers.length === 0) {
      Alert.alert(t('common.error'), t('project.atLeastOnePackage', 'Please enable and fill at least one package tier.'));
      return;
    }

    setLoading(true);
    try {
      // 1. Upload local images to backend server storage
      const uploadedImages = [];
      for (const imgUri of imageUris) {
        const uploadedUrl = await uploadMediaToBackend(imgUri, 'image');
        if (uploadedUrl) uploadedImages.push(uploadedUrl);
      }

      // 2. Upload local videos to backend server storage
      const uploadedVideos = [];
      for (const vidUri of videoUris) {
        const uploadedUrl = await uploadMediaToBackend(vidUri, 'video');
        if (uploadedUrl) uploadedVideos.push(uploadedUrl);
      }

      const finalImages = uploadedImages.length > 0 ? uploadedImages : (imageUris.length > 0 ? imageUris : [user?.avatar].filter(Boolean));
      const finalVideos = uploadedVideos.length > 0 ? uploadedVideos : videoUris;
      const primaryVideo = finalVideos[0] || null;

      const projectPayload = {
        ...(editingId ? { id: editingId } : {}),
        title: title.trim(),
        category: finalCat,
        description: description.trim(),
        imageUrl: finalImages[0] || null,
        images: finalImages,
        video: primaryVideo,
        videoUrl: primaryVideo,
        videos: finalVideos,
        price: enabledTiers[0]?.price || 50,
        tiers: enabledTiers,
        packages: tierData,
        providerId: user?.id,
        provider: {
          id: user?.id,
          user: {
            id: user?.id,
            fullName: user?.fullName,
            avatar: user?.avatar,
            country: user?.country,
          },
          rating: user?.rating || 5.0,
          reviewCount: user?.reviewCount || 0,
        }
      };

      await publishProject(projectPayload);
      const successMsg = editingId
        ? t('project.updatedSuccess', 'Your project has been successfully updated!')
        : t('project.publishedSuccess', 'Your project has been successfully published!');
      Alert.alert(
        t('common.success'),
        successMsg,
        [{ text: 'OK', onPress: () => { resetForm(); setViewMode('LIST'); } }]
      );
    } catch (err) {
      Alert.alert(t('common.error'), err.message || t('common.tryAgain'));
    } finally {
      setLoading(false);
    }
  };

  // Filtered categories for dropdown
  const filteredCategories = (popularCategories || []).filter(c =>
    c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  return (
    <TealSafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#1F2937' : '#E2E8F0' }]}>
        {viewMode === 'LIST' ? (
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={[styles.headerIconBtn, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setViewMode('LIST')} style={[styles.headerIconBtn, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
        )}

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {viewMode === 'LIST' ? t('project.myProjects', 'My Published Projects') : editingId ? t('project.editProject', 'Edit Project') : t('project.createNew', 'Create New Project')}
        </Text>

        {viewMode === 'LIST' ? (
          <TouchableOpacity
            onPress={() => { resetForm(); setViewMode('FORM'); }}
            style={[styles.addProjectHeaderBtn, { backgroundColor: colors.accent }]}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* VIEW MODE 1: PUBLISHED PROJECTS LIST */}
      {viewMode === 'LIST' ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {myProjects.length > 0 ? (
            myProjects.map((item) => (
              <View
                key={item.id}
                style={[styles.projectListItemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => navigation.navigate('ProjectDetail', { project: item, provider: item.provider })}
                  activeOpacity={0.88}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: getMediaUrl(item.imageUrl) }} style={styles.projectListThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.projectListThumb, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }]}>
                      <UserAvatar uri={getMediaUrl(user?.avatar)} name={user?.fullName} size={40} />
                    </View>
                  )}

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.projectListItemTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.projectListItemCat, { color: colors.accent }]}>
                      {item.category}
                    </Text>
                    <Text style={[styles.projectListItemPrice, { color: colors.textSecondary }]}>
                      {currencyStr} {item.price} • {item.tiers?.length || 1} {t('project.packagesTitle', 'Packages')}
                    </Text>
                  </View>

                  <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Edit / Delete actions */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }}
                    onPress={() => navigation.navigate('PostProject', { editProject: item })}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.accent} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accent }}>{t('common.edit', 'Edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, backgroundColor: isDarkMode ? '#1E293B' : '#FEF2F2' }}
                    onPress={() => {
                      Alert.alert(
                        t('project.deleteTitle', 'Delete Project'),
                        t('project.deleteConfirm', 'Are you sure you want to delete this project? This action cannot be undone.'),
                        [
                          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                          {
                            text: t('common.delete', 'Delete'),
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await deleteProject(item.id);
                                Alert.alert(t('common.success'), t('project.deletedSuccess', 'Project deleted successfully.'));
                              } catch (err) {
                                Alert.alert(t('common.error'), t('common.tryAgain'));
                              }
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>{t('common.delete', 'Delete')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateBox}>
              <MaterialCommunityIcons name="folder-outline" size={64} color={isDarkMode ? '#475569' : '#CBD5E1'} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                {t('project.noProjectsTitle', 'No Projects Published Yet')}
              </Text>
              <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
                {t('project.noProjectsSub', 'Publish your first project to display your work and services on the client marketplace.')}
              </Text>
              <TouchableOpacity
                style={[styles.publishFirstBtn, { backgroundColor: colors.accent }]}
                onPress={() => setViewMode('FORM')}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                <Text style={styles.publishFirstBtnText}>{t('project.publishFirst', 'Publish Your First Project')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        /* VIEW MODE 2: PROJECT CREATION FORM */
        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={60}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Project Title */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('project.title', 'Project Title')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('project.titlePlaceholder', 'e.g. Custom Responsive Web Application Development')}
              placeholderTextColor={colors.placeholder}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Category Dropdown Picker */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('project.category', 'Category')} *</Text>
            <TouchableOpacity
              style={[styles.dropdownBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[styles.dropdownBtnText, { color: colors.text }]}>
                {isCustomCategorySelected ? `Other: ${customCategory || 'Custom Category'}` : category}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Project Description */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('project.description', 'Project Description')} *</Text>
            <TextInput
              style={[styles.input, styles.multiInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('project.descPlaceholder', 'Describe what you deliver in this project, work process, and client requirements...')}
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* MEDIA UPLOADS FROM DEVICE */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('project.uploadImages', 'Project Images (Upload from Device)')}</Text>
            <TouchableOpacity
              style={[styles.mediaPickBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F0FDFA', borderColor: colors.accent }]}
              onPress={handlePickImages}
            >
              <MaterialCommunityIcons name="image-plus" size={24} color={colors.accent} />
              <Text style={[styles.mediaPickBtnText, { color: colors.accent }]}>
                {t('project.pickImagesAction', 'Pick Images from Gallery')}
              </Text>
            </TouchableOpacity>

            {/* Thumbnail Row */}
            {imageUris.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 10 }}>
                {imageUris.map((uri, idx) => (
                  <View key={idx} style={styles.thumbWrap}>
                    <Image source={{ uri }} style={styles.uploadedThumb} resizeMode="cover" />
                    <TouchableOpacity style={styles.removeThumbBtn} onPress={() => handleRemoveImage(idx)}>
                      <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Video Upload Section (Multiple Videos) */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('project.uploadVideo', 'Demo Videos (Max 1 min duration each)')}</Text>
            <TouchableOpacity
              style={[styles.mediaPickBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]}
              onPress={handlePickVideo}
            >
              <MaterialCommunityIcons name="video-plus" size={24} color={colors.accent} />
              <Text style={[styles.mediaPickBtnText, { color: colors.accent }]}>
                {videoUris.length > 0 ? t('project.addAnotherVideo', 'Pick Another Video') : t('project.pickVideoAction', 'Pick Demo Videos from Device')}
              </Text>
            </TouchableOpacity>

            {videoUris.length > 0 && (
              <View style={{ gap: 8, marginTop: 10 }}>
                {videoUris.map((vUri, idx) => (
                  <View key={idx} style={[styles.videoBadgeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <MaterialCommunityIcons name="video" size={22} color={colors.accent} />
                    <Text style={[styles.videoBadgeText, { color: colors.text, flex: 1, marginLeft: 8 }]} numberOfLines={1}>
                      Video #{idx + 1} ({vUri.split('/').pop() || 'demo.mp4'})
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveVideo(idx)}>
                      <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* PACKAGES TIERS REDESIGN (SUBTLE CORNER RADIUS & TAB SELECTION) */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16, marginBottom: 10 }]}>
            {t('project.packagesTitle', 'Pricing & Deliverable Packages')}
          </Text>

          {/* Tier Segment Tabs */}
          <View style={[styles.tierSegmentRow, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
            {['basic', 'standard', 'premium'].map((tierId) => {
              const isActive = activeTierId === tierId;
              const isEnabled = tierData[tierId].enabled;
              return (
                <TouchableOpacity
                  key={tierId}
                  style={[
                    styles.tierSegmentTab,
                    isActive && [styles.tierSegmentTabActive, { backgroundColor: colors.card }]
                  ]}
                  onPress={() => setActiveTierId(tierId)}
                >
                  <Text style={[styles.tierSegmentText, { color: isActive ? colors.accent : colors.textSecondary }]}>
                    {tierId.toUpperCase()} {isEnabled ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Active Tier Form Card (Subtle Square Radius: 8) */}
          <View style={[styles.tierCardSquare, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Enable Toggle */}
            <TouchableOpacity
              style={styles.enableToggleRow}
              onPress={() => handleToggleTier(activeTierId)}
            >
              <MaterialCommunityIcons
                name={tierData[activeTierId].enabled ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color={tierData[activeTierId].enabled ? colors.accent : colors.placeholder}
              />
              <Text style={[styles.enableToggleText, { color: colors.text }]}>
                {t('project.enablePackage', 'Enable {{name}} Package', { name: activeTierId.toUpperCase() })}
              </Text>
            </TouchableOpacity>

            {tierData[activeTierId].enabled && (
              <View style={{ marginTop: 10 }}>
                {/* Package Summary / Subtitle */}
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                  {t('project.packageSummary', 'Package Summary / Subtitle')}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#0F172A' : '#FAFAFA', color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. 3 MINUTE (up to 50GB footages)"
                  placeholderTextColor={colors.placeholder}
                  value={tierData[activeTierId].summary || ''}
                  onChangeText={(val) => handleUpdateTierField(activeTierId, 'summary', val)}
                />

                {/* Price, Delivery Days & Revisions Row */}
                <View style={[styles.rowTwo, { marginTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{t('project.price', 'Price')} ({currencyStr})</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: isDarkMode ? '#0F172A' : '#FAFAFA', color: colors.text, borderColor: colors.border }]}
                      placeholder="50"
                      keyboardType="numeric"
                      value={tierData[activeTierId].price}
                      onChangeText={(val) => handleUpdateTierField(activeTierId, 'price', val)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{t('project.days', 'Delivery Days')}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: isDarkMode ? '#0F172A' : '#FAFAFA', color: colors.text, borderColor: colors.border }]}
                      placeholder="3"
                      keyboardType="numeric"
                      value={tierData[activeTierId].deliveryDays}
                      onChangeText={(val) => handleUpdateTierField(activeTierId, 'deliveryDays', val)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{t('project.revisions', 'Revisions')}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: isDarkMode ? '#0F172A' : '#FAFAFA', color: colors.text, borderColor: colors.border }]}
                      placeholder="1"
                      keyboardType="numeric"
                      value={tierData[activeTierId].revisions}
                      onChangeText={(val) => handleUpdateTierField(activeTierId, 'revisions', val)}
                    />
                  </View>
                </View>

                {/* Express Delivery Add-on Section */}
                <View style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDarkMode ? '#334155' : '#E2E8F0' }}>
                  <TouchableOpacity
                    style={styles.enableToggleRow}
                    onPress={() => handleUpdateTierField(activeTierId, 'expressDeliveryEnabled', !tierData[activeTierId].expressDeliveryEnabled)}
                  >
                    <MaterialCommunityIcons
                      name={tierData[activeTierId].expressDeliveryEnabled ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={20}
                      color={tierData[activeTierId].expressDeliveryEnabled ? colors.accent : colors.placeholder}
                    />
                    <Text style={[styles.enableToggleText, { color: colors.text, fontSize: 13 }]}>
                      {t('project.enableExpressAddon', 'Enable Express Delivery Add-on')}
                    </Text>
                  </TouchableOpacity>

                  {tierData[activeTierId].expressDeliveryEnabled && (
                    <View style={[styles.rowTwo, { marginTop: 8 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                          {t('project.expressDays', 'Express Days')}
                        </Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: isDarkMode ? '#0F172A' : '#FAFAFA', color: colors.text, borderColor: colors.border }]}
                          placeholder="4"
                          placeholderTextColor={colors.placeholder}
                          keyboardType="numeric"
                          value={String(tierData[activeTierId].expressDeliveryDays || '4')}
                          onChangeText={(val) => handleUpdateTierField(activeTierId, 'expressDeliveryDays', val)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                          {t('project.expressPrice', 'Add-on Price')} ({currencyStr})
                        </Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: isDarkMode ? '#0F172A' : '#FAFAFA', color: colors.text, borderColor: colors.border }]}
                          placeholder="20"
                          placeholderTextColor={colors.placeholder}
                          keyboardType="numeric"
                          value={String(tierData[activeTierId].expressDeliveryPrice || '')}
                          onChangeText={(val) => handleUpdateTierField(activeTierId, 'expressDeliveryPrice', val)}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Dynamic Features List with (+) Plus Button */}
                <Text style={[styles.subLabel, { color: colors.textSecondary, marginTop: 14, marginBottom: 6 }]}>
                  {t('project.includedFeatures', 'Included Features / Deliverables')}
                </Text>

                {tierData[activeTierId].features.map((feat, fIdx) => (
                  <View key={fIdx} style={styles.featureInputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, backgroundColor: isDarkMode ? '#0F172A' : '#FAFAFA', color: colors.text, borderColor: colors.border }]}
                      placeholder={`Feature #${fIdx + 1}`}
                      placeholderTextColor={colors.placeholder}
                      value={feat}
                      onChangeText={(text) => handleUpdateFeature(activeTierId, fIdx, text)}
                    />
                    <TouchableOpacity
                      style={styles.removeFeatureBtn}
                      onPress={() => handleRemoveFeature(activeTierId, fIdx)}
                    >
                      <MaterialCommunityIcons name="close-circle" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* (+) Add Feature Button */}
                <TouchableOpacity
                  style={[styles.addFeatureBtn, { borderColor: colors.accent }]}
                  onPress={() => handleAddFeature(activeTierId)}
                >
                  <MaterialCommunityIcons name="plus" size={18} color={colors.accent} />
                  <Text style={[styles.addFeatureBtnText, { color: colors.accent }]}>
                    {t('project.addFeature', 'Add Feature')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Publish Action Button */}
          <TouchableOpacity
            style={[styles.publishBtn, { backgroundColor: colors.accent }]}
            onPress={handlePublish}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.publishBtnText}>{editingId ? t('project.updateAction', 'Update Project') : t('project.publishAction', 'Publish Project')}</Text>
            )}
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      )}

      {/* CATEGORY SEARCH DROPDOWN MODAL */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdropDismiss}
            activeOpacity={1}
            onPress={() => setShowCategoryModal(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                marginBottom: modalKeyboardOffset > 0 ? modalKeyboardOffset : 0,
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('project.selectCategory', 'Select Category')}</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={categoryScrollRef}
              style={{ maxHeight: 260, marginVertical: 6 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Search Input */}
              <View style={[styles.searchBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' }]}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.placeholder} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder={t('common.search', 'Search category...')}
                  placeholderTextColor={colors.placeholder}
                  value={categorySearchQuery}
                  onChangeText={setCategorySearchQuery}
                />
              </View>

              {/* Category Items (Only show when searching) */}
              {categorySearchQuery.trim().length > 0 && filteredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[styles.catRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setCategory(cat.name);
                    setIsCustomCategorySelected(false);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[styles.catRowText, { color: colors.text }]}>{cat.name}</Text>
                  {category === cat.name && !isCustomCategorySelected && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}

              {/* Other / Custom Category Input */}
              <View style={[styles.customCatBox, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.otherOptionRow}
                  onPress={() => {
                    setIsCustomCategorySelected(true);
                    setTimeout(() => {
                      categoryScrollRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                >
                  <MaterialCommunityIcons
                    name={isCustomCategorySelected ? 'radiobox-marked' : 'radiobox-blank'}
                    size={20}
                    color={isCustomCategorySelected ? colors.accent : colors.placeholder}
                  />
                  <Text style={[styles.otherOptionText, { color: colors.text }]}>
                    {t('project.otherCategory', 'Other (Enter Custom Category)')}
                  </Text>
                </TouchableOpacity>

                {isCustomCategorySelected && (
                  <TextInput
                    style={[styles.input, { marginTop: 8, backgroundColor: isDarkMode ? '#0F172A' : '#FAFAFA', color: colors.text, borderColor: colors.border }]}
                    placeholder={t('project.customCategoryPlaceholder', 'Type your category name...')}
                    placeholderTextColor={colors.placeholder}
                    value={customCategory}
                    onChangeText={setCustomCategory}
                    onFocus={() => {
                      setTimeout(() => {
                        categoryScrollRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                  />
                )}

                <TouchableOpacity
                  style={[styles.doneCatBtn, { backgroundColor: colors.accent }]}
                  onPress={() => setShowCategoryModal(false)}
                >
                  <Text style={styles.doneCatBtnText}>{t('common.done', 'Done')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Media Processing Loading Overlay Spinner */}
      <Modal visible={pickingMedia} transparent animationType="fade">
        <View style={styles.loadingOverlayContainer}>
          <View style={[styles.loadingOverlayBox, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingOverlayText, { color: colors.text }]}>
              {t('project.processingMedia', 'Processing media file...')}
            </Text>
          </View>
        </View>
      </Modal>
    </TealSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addProjectHeaderBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '900' },

  // List View Styles
  projectListItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  projectListThumb: { width: 60, height: 60, borderRadius: 8 },
  projectListItemTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  projectListItemCat: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  projectListItemPrice: { fontSize: 12, fontWeight: '600' },

  emptyStateBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyStateTitle: { fontSize: 18, fontWeight: '900', marginTop: 16, marginBottom: 8 },
  emptyStateSub: { fontSize: 13, lineHeight: 18, textAlign: 'center', marginBottom: 20 },
  publishFirstBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  publishFirstBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },

  // Form View Styles
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  multiInput: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  dropdownBtn: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownBtnText: { fontSize: 14, fontWeight: '700' },

  mediaPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  mediaPickBtnText: { fontSize: 14, fontWeight: '800' },

  thumbWrap: { position: 'relative', width: 70, height: 70, borderRadius: 8, overflow: 'hidden' },
  uploadedThumb: { width: '100%', height: '100%' },
  removeThumbBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },

  videoBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  videoBadgeText: { flex: 1, fontSize: 13, fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '900' },

  // Packages Square Styling
  tierSegmentRow: { flexDirection: 'row', borderRadius: 8, padding: 4, marginBottom: 12 },
  tierSegmentTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  tierSegmentTabActive: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tierSegmentText: { fontSize: 12, fontWeight: '900' },

  tierCardSquare: {
    borderRadius: 8, // Subtle square corner radius
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  enableToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  enableToggleText: { fontSize: 14, fontWeight: '800' },

  rowTwo: { flexDirection: 'row', gap: 10 },
  subLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },

  featureInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  removeFeatureBtn: { padding: 4 },
  addFeatureBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', marginTop: 4 },
  addFeatureBtnText: { fontSize: 13, fontWeight: '800' },

  publishBtn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  publishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBackdropDismiss: { flex: 1 },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: '900' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, height: 44, borderRadius: 10, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  catRowText: { fontSize: 14, fontWeight: '700' },
  customCatBox: { paddingTop: 14, borderTopWidth: 1 },
  otherOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  otherOptionText: { fontSize: 14, fontWeight: '800' },
  doneCatBtn: { height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  doneCatBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },

  loadingOverlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlayBox: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 14,
    width: 220,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loadingOverlayText: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});

export default PostProjectScreen;
