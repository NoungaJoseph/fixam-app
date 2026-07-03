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

  const handleSelectImage = async (fieldKey) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setUploadingField(fieldKey);
        
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
          setField(fieldKey, res.url);
        } else {
          throw new Error('Upload failed');
        }
      }
    } catch (err) {
      console.log('Portfolio image upload error:', err);
      Alert.alert(t('profileDetail.permissionError', 'Upload Failed'), t('profileDetail.imageUploadFailed', 'Could not upload image. Please try again.'));
    } finally {
      setUploadingField(null);
    }
  };

  const existingItems = useMemo(() => {
    const value = user?.providerProfile?.[config.field];
    return Array.isArray(value) ? value : [];
  }, [config.field, user?.providerProfile]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const hasContent = Object.values(form).some((value) => String(value || '').trim());
    if (!hasContent) {
      Alert.alert('Add details', 'Please add at least one detail before saving.');
      return;
    }

    try {
      setLoading(true);
      const cleaned = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, String(value || '').trim()])
      );
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
                    {type === 'project' ? t('profileDetail.projectImageUrl', 'Project Photo') : t('profileDetail.certificateImageUrl', 'Certificate Photo')}
                  </Text>
                  
                  <View style={styles.imageSelectorContainer}>
                    {form[key] ? (
                      <View style={styles.previewContainer}>
                        <Image source={{ uri: form[key] }} style={styles.imagePreview} resizeMode="cover" />
                        <TouchableOpacity 
                          style={[styles.selectBtn, { backgroundColor: colors.accent }]}
                          onPress={() => handleSelectImage(key)}
                          disabled={uploadingField === key}
                        >
                          {uploadingField === key ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={styles.selectBtnText}>{t('profileDetail.changePhoto', 'Change Photo')}</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.placeholderContainer, { borderColor: colors.border }]}
                        onPress={() => handleSelectImage(key)}
                        disabled={uploadingField === key}
                      >
                        {uploadingField === key ? (
                          <ActivityIndicator size="medium" color={colors.accent} />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="camera-plus" size={32} color={colors.textSecondary} />
                            <Text style={[styles.placeholderText, { color: colors.textSecondary, marginTop: 8 }]}>
                              {t('profileDetail.selectPhoto', 'Select Photo')}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
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
  placeholderContainer: { width: '100%', height: 160, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)' },
  placeholderText: { fontSize: 13, fontWeight: '700' },
  previewContainer: { width: '100%', alignItems: 'center', gap: 12 },
  imagePreview: { width: '100%', height: 200, borderRadius: 8 },
  selectBtn: { width: '100%', height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  selectBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
});

export default ProviderProfileEditItemScreen;
