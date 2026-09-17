import React, { useMemo, useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { translateService } from '../../i18n/translate';

import { LOCAL_SKILLS, normalizeSkill } from '../../constants/skills';
import { CAMEROON_CITIES, searchCameroonQuarters, getAllQuarterNames } from '../../constants/cameroonQuarters';

const SOCIALS = [
  ['linkedin', 'LinkedIn'],
  ['facebook', 'Facebook'],
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
];

const ProviderProfileSectionEditScreen = ({ navigation, route }) => {
  const { user, updateProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const section = route.params?.section || 'about';
  const profile = user?.providerProfile || {};
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState(profile.bio || '');
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel || '');
  const [rate, setRate] = useState(profile.rate ? String(profile.rate) : '');
  const [skills, setSkills] = useState(profile.skills || []);
  const [skillSearch, setSkillSearch] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [socialLinks, setSocialLinks] = useState(profile.socialLinks || {});
  const [profileMode, setProfileMode] = useState(profile.profileMode || (user?.role === 'PROVIDER' ? 'WORK' : 'PERSONAL'));

  // Service Area / Cameroon Quarters state
  const initialQuarters = useMemo(() => {
    return (profile.serviceArea || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [profile.serviceArea]);
  const [selectedQuarters, setSelectedQuarters] = useState(initialQuarters);
  const [selectedCity, setSelectedCity] = useState('Douala');
  const [quarterSearch, setQuarterSearch] = useState('');

  const quarterResults = useMemo(() => {
    return searchCameroonQuarters(quarterSearch, selectedCity);
  }, [quarterSearch, selectedCity]);

  const toggleQuarter = (quarterName) => {
    if (!quarterName) return;
    const trimmed = quarterName.trim();
    setSelectedQuarters(prev => 
      prev.includes(trimmed) 
        ? prev.filter(q => q !== trimmed) 
        : [...prev, trimmed]
    );
  };

  const selectAllCityQuarters = (city) => {
    const allInCity = getAllQuarterNames(city);
    setSelectedQuarters(prev => {
      const set = new Set([...prev, ...allInCity]);
      return Array.from(set);
    });
  };

  const needle = skillSearch.trim().toLowerCase();
  const filteredSkills = useMemo(() => {
    if (!needle) return [];
    return LOCAL_SKILLS
      .filter(skill => {
        if (skills.includes(skill)) return false;
        const englishVal = skill.toLowerCase();
        const frenchVal = translateService(skill, { lng: 'fr' }).toLowerCase();
        return englishVal.includes(needle) || frenchVal.includes(needle);
      })
      .slice(0, 12);
  }, [needle, skills]);

  const toggleSkill = (skill) => {
    const normalized = normalizeSkill(skill);
    setSkills(prev => prev.includes(normalized) ? prev.filter(item => item !== normalized) : [...prev, normalized]);
    setSkillSearch('');
  };

  const addCustomSkill = () => {
    const next = customSkill.trim();
    if (!next) return;
    const normalized = normalizeSkill(next);
    setSkills(prev => prev.includes(normalized) ? prev : [...prev, normalized]);
    setCustomSkill('');
    setSkillSearch('');
  };

  const save = async () => {
    const updates = {};
    if (section === 'about') Object.assign(updates, { bio, experienceLevel, rate: Number(rate) || 0 });
    if (section === 'serviceArea') updates.serviceArea = serviceAreaString;
    if (section === 'skills') updates.skills = skills;
    if (section === 'links') updates.socialLinks = socialLinks;
    if (section === 'mode') {
      updates.profileMode = profileMode;
      if (profileMode === 'WORK') {
        updates.skills = skills.length ? skills : profile.skills || [];
        updates.bio = bio || profile.bio || '';
        updates.serviceArea = serviceAreaString || profile.serviceArea || '';
        updates.experienceLevel = experienceLevel || profile.experienceLevel || '';
        updates.rate = Number(rate || profile.rate) || 0;
      }
    }

    try {
      setLoading(true);
      await updateProfile(updates);
      Alert.alert(t('workProfile.saved', 'Saved'), t('workProfile.savedBody', 'Your profile updates have been saved.'), [{ text: t('common.done', 'Done'), onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert(t('workProfile.couldNotSave', 'Error'), error.response?.data?.message || t('errors.apiFallback', 'Could not save profile changes.'));
    } finally {
      setLoading(false);
    }
  };

  const title = section === 'serviceArea'
    ? t('workProfile.serviceAreaTitle', 'Service Areas (Quarters)')
    : section === 'skills'
      ? t('workProfile.editSkills', 'Edit Skills')
      : section === 'links'
        ? t('workProfile.linkedAccounts', 'Linked Accounts')
        : section === 'mode'
          ? t('workProfile.profileType', 'Profile Type')
          : t('workProfile.editWorkProfile', 'Edit Work Profile');

  const outlineBtn = {
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#0D9488',
    backgroundColor: isDarkMode ? colors.card : '#0D9488',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={30} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {section === 'mode' && (
            <>
              {['PERSONAL', 'WORK'].map(mode => (
                <TouchableOpacity key={mode} style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => setProfileMode(mode)}>
                  <View>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>{mode === 'PERSONAL' ? t('workProfile.personalProfile') : t('workProfile.workProfile')}</Text>
                    <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{mode === 'PERSONAL' ? t('workProfile.personalDesc') : t('workProfile.workDesc')}</Text>
                  </View>
                  <MaterialCommunityIcons name={profileMode === mode ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={colors.text} />
                </TouchableOpacity>
              ))}
              {profileMode === 'WORK' && (
                <Text style={[styles.help, { color: colors.textSecondary }]}>{t('workProfile.completeWorkDetails')}</Text>
              )}
            </>
          )}

          {/* ── ABOUT / GENERAL PROFILE SECTION ── */}
          {section === 'about' || (section === 'mode' && profileMode === 'WORK') ? (
            <>
              <Field label={t('workProfile.bio', 'Bio')} value={bio} onChangeText={setBio} colors={colors} multiline />
              
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('workProfile.experienceLevel', 'Experience Level')}</Text>
                <View style={styles.experienceContainer}>
                  {['BEGINNER', 'INTERMEDIATE', 'EXPERT'].map((level) => (
                    <TouchableOpacity 
                      key={level} 
                      style={[
                        styles.experienceChip, 
                        { 
                          borderColor: experienceLevel === level ? colors.accent : colors.border,
                          backgroundColor: experienceLevel === level ? (isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5') : colors.card 
                        }
                      ]}
                      onPress={() => setExperienceLevel(level)}
                    >
                      <Text style={[
                        styles.experienceText, 
                        { color: experienceLevel === level ? colors.accent : colors.text }
                      ]}>
                        {t(`workProfile.exp_${level}`, level)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <Field label={t('workProfile.hourlyRate')} value={rate} onChangeText={setRate} colors={colors} keyboardType="numeric" />
            </>
          ) : null}

          {/* ── DEDICATED SERVICE AREA (QUARTERS) SECTION ── */}
          {section === 'serviceArea' && (
            <>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {t('workProfile.serviceAreaDesc', 'Select the quarters you operate in. When a client in Kotto or another quarter posts a task, nearby handymen are prioritized first.')}
              </Text>

              {/* City Selection Tabs */}
              <View style={styles.cityTabsRow}>
                {CAMEROON_CITIES.map(c => {
                  const isActive = selectedCity === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.cityTab,
                        {
                          backgroundColor: isActive ? '#0D9488' : (isDarkMode ? '#1E293B' : '#F1F5F9'),
                          borderColor: isActive ? '#0D9488' : colors.border
                        }
                      ]}
                      onPress={() => {
                        setSelectedCity(c.id);
                        setQuarterSearch('');
                      }}
                    >
                      <Text style={[styles.cityTabText, { color: isActive ? '#FFF' : colors.text }]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick Action Buttons */}
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#0D948815', borderColor: '#0D9488' }]}
                  onPress={() => selectAllCityQuarters(selectedCity)}
                >
                  <MaterialCommunityIcons name="check-all" size={16} color="#0D9488" />
                  <Text style={[styles.quickActionText, { color: '#0D9488' }]}>
                    {t('workProfile.selectAllIn', 'Select All in')} {selectedCity}
                  </Text>
                </TouchableOpacity>

                {selectedQuarters.length > 0 && (
                  <TouchableOpacity
                    style={[styles.quickActionBtn, { backgroundColor: '#EF444415', borderColor: '#EF4444' }]}
                    onPress={() => setSelectedQuarters([])}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
                    <Text style={[styles.quickActionText, { color: '#EF4444' }]}>
                      {t('workProfile.clearAll', 'Clear All')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Search Box for Quarters */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('workProfile.searchQuarter', 'Search Quarters in')} {selectedCity}
                </Text>
                <View style={[styles.quarterSearchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.quarterSearchInput, { color: colors.text }]}
                    value={quarterSearch}
                    onChangeText={setQuarterSearch}
                    placeholder={`Type quarter (e.g. Kotto, Akwa, Bastos, Molyko)...`}
                    placeholderTextColor={colors.placeholder}
                  />
                  {quarterSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setQuarterSearch('')}>
                      <MaterialCommunityIcons name="close-circle" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Auto-suggest dropdown results */}
                {quarterSearch.trim().length > 0 && (
                  <View style={[styles.resultsBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    {quarterResults.map(q => {
                      const isSelected = selectedQuarters.includes(q.name);
                      return (
                        <TouchableOpacity
                          key={`${q.city}-${q.name}`}
                          style={[styles.resultRow, { borderBottomColor: colors.border }]}
                          onPress={() => toggleQuarter(q.name)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.skillText, { color: colors.text, fontWeight: '700' }]}>{q.name}</Text>
                            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{q.city} • {q.zone}</Text>
                          </View>
                          <MaterialCommunityIcons
                            name={isSelected ? "check-circle" : "plus-circle-outline"}
                            size={22}
                            color={isSelected ? "#10B981" : "#0D9488"}
                          />
                        </TouchableOpacity>
                      );
                    })}
                    {quarterResults.length === 0 && (
                      <View style={{ padding: 14 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                          No known quarter matching "{quarterSearch}".
                        </Text>
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 }}
                          onPress={() => {
                            toggleQuarter(quarterSearch.trim());
                            setQuarterSearch('');
                          }}
                        >
                          <MaterialCommunityIcons name="plus" size={18} color="#0D9488" />
                          <Text style={{ color: '#0D9488', fontWeight: '800', fontSize: 13 }}>
                            Add "{quarterSearch.trim()}" as custom quarter
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Selected Quarters Chips */}
              <View style={styles.selectedBlock}>
                <View style={styles.selectedHeaderRow}>
                  <Text style={[styles.selectedLabel, { color: colors.textSecondary }]}>
                    {t('workProfile.selectedQuarters', 'Selected Quarters')}
                  </Text>
                  <View style={[styles.countBadge, { backgroundColor: '#0D9488' }]}>
                    <Text style={styles.countBadgeText}>{selectedQuarters.length}</Text>
                  </View>
                </View>

                {selectedQuarters.length > 0 ? (
                  <View style={styles.skillWrap}>
                    {selectedQuarters.map(q => (
                      <TouchableOpacity
                        key={q}
                        style={[
                          styles.quarterSelectedChip,
                          { backgroundColor: isDarkMode ? '#0F4C4A' : '#ECFDF5', borderColor: '#0D9488' }
                        ]}
                        onPress={() => toggleQuarter(q)}
                      >
                        <Text style={[styles.quarterChipText, { color: isDarkMode ? '#5EEAD4' : '#0D9488' }]}>{q}</Text>
                        <MaterialCommunityIcons name="close-circle" size={16} color={isDarkMode ? '#5EEAD4' : '#0D9488'} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                    {t('workProfile.noQuartersSelected', 'No quarters selected yet. Search above or click "Select All" to set your areas.')}
                  </Text>
                )}
              </View>
            </>
          )}

          {/* ── SKILLS SECTION ── */}
          {section === 'skills' || (section === 'mode' && profileMode === 'WORK') ? (
            <>
              <Field label={t('workProfile.searchSkills')} value={skillSearch} onChangeText={setSkillSearch} colors={colors} placeholder={t('workProfile.searchSkillsPlaceholder')} />

              {needle.length > 0 && (
                <View style={[styles.resultsBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  {filteredSkills.map(skill => (
                    <TouchableOpacity key={skill} style={[styles.resultRow, { borderBottomColor: colors.border }]} onPress={() => toggleSkill(skill)}>
                      <Text style={[styles.skillText, { color: colors.text }]}>{translateService(skill)}</Text>
                      <View style={[styles.miniPlus, outlineBtn]}>
                        <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                  ))}
                  {!filteredSkills.some(s => s.toLowerCase() === needle) && skillSearch.trim().length >= 2 ? (
                    <TouchableOpacity
                      style={[styles.resultRow, { borderBottomWidth: 0 }]}
                      onPress={() => toggleSkill(skillSearch.trim())}
                    >
                      <Text style={[styles.skillText, { color: colors.text }]}>{t('workProfile.addSkill', { skill: skillSearch.trim() })}</Text>
                      <MaterialCommunityIcons name="plus" size={20} color={colors.text} />
                    </TouchableOpacity>
                  ) : null}
                  {filteredSkills.length === 0 && skillSearch.trim().length > 0 && skillSearch.trim().length < 2 ? (
                    <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>{t('workProfile.keepTyping')}</Text>
                  ) : null}
                </View>
              )}

              {skills.length > 0 ? (
                <View style={styles.selectedBlock}>
                  <Text style={[styles.selectedLabel, { color: colors.textSecondary }]}>{t('workProfile.selected')}</Text>
                  <View style={styles.skillWrap}>
                    {skills.map(skill => (
                      <TouchableOpacity key={skill} style={[styles.skillChip, { borderColor: colors.border, backgroundColor: isDarkMode ? '#222' : '#F4F4F4' }]} onPress={() => toggleSkill(skill)}>
                        <Text style={[styles.skillText, { color: colors.text }]}>{translateService(skill)}</Text>
                        <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={[styles.emptyHint, { color: colors.textSecondary, marginBottom: 12 }]}>{t('workProfile.noSkills')}</Text>
              )}

              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('workProfile.customSkill')}</Text>
              <View style={styles.customRow}>
                <TextInput
                  style={[styles.customInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                  value={customSkill}
                  onChangeText={setCustomSkill}
                  placeholder={t('workProfile.customSkillPlaceholder')}
                  placeholderTextColor={colors.placeholder}
                  onSubmitEditing={addCustomSkill}
                />
                <TouchableOpacity style={[styles.addBtn, outlineBtn]} onPress={addCustomSkill}>
                  <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          {/* ── SOCIAL LINKS ── */}
          {section === 'links' && SOCIALS.map(([key, label]) => (
            <Field key={key} label={label} value={socialLinks[key] || ''} onChangeText={(value) => setSocialLinks(prev => ({ ...prev, [key]: value }))} colors={colors} placeholder={`https://${key}.com/your-profile`} />
          ))}

          {/* Save Button */}
          <TouchableOpacity style={[styles.saveBtn, outlineBtn]} onPress={save} disabled={loading}>
            <Text style={styles.saveText}>{loading ? t('workProfile.saving', 'Saving...') : t('workProfile.saveChanges', 'Save Changes')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const Field = ({ label, colors, multiline, placeholder, ...props }) => (
  <View style={styles.field}>
    <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.textarea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
      placeholder={placeholder || label}
      placeholderTextColor={colors.placeholder}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 62, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  content: { padding: 22, paddingBottom: 70 },
  sectionSubtitle: { fontSize: 13, lineHeight: 18, marginBottom: 16, fontWeight: '500' },
  field: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 15, fontWeight: '600' },
  textarea: { minHeight: 130, paddingTop: 12 },
  
  // City Tabs
  cityTabsRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  cityTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  cityTabText: { fontSize: 13, fontWeight: '800' },

  // Quick Actions
  quickActionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  quickActionText: { fontSize: 12, fontWeight: '800' },

  // Quarter Search
  quarterSearchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 48, gap: 8 },
  quarterSearchInput: { flex: 1, fontSize: 14, fontWeight: '600' },

  // Quarter Preview in About
  quartersSummaryBox: { borderWidth: 1, borderRadius: 10, padding: 12 },
  quarterChipMini: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  quarterChipMiniText: { fontSize: 12, fontWeight: '700' },
  editQuartersActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingVertical: 9, marginTop: 10 },
  editQuartersActionText: { fontSize: 13, fontWeight: '800', color: '#0D9488' },

  // Selected Quarters
  selectedBlock: { marginBottom: 20 },
  selectedHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  selectedLabel: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  countBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  quarterSelectedChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  quarterChipText: { fontSize: 13, fontWeight: '700' },

  // Skills
  skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  skillChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  skillText: { fontSize: 13, fontWeight: '700' },
  resultsBox: { borderWidth: 1, borderRadius: 8, marginTop: 6, marginBottom: 16, overflow: 'hidden' },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  miniPlus: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  emptyHint: { fontSize: 13, paddingHorizontal: 12, paddingVertical: 8, fontWeight: '500' },
  customRow: { flexDirection: 'row', gap: 8, marginBottom: 20, alignItems: 'center' },
  customInput: { flex: 1, height: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 14 },
  addBtn: { width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  row: { paddingVertical: 17, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14 },
  rowTitle: { fontSize: 17, fontWeight: '900' },
  rowSub: { fontSize: 14, marginTop: 4 },
  help: { fontSize: 13, marginTop: 10, marginBottom: 20 },
  saveBtn: { marginTop: 10, height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  experienceContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  experienceChip: { 
    borderWidth: 1, 
    borderRadius: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 10,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  experienceText: { fontSize: 13, fontWeight: '700' }
});

export default ProviderProfileSectionEditScreen;
