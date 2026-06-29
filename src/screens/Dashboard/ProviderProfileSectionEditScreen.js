import React, { useMemo, useState } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { translateService } from '../../i18n/translate';

import { LOCAL_SKILLS, normalizeSkill } from '../../constants/skills';

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
  const [serviceArea, setServiceArea] = useState(profile.serviceArea || '');
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel || '');
  const [rate, setRate] = useState(profile.rate ? String(profile.rate) : '');
  const [skills, setSkills] = useState(profile.skills || []);
  const [skillSearch, setSkillSearch] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [socialLinks, setSocialLinks] = useState(profile.socialLinks || {});
  const [profileMode, setProfileMode] = useState(profile.profileMode || (user?.role === 'PROVIDER' ? 'WORK' : 'PERSONAL'));

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
    if (section === 'about') Object.assign(updates, { bio, serviceArea, experienceLevel, rate: Number(rate) || 0 });
    if (section === 'skills') updates.skills = skills;
    if (section === 'links') updates.socialLinks = socialLinks;
    if (section === 'mode') {
      updates.profileMode = profileMode;
      if (profileMode === 'WORK') {
        updates.skills = skills.length ? skills : profile.skills || [];
        updates.bio = bio || profile.bio || '';
        updates.serviceArea = serviceArea || profile.serviceArea || '';
        updates.experienceLevel = experienceLevel || profile.experienceLevel || '';
        updates.rate = Number(rate || profile.rate) || 0;
      }
    }

    try {
      setLoading(true);
      await updateProfile(updates);
      Alert.alert(t('workProfile.saved'), t('workProfile.savedBody'), [{ text: t('common.done'), onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert(t('workProfile.couldNotSave'), error.response?.data?.message || t('errors.apiFallback'));
    } finally {
      setLoading(false);
    }
  };

  const title = section === 'skills' ? t('workProfile.editSkills') : section === 'links' ? t('workProfile.linkedAccounts') : section === 'mode' ? t('workProfile.profileType') : t('workProfile.editWorkProfile');

  const outlineBtn = {
    borderWidth: 1,
    borderColor: isDarkMode ? '#444' : '#111',
    backgroundColor: isDarkMode ? colors.card : '#FFF',
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

          {section === 'about' || (section === 'mode' && profileMode === 'WORK') ? (
            <>
              <Field label={t('workProfile.bio', 'Bio')} value={bio} onChangeText={setBio} colors={colors} multiline />
              <Field label={t('workProfile.serviceArea', 'Area of Work')} value={serviceArea} onChangeText={setServiceArea} colors={colors} />
              
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

          {section === 'skills' || (section === 'mode' && profileMode === 'WORK') ? (
            <>
              <Field label={t('workProfile.searchSkills')} value={skillSearch} onChangeText={setSkillSearch} colors={colors} placeholder={t('workProfile.searchSkillsPlaceholder')} />

              {needle.length > 0 && (
                <View style={[styles.resultsBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  {filteredSkills.map(skill => (
                    <TouchableOpacity key={skill} style={[styles.resultRow, { borderBottomColor: colors.border }]} onPress={() => toggleSkill(skill)}>
                      <Text style={[styles.skillText, { color: colors.text }]}>{translateService(skill)}</Text>
                      <View style={[styles.miniPlus, outlineBtn]}>
                        <MaterialCommunityIcons name="plus" size={18} color={colors.text} />
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
                  <MaterialCommunityIcons name="plus" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          {section === 'links' && SOCIALS.map(([key, label]) => (
            <Field key={key} label={label} value={socialLinks[key] || ''} onChangeText={(value) => setSocialLinks(prev => ({ ...prev, [key]: value }))} colors={colors} placeholder={`https://${key}.com/your-profile`} />
          ))}

          <TouchableOpacity style={[styles.saveBtn, outlineBtn]} onPress={save} disabled={loading}>
            <Text style={[styles.saveText, { color: colors.text }]}>{loading ? t('workProfile.saving') : t('workProfile.saveChanges')}</Text>
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
  field: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 4, paddingHorizontal: 12, fontSize: 15, fontWeight: '600' },
  textarea: { minHeight: 130, paddingTop: 12 },
  skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  skillChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8 },
  skillText: { fontSize: 13, fontWeight: '700' },
  resultsBox: { borderWidth: 1, borderRadius: 4, marginBottom: 16, overflow: 'hidden' },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  miniPlus: { width: 36, height: 36, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  emptyHint: { fontSize: 13, paddingHorizontal: 12, paddingVertical: 10, fontWeight: '600' },
  selectedBlock: { marginBottom: 16 },
  selectedLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  customRow: { flexDirection: 'row', gap: 8, marginBottom: 20, alignItems: 'center' },
  customInput: { flex: 1, height: 44, borderWidth: 1, borderRadius: 4, paddingHorizontal: 12, fontSize: 15 },
  addBtn: { width: 44, height: 44, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  row: { paddingVertical: 17, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14 },
  rowTitle: { fontSize: 17, fontWeight: '900' },
  rowSub: { fontSize: 14, marginTop: 4 },
  help: { fontSize: 13, marginTop: 10, marginBottom: 20 },
  saveBtn: { marginTop: 10, height: 50, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 16, fontWeight: '900' },
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
