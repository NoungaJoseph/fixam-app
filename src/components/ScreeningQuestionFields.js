import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const missingRequiredAnswer = (questions = [], answers = {}) => questions.find((q) => q.required && (answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === '' || (Array.isArray(answers[q.id]) && !answers[q.id].length) || (q.type === 'CHECKBOX' && answers[q.id] !== true)));

export default function ScreeningQuestionFields({ questions = [], answers, onChange }) {
  const { t } = useLanguage(); const { colors } = useTheme();
  if (!questions.length) return null;
  const set = (id, value) => onChange({ ...answers, [id]: value });
  return <View style={styles.section}><Text style={[styles.title, { color: colors.text }]}>{t('jobs.recruiterQuestions', 'Recruiter questions')}</Text><Text style={[styles.help, { color: colors.textSecondary }]}>{t('jobs.answerQuestionsHelp', 'Answer the questions below accurately.')}</Text>{questions.map((q, index) => {
    const value = answers[q.id];
    const textInput = ['SHORT_TEXT', 'LONG_TEXT', 'NUMBER', 'DATE'].includes(q.type);
    return <View key={q.id} style={[styles.card, { borderColor: colors.border }]}><Text style={[styles.prompt, { color: colors.text }]}>{index + 1}. {q.prompt}{q.required ? <Text style={{ color: '#EF4444' }}> *</Text> : null}</Text>
      {textInput ? <TextInput value={value === undefined ? '' : String(value)} onChangeText={(text) => set(q.id, text)} multiline={q.type === 'LONG_TEXT'} keyboardType={q.type === 'NUMBER' ? 'numeric' : 'default'} placeholder={q.type === 'DATE' ? 'YYYY-MM-DD' : t('jobs.enterAnswer', 'Enter your answer')} placeholderTextColor={colors.textSecondary} style={[styles.input, q.type === 'LONG_TEXT' && styles.area, { color: colors.text, borderColor: colors.border }]} /> : null}
      {q.type === 'YES_NO' ? <View style={styles.choices}>{['YES', 'NO'].map((option) => <TouchableOpacity key={option} onPress={() => set(q.id, option)} style={[styles.choice, { borderColor: value === option ? '#0D9488' : colors.border, backgroundColor: value === option ? '#0D948815' : 'transparent' }]}><Text style={{ color: value === option ? '#0D9488' : colors.text, fontWeight: '800' }}>{t(`jobs.${option.toLowerCase()}`, option)}</Text></TouchableOpacity>)}</View> : null}
      {q.type === 'CHECKBOX' ? <TouchableOpacity style={styles.check} onPress={() => set(q.id, !value)}><MaterialCommunityIcons name={value ? 'checkbox-marked' : 'checkbox-blank-outline'} size={23} color={value ? '#0D9488' : colors.textSecondary} /><Text style={{ color: colors.text }}>{t('jobs.confirmStatement', 'I confirm')}</Text></TouchableOpacity> : null}
      {['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(q.type) ? <View style={styles.optionList}>{(q.options || []).map((option) => { const selected = q.type === 'MULTI_CHOICE' ? (Array.isArray(value) && value.includes(option)) : value === option; return <TouchableOpacity key={option} onPress={() => set(q.id, q.type === 'MULTI_CHOICE' ? (selected ? value.filter((v) => v !== option) : [...(Array.isArray(value) ? value : []), option]) : option)} style={styles.check}><MaterialCommunityIcons name={selected ? (q.type === 'MULTI_CHOICE' ? 'checkbox-marked' : 'radiobox-marked') : (q.type === 'MULTI_CHOICE' ? 'checkbox-blank-outline' : 'radiobox-blank')} size={23} color={selected ? '#0D9488' : colors.textSecondary} /><Text style={{ color: colors.text, flex: 1 }}>{option}</Text></TouchableOpacity>; })}</View> : null}
    </View>;
  })}</View>;
}
const styles = StyleSheet.create({ section: { marginTop: 22 }, title: { fontSize: 17, fontWeight: '900' }, help: { marginTop: 4, marginBottom: 10, fontSize: 13 }, card: { borderWidth: 1, borderRadius: 12, padding: 13, marginBottom: 10 }, prompt: { fontSize: 14, lineHeight: 20, fontWeight: '800', marginBottom: 10 }, input: { minHeight: 46, borderWidth: 1, borderRadius: 9, padding: 11 }, area: { minHeight: 100, textAlignVertical: 'top' }, choices: { flexDirection: 'row', gap: 9 }, choice: { flex: 1, alignItems: 'center', padding: 11, borderWidth: 1, borderRadius: 9 }, check: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 }, optionList: { gap: 2 } });
