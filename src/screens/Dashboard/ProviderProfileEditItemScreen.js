import React, { useMemo, useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import * as ImagePicker from 'expo-image-picker';

const CONFIG = {
  project: {
    title: 'Add project',
    field: 'portfolio',
    submit: 'Save project',
    fields: [
      ['title', 'Project title'],
      ['description', 'Project description'],
      ['imageUrl', 'Project image URL']
    ]
  },
  certificate: {
    title: 'Add certificate',
    field: 'certificates',
    submit: 'Save certificate',
    fields: [
      ['title', 'Certificate name'],
      ['issuer', 'Issuer'],
      ['year', 'Year'],
      ['imageUrl', 'Certificate image URL']
    ]
  },
  employment: {
    title: 'Add employment',
    field: 'employmentHistory',
    submit: 'Save employment',
    fields: [
      ['title', 'Role or title'],
      ['company', 'Company'],
      ['period', 'Period'],
      ['description', 'Description']
    ]
  }
};

const ProviderProfileEditItemScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { user, updateProfile, uploadFile } = useAuth();
  const { t } = useLanguage();
  const type = route.params?.type || 'project';
  const config = CONFIG[type] || CONFIG.project;
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [images, setImages] = useState([]);

  const handleSelectMultipleImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setUploadingField('imageUrl');
        
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        const type = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

        const formData = new FormData();
        formData.append('file', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: filename,
          type,
        });

        const res = await uploadFile(formData);
        if (res?.url) {
          setImages(prev => {
            const next = [...prev, res.url];
            if (!form.imageUrl) {
              setField('imageUrl', res.url);
            }
            return next;
          });
        } else {
          throw new Error('Upload failed');
        }
      }
    } catch (err) {
      console.log('Multiple image upload error:', err);
      Alert.alert(t('profileDetail.permissionError', 'Upload Failed'), t('profileDetail.imageUploadFailed', 'Could not upload image. Please try again.'));
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(prev => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      setField('imageUrl', next[0] || '');
      return next;
    });
  };

  const existingItems = useMemo(() => {
    const value = user?.providerProfile?.[config.field];
    return Array.isArray(value) ? value : [];
  }, [config.field, user?.providerProfile]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const hasContent = Object.values(form).some((value) => String(value || '').trim()) || images.length > 0;
    if (!hasContent) {
      Alert.alert('Add details', 'Please add at least one detail before saving.');
      return;
    }

    try {
      setLoading(true);
      const cleaned = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, String(value || '').trim()])
      );
      cleaned.images = images;
      cleaned.imageUrl = images[0] || '';

      await updateProfile({ [config.field]: [...existingItems, cleaned] });
      Alert.alert('Saved', `${config.title.replace('Add ', '')} added successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Could not save', error.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <MaterialCommunityIcons name="chevron-left" size={30} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{config.title}</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            Add real profile details. These will show on your provider profile and help clients understand your experience.
          </Text>

          {existingItems.length > 0 && (
            <View style={styles.existingSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Current entries</Text>
              {existingItems.map((item, index) => (
                <View key={`${item.title || item.company || config.field}-${index}`} style={[styles.existingItem, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.existingTitle, { color: colors.text }]}>{item.title || item.company || `${config.title.replace('Add ', '')} ${index + 1}`}</Text>
                  <Text style={[styles.existingMeta, { color: colors.textSecondary }]} numberOfLines={2}>
                    {[item.company, item.issuer, item.year, item.period, item.description].filter(Boolean).join(' | ') || 'Saved on your profile'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {config.fields.map(([key, label]) => {
            const isImageField = key === 'imageUrl';
            
            if (isImageField) {
              return (
                <View key={key} style={styles.field}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    {type === 'project' ? t('profileDetail.projectImageUrl', 'Project Photos') : t('profileDetail.certificateImageUrl', 'Certificate Photo')}
                  </Text>
                  
                  <View style={styles.imageSelectorContainer}>
                    {images.length > 0 && (
                      <View style={styles.imagesGrid}>
                        {images.map((imgUrl, idx) => (
                          <View key={`${imgUrl}-${idx}`} style={styles.gridImageItem}>
                            <Image source={{ uri: imgUrl }} style={styles.gridImage} resizeMode="cover" />
                            <TouchableOpacity 
                              style={styles.removeImageBadge} 
                              onPress={() => handleRemoveImage(idx)}
                            >
                              <MaterialCommunityIcons name="close-circle" size={22} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {uploadingField === key ? (
                      <View style={[styles.placeholderContainer, { borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                        <View style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                          <ActivityIndicator size="large" color={colors.accent} />
                        </View>
                        <Text style={[styles.placeholderText, { color: colors.textSecondary, marginTop: 8 }]}>
                          {t('profileDetail.uploading', 'Uploading...')}
                        </Text>
                      </View>
                    ) : (
                      images.length < 8 && (
                        <TouchableOpacity 
                          style={[styles.placeholderContainer, { borderColor: colors.border }]}
                          onPress={handleSelectMultipleImage}
                        >
                          <MaterialCommunityIcons name="camera-plus" size={32} color={colors.textSecondary} />
                          <Text style={[styles.placeholderText, { color: colors.textSecondary, marginTop: 8 }]}>
                            {images.length > 0 ? t('profileDetail.addAnotherPhoto', 'Add Another Photo') : t('profileDetail.selectPhoto', 'Select Photo')}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
              );
            }

            return (
              <View key={key} style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {key === 'title' ? (type === 'project' ? t('profileDetail.projectTitle', label) : type === 'certificate' ? t('profileDetail.certificateName', label) : label) :
                   key === 'description' ? t('profileDetail.projectDescription', label) :
                   key === 'issuer' ? t('profileDetail.issuer', label) :
                   key === 'year' ? t('profileDetail.year', label) :
                   label}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    key === 'description' && styles.textArea,
                    { color: colors.text, borderBottomColor: colors.border }
                  ]}
                  value={form[key] || ''}
                  onChangeText={(value) => setField(key, value)}
                  placeholder={
                    key === 'title' ? (type === 'project' ? t('profileDetail.projectTitle', label) : type === 'certificate' ? t('profileDetail.certificateName', label) : label) :
                    key === 'description' ? t('profileDetail.projectDescription', label) :
                    key === 'issuer' ? t('profileDetail.issuer', label) :
                    key === 'year' ? t('profileDetail.year', label) :
                    label
                  }
                  placeholderTextColor={colors.placeholder}
                  keyboardType={key === 'year' ? 'numeric' : 'default'}
                  multiline={key === 'description'}
                  textAlignVertical={key === 'description' ? 'top' : 'center'}
                />
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.saveBtn, { borderColor: isDarkMode ? '#444' : '#111', backgroundColor: isDarkMode ? colors.card : '#FFF' }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={[styles.saveText, { color: colors.text }]}>{loading ? 'Saving...' : config.submit}</Text>
            <MaterialCommunityIcons name="check" size={20} color={colors.text} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 62, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  content: { padding: 22, paddingBottom: 50 },
  helpText: { fontSize: 15, lineHeight: 23, marginBottom: 24 },
  existingSection: { marginBottom: 26 },
  sectionLabel: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  existingItem: { paddingVertical: 14, borderBottomWidth: 1 },
  existingTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  existingMeta: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  field: { marginBottom: 22 },
  label: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  input: { minHeight: 52, borderBottomWidth: 1, fontSize: 16, fontWeight: '600', paddingVertical: 8 },
  textArea: { minHeight: 120 },
  saveBtn: { minHeight: 48, paddingVertical: 14, borderRadius: 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  saveText: { fontSize: 15, fontWeight: '900' },
  imageSelectorContainer: { marginTop: 8 },
  placeholderContainer: { width: '100%', height: 120, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', marginTop: 8 },
  placeholderText: { fontSize: 13, fontWeight: '700' },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  gridImageItem: { width: '31%', aspectRatio: 1, position: 'relative' },
  gridImage: { width: '100%', height: '100%', borderRadius: 8 },
  removeImageBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FFF', borderRadius: 10, padding: 0 }
});

export default ProviderProfileEditItemScreen;
