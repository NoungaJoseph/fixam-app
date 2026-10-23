import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const parseQuestionsList = (questions) => {
  if (!questions) return [];
  if (Array.isArray(questions)) return questions;
  if (typeof questions === 'string') {
    try {
      const parsed = JSON.parse(questions);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
};

export const missingRequiredAnswer = (questions = [], answers = {}) => {
  const list = parseQuestionsList(questions);
  return list.find((q) => {
    if (!q.required) return false;
    const ans = answers?.[q.id];
    if (ans === undefined || ans === null || ans === '') return true;
    if (Array.isArray(ans) && !ans.length) return true;
    if (q.type === 'CHECKBOX' && ans !== true) return true;
    return false;
  });
};

export default function ScreeningQuestionFields({ questions = [], answers = {}, onChange }) {
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();

  const list = parseQuestionsList(questions);
  if (!list.length) return null;

  const set = (id, value) => {
    if (onChange) {
      onChange({ ...answers, [id]: value });
    }
  };

  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const inputBg = isDarkMode ? '#0F172A' : '#F8FAFC';

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#0D9488" />
          <Text style={[styles.title, { color: colors.text }]}>
            {t('jobs.recruiterQuestions', 'Recruiter Questions')}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{list.length} {list.length === 1 ? 'Question' : 'Questions'}</Text>
        </View>
      </View>
      <Text style={[styles.help, { color: colors.textSecondary }]}>
        {t('jobs.answerQuestionsHelp', 'Please answer the employer screening questions below.')}
      </Text>

      {list.map((q, index) => {
        const value = answers?.[q.id];
        const textInput = ['SHORT_TEXT', 'LONG_TEXT', 'NUMBER', 'DATE'].includes(q.type);
        const isLast = index === list.length - 1;

        return (
          <View
            key={q.id || `q-${index}`}
            style={[
              styles.questionItem,
              { borderBottomColor: colors.border },
              isLast && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }
            ]}
          >
            <View style={styles.promptRow}>
              <Text style={[styles.prompt, { color: colors.text }]}>
                {index + 1}. {q.prompt}
                {q.required ? <Text style={{ color: '#EF4444', fontWeight: '900' }}> *</Text> : null}
              </Text>
              {q.required && (
                <View style={styles.requiredPill}>
                  <Text style={styles.requiredPillText}>{t('common.required', 'Required')}</Text>
                </View>
              )}
            </View>

            {textInput ? (
              <TextInput
                value={value === undefined ? '' : String(value)}
                onChangeText={(text) => set(q.id, text)}
                multiline={q.type === 'LONG_TEXT'}
                keyboardType={q.type === 'NUMBER' ? 'numeric' : 'default'}
                placeholder={q.type === 'DATE' ? 'YYYY-MM-DD' : t('jobs.enterAnswer', 'Enter your answer...')}
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  q.type === 'LONG_TEXT' && styles.area,
                  { color: colors.text, borderColor: colors.border, backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }
                ]}
              />
            ) : null}

            {q.type === 'YES_NO' ? (
              <View style={styles.choices}>
                {['YES', 'NO'].map((option) => {
                  const isSelected = value === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => set(q.id, option)}
                      style={[
                        styles.choice,
                        {
                          borderColor: isSelected ? '#0D9488' : colors.border,
                          backgroundColor: isSelected ? '#0D948818' : (isDarkMode ? '#1E293B' : '#FFFFFF')
                        }
                      ]}
                    >
                      <Text style={{ color: isSelected ? '#0D9488' : colors.text, fontWeight: '800' }}>
                        {t(`jobs.${option.toLowerCase()}`, option)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            {q.type === 'CHECKBOX' ? (
              <TouchableOpacity style={styles.check} onPress={() => set(q.id, !value)}>
                <MaterialCommunityIcons
                  name={value ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={value ? '#0D9488' : colors.textSecondary}
                />
                <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>
                  {t('jobs.confirmStatement', 'I confirm')}
                </Text>
              </TouchableOpacity>
            ) : null}

            {['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(q.type) ? (
              <View style={styles.optionList}>
                {(q.options || []).map((option) => {
                  const selected = q.type === 'MULTI_CHOICE'
                    ? (Array.isArray(value) && value.includes(option))
                    : value === option;

                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => {
                        if (q.type === 'MULTI_CHOICE') {
                          const currentArr = Array.isArray(value) ? value : [];
                          set(q.id, selected ? currentArr.filter((v) => v !== option) : [...currentArr, option]);
                        } else {
                          set(q.id, option);
                        }
                      }}
                      style={[
                        styles.check,
                        {
                          backgroundColor: selected ? '#0D948812' : (isDarkMode ? '#1E293B' : '#FFFFFF'),
                          borderColor: selected ? '#0D9488' : colors.border,
                          borderWidth: 1,
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          marginBottom: 6,
                        }
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={selected
                          ? (q.type === 'MULTI_CHOICE' ? 'checkbox-marked' : 'radiobox-marked')
                          : (q.type === 'MULTI_CHOICE' ? 'checkbox-blank-outline' : 'radiobox-blank')}
                        size={22}
                        color={selected ? '#0D9488' : colors.textSecondary}
                      />
                      <Text style={{ color: colors.text, flex: 1, fontSize: 14, fontWeight: '600' }}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 22,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
  },
  countBadge: {
    backgroundColor: '#0D948815',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D9488',
  },
  help: {
    marginTop: 2,
    marginBottom: 16,
    fontSize: 12,
    lineHeight: 18,
  },
  questionItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 20,
    marginBottom: 20,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  prompt: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    flex: 1,
  },
  requiredPill: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  requiredPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    fontSize: 14,
  },
  area: {
    minHeight: 110,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  choices: {
    flexDirection: 'row',
    gap: 10,
  },
  choice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  optionList: {
    gap: 6,
  },
});
