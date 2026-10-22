import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const QUESTION_TYPES = ['YES_NO', 'CHECKBOX', 'SHORT_TEXT', 'LONG_TEXT', 'NUMBER', 'DATE', 'SINGLE_CHOICE', 'MULTI_CHOICE'];
const newQuestion = () => ({ id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, prompt: '', type: 'YES_NO', required: false, options: [] });

export default function ApplicationQuestionBuilder({ value = [], onChange }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const update = (index, patch) => onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  return <View style={[styles.wrap, { borderColor: colors.border }]}>
    <Text style={[styles.title, { color: colors.text }]}>{t('jobs.applicationQuestions', 'Application questions')}</Text>
    <Text style={[styles.help, { color: colors.textSecondary }]}>{t('jobs.applicationQuestionsHelp', 'Optional questions applicants must answer when applying.')}</Text>
    {value.map((question, index) => <View key={question.id} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.row}><Text style={[styles.number, { color: colors.text }]}>{t('jobs.questionNumber', 'Question {{number}}').replace('{{number}}', index + 1)}</Text><TouchableOpacity onPress={() => onChange(value.filter((_, i) => i !== index))}><MaterialCommunityIcons name="trash-can-outline" size={21} color="#EF4444" /></TouchableOpacity></View>
      <TextInput value={question.prompt} onChangeText={(prompt) => update(index, { prompt })} placeholder={t('jobs.questionPlaceholder', 'Enter your question')} placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('jobs.answerType', 'Answer type')}</Text>
      <View style={styles.types}>{QUESTION_TYPES.map((type) => <TouchableOpacity key={type} onPress={() => update(index, { type, options: ['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(type) ? (question.options?.length ? question.options : ['', '']) : [] })} style={[styles.type, { borderColor: question.type === type ? '#0D9488' : colors.border, backgroundColor: question.type === type ? '#0D948815' : 'transparent' }]}><Text style={{ color: question.type === type ? '#0D9488' : colors.text, fontSize: 11, fontWeight: '700' }}>{t(`jobs.questionTypes.${type}`, type)}</Text></TouchableOpacity>)}</View>
      {['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(question.type) ? <View>{(question.options || []).map((option, optionIndex) => <View key={optionIndex} style={styles.optionRow}><TextInput value={option} onChangeText={(text) => update(index, { options: question.options.map((item, i) => i === optionIndex ? text : item) })} placeholder={`${t('jobs.option', 'Option')} ${optionIndex + 1}`} placeholderTextColor={colors.textSecondary} style={[styles.optionInput, { color: colors.text, borderColor: colors.border }]} /><TouchableOpacity onPress={() => update(index, { options: question.options.filter((_, i) => i !== optionIndex) })}><MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" /></TouchableOpacity></View>)}<TouchableOpacity onPress={() => update(index, { options: [...(question.options || []), ''] })}><Text style={styles.addOption}>+ {t('jobs.addOption', 'Add option')}</Text></TouchableOpacity></View> : null}
      <TouchableOpacity style={styles.requiredRow} onPress={() => update(index, { required: !question.required })}><MaterialCommunityIcons name={question.required ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={question.required ? '#0D9488' : colors.textSecondary} /><Text style={{ color: colors.text, fontWeight: '700' }}>{t('jobs.requiredQuestion', 'Required')}</Text></TouchableOpacity>
    </View>)}
    <TouchableOpacity style={styles.add} onPress={() => onChange([...value, newQuestion()])}><MaterialCommunityIcons name="plus-circle-outline" size={20} color="#0D9488" /><Text style={styles.addText}>{t('jobs.addApplicationQuestion', 'Add application question')}</Text></TouchableOpacity>
  </View>;
}

const styles = StyleSheet.create({ wrap: { marginTop: 18, borderTopWidth: 1, paddingTop: 18 }, title: { fontSize: 17, fontWeight: '900' }, help: { fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 12 }, card: { borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 12 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, number: { fontWeight: '900', marginBottom: 8 }, input: { borderWidth: 1, borderRadius: 10, padding: 11, minHeight: 46 }, label: { fontSize: 12, fontWeight: '800', marginTop: 12, marginBottom: 7 }, types: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, type: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 9, paddingVertical: 7 }, optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }, optionInput: { flex: 1, borderBottomWidth: 1, paddingVertical: 8 }, addOption: { color: '#0D9488', fontWeight: '800', marginTop: 10 }, requiredRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 }, add: { height: 48, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#0D9488', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, addText: { color: '#0D9488', fontWeight: '900' } });
