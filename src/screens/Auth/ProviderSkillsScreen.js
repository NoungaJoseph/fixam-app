import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView, TextInput, Platform, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

import { ALL_SKILLS } from '../../constants/skills';

const DAYS = Array.from({ length: 31 }, (_, i) => `${i + 1}`);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = Array.from({ length: 50 }, (_, i) => `${2008 - i}`);
const TIMES = Array.from({ length: 24 }, (_, i) => [`${i.toString().padStart(2, '0')}:00`, `${i.toString().padStart(2, '0')}:30`]).flat();

const ProviderSkillsScreen = ({ navigation, route }) => {
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [form, setForm] = useState({
    birthDay: '1', birthMonth: 'Jan', birthYear: '1995',
    serviceArea: '',
    experienceLevel: 'Beginner',
    rate: '',
    availability: {},
    bio: '',
  });

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState(null); // 'day', 'month', 'year', 'time'
  const [activeDay, setActiveDay] = useState(null);
  const [activeTimeField, setActiveTimeField] = useState(null); // 'open', 'close'

  const filteredSkills = useMemo(() => {
    if (!search.trim()) return [];
    return ALL_SKILLS.filter(skill =>
      skill.toLowerCase().includes(search.toLowerCase()) && !selectedSkills.includes(skill)
    ).slice(0, 8);
  }, [search, selectedSkills]);

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  
  const toggleDay = (day) => {
    setForm(prev => {
      const next = { ...prev.availability };
      if (next[day]?.enabled) {
        next[day] = { ...next[day], enabled: false };
      } else {
        next[day] = { enabled: true, open: next[day]?.open || '08:00', close: next[day]?.close || '18:00' };
      }
      return { ...prev, availability: next };
    });
  };

  const setAvailabilityTime = (day, field, time) => {
    setForm(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: { ...prev.availability[day], [field]: time }
      }
    }));
  };

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(item => item !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
      setSearch('');
    }
  };

  const openPicker = (type, day = null, field = null) => {
    setPickerType(type);
    setActiveDay(day);
    setActiveTimeField(field);
    setPickerVisible(true);
  };

  const handlePickerSelect = (value) => {
    if (pickerType === 'day') setField('birthDay', value);
    if (pickerType === 'month') setField('birthMonth', value);
    if (pickerType === 'year') setField('birthYear', value);
    if (pickerType === 'time') setAvailabilityTime(activeDay, activeTimeField, value);
    setPickerVisible(false);
  };

  const handleFinish = () => {
    const ageStr = `${form.birthDay} ${form.birthMonth} ${form.birthYear}`;
    navigation.navigate('PostRegistrationOnboarding', {
      role: 'provider',
      userData: {
        ...route.params?.userData,
        providerProfile: { ...form, age: ageStr, skills: selectedSkills },
      },
    });
  };

  const inputStyle = { backgroundColor: colors.card, borderColor: colors.border, color: colors.text };

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('providerSetup.title')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('providerSetup.subtitle')}</Text>

          {/* Facebook Style Date of Birth */}
          <Text style={[styles.label, { color: colors.text }]}>Date of Birth</Text>
          <View style={styles.dobRow}>
            <TouchableOpacity style={[styles.dobPicker, inputStyle]} onPress={() => openPicker('day')}>
              <Text style={{ color: colors.text }}>{form.birthDay}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dobPicker, inputStyle, { flex: 1.5 }]} onPress={() => openPicker('month')}>
              <Text style={{ color: colors.text }}>{form.birthMonth}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dobPicker, inputStyle, { flex: 1.2 }]} onPress={() => openPicker('year')}>
              <Text style={{ color: colors.text }}>{form.birthYear}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>{t('providerSetup.experience')}</Text>
          <View style={styles.levelRow}>
            {['Beginner', 'Skilled', 'Pro'].map(level => (
              <TouchableOpacity key={level} onPress={() => setField('experienceLevel', level)} style={[styles.levelCard, { backgroundColor: form.experienceLevel === level ? colors.accent : colors.card, borderColor: colors.border }]}>
                <Text style={[styles.levelText, { color: form.experienceLevel === level ? '#FFF' : colors.text }]}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>{t('providerSetup.rate')}</Text>
          <TextInput style={[styles.input, inputStyle]} value={form.rate} onChangeText={(value) => setField('rate', value)} placeholder="Rate per hour (e.g. 5000 XAF)" placeholderTextColor={colors.placeholder} />

          <Text style={[styles.label, { color: colors.text }]}>{t('providerSetup.skills')}</Text>
          <View style={[styles.searchBox, inputStyle]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.placeholder} />
            <TextInput style={[styles.searchInput, { color: colors.text }]} value={search} onChangeText={setSearch} placeholder={t('providerSetup.skillPlaceholder')} placeholderTextColor={colors.placeholder} />
          </View>
          
          {(filteredSkills.length > 0 || (search.trim().length > 0)) && (
            <View style={[styles.results, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {filteredSkills.map(skill => (
                <TouchableOpacity key={skill} style={[styles.resultItem, { borderBottomColor: colors.border }]} onPress={() => toggleSkill(skill)}>
                  <View style={styles.resultMain}>
                    <MaterialCommunityIcons name="briefcase-outline" size={18} color={colors.accent} />
                    <Text style={[styles.resultText, { color: colors.text }]}>{skill}</Text>
                  </View>
                  <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.accent} />
                </TouchableOpacity>
              ))}
              {search.trim().length > 0 && !filteredSkills.some(s => s.toLowerCase() === search.toLowerCase().trim()) && (
                <TouchableOpacity style={styles.resultItem} onPress={() => toggleSkill(search.trim())}>
                  <View style={styles.resultMain}>
                    <MaterialCommunityIcons name="plus" size={18} color={colors.accent} />
                    <Text style={[styles.resultText, { color: colors.accent }]}>Add "{search.trim()}"</Text>
                  </View>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.chips}>
            {selectedSkills.map(skill => (
              <TouchableOpacity key={skill} style={[styles.chip, { backgroundColor: colors.accent }]} onPress={() => toggleSkill(skill)}>
                <Text style={styles.chipText}>{skill}</Text>
                <MaterialCommunityIcons name="close-circle" size={16} color="#FFF" />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>{t('providerSetup.availability')}</Text>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
            const dayInfo = form.availability[day] || {};
            return (
              <View key={day} style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity style={styles.dayHeader} onPress={() => toggleDay(day)}>
                  <MaterialCommunityIcons name={dayInfo.enabled ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={dayInfo.enabled ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.dayText, { color: colors.text }]}>{day}</Text>
                </TouchableOpacity>
                {dayInfo.enabled && (
                  <View style={styles.timeRow}>
                    <TouchableOpacity style={[styles.timeSelect, { borderColor: colors.border }]} onPress={() => openPicker('time', day, 'open')}>
                      <Text style={{ color: colors.text }}>{dayInfo.open || '08:00'}</Text>
                      <MaterialCommunityIcons name="clock-outline" size={16} color={colors.accent} />
                    </TouchableOpacity>
                    <Text style={[styles.toText, { color: colors.textSecondary }]}>to</Text>
                    <TouchableOpacity style={[styles.timeSelect, { borderColor: colors.border }]} onPress={() => openPicker('time', day, 'close')}>
                      <Text style={{ color: colors.text }}>{dayInfo.close || '18:00'}</Text>
                      <MaterialCommunityIcons name="clock-outline" size={16} color={colors.accent} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          <Text style={[styles.label, { color: colors.text }]}>{t('providerSetup.bio')}</Text>
          <TextInput style={[styles.textareaLarge, inputStyle]} multiline value={form.bio} onChangeText={(value) => setField('bio', value)} placeholder={t('providerSetup.bioPlaceholder')} textAlignVertical="top" />

          <TouchableOpacity style={[styles.finishBtn, { backgroundColor: colors.accent }]} onPress={handleFinish}>
            <Text style={styles.finishText}>{t('providerSetup.finish')}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
          </TouchableOpacity>
        </ScrollView>

        {/* Generic Picker Modal */}
        <Modal visible={pickerVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select {pickerType}</Text>
                <TouchableOpacity onPress={() => setPickerVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={pickerType === 'day' ? DAYS : pickerType === 'month' ? MONTHS : pickerType === 'year' ? YEARS : TIMES}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.pickerItem, { borderBottomColor: colors.border }]} onPress={() => handlePickerSelect(item)}>
                    <Text style={[styles.pickerItemText, { color: colors.text }]}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 15, paddingBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  scrollContent: { padding: 22, paddingBottom: 60 },
  subtitle: { fontSize: 14, marginBottom: 25 },
  label: { fontSize: 14, fontWeight: '900', marginBottom: 10, marginTop: 15 },
  dobRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dobPicker: { flex: 1, height: 52, borderRadius: 8, borderWidth: 0, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  levelRow: { flexDirection: 'row', gap: 10 },
  levelCard: { flex: 1, height: 48, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  levelText: { fontSize: 14, fontWeight: '700' },
  input: { height: 56, borderRadius: 8, borderWidth: 0, borderBottomWidth: 1, paddingHorizontal: 4, fontSize: 15 },
  searchBox: { height: 56, borderRadius: 8, borderWidth: 0, borderBottomWidth: 1, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  results: { borderWidth: 1, borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  resultItem: { padding: 15, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultText: { fontSize: 14, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  chipText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  dayCard: { borderWidth: 0, borderBottomWidth: 1, paddingVertical: 13, marginBottom: 10 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayText: { fontSize: 14, fontWeight: '900' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  timeSelect: { flex: 1, height: 44, borderWidth: 1, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  toText: { fontSize: 12, fontWeight: '800' },
  textareaLarge: { minHeight: 120, borderRadius: 8, borderWidth: 0, borderBottomWidth: 1, padding: 15, fontSize: 15 },
  finishBtn: { height: 58, borderRadius: 8, marginTop: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  finishText: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '50%', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  pickerItem: { paddingVertical: 15, borderBottomWidth: 1 },
  pickerItemText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});

export default ProviderSkillsScreen;
