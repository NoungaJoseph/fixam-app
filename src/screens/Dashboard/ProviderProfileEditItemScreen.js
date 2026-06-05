import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

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
  const { user, updateProfile } = useAuth();
  const type = route.params?.type || 'project';
  const config = CONFIG[type] || CONFIG.project;
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

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
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
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

          {config.fields.map(([key, label]) => (
            <View key={key} style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
              <TextInput
                style={[
                  styles.input,
                key === 'description' && styles.textArea,
                { color: colors.text, borderBottomColor: colors.border }
              ]}
                value={form[key] || ''}
                onChangeText={(value) => setField(key, value)}
                placeholder={label}
                placeholderTextColor={colors.placeholder}
                keyboardType={key === 'year' ? 'numeric' : 'default'}
                multiline={key === 'description'}
                textAlignVertical={key === 'description' ? 'top' : 'center'}
              />
            </View>
          ))}

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
});

export default ProviderProfileEditItemScreen;
