import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function MaterialsListEditor({
  items = [],
  onChangeItems,
  requiresDiagnosis = false,
  onToggleDiagnosis,
  readOnly = false
}) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  // Ensure at least one empty field row exists when not requiring diagnosis
  const rows = items.length === 0 ? [{ id: '1', name: '', quantity: '' }] : items;

  const handleUpdateItem = (index, field, value) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    onChangeItems(updated);
  };

  const handleAddRow = () => {
    const newRow = { id: String(Date.now() + Math.random()), name: '', quantity: '' };
    onChangeItems([...rows, newRow]);
  };

  const handleRemoveRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    onChangeItems(updated);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('jobs.materialsAndEquipment', 'Materials & Equipment')}
          </Text>
        </View>
      </View>

      {/* Diagnosis Toggle */}
      {onToggleDiagnosis && !readOnly && (
        <View style={[styles.toggleCard, { backgroundColor: requiresDiagnosis ? (isDark ? '#0F2942' : '#EFF6FF') : (isDark ? '#0F172A' : '#FFFFFF') }]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.toggleTitle, { color: requiresDiagnosis ? '#1D4ED8' : colors.text }]}>
              {t('jobs.requiresDiagnosisQuestion', 'Does the provider need to diagnose first?')}
            </Text>
          </View>
          <Switch
            value={requiresDiagnosis}
            onValueChange={onToggleDiagnosis}
            trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
            thumbColor={requiresDiagnosis ? '#2563EB' : '#F1F5F9'}
          />
        </View>
      )}

      {/* If Diagnosis Required */}
      {requiresDiagnosis ? (
        <View style={[styles.diagnosisNotice, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF', borderColor: '#818CF8' }]}>
          <MaterialCommunityIcons name="information-outline" size={18} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={[styles.diagnosisText, { color: isDark ? '#C7D2FE' : '#3730A3' }]}>
            {t('jobs.diagnosisNoticeText', 'Diagnosis required first. No materials list needed upfront.')}
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            {t('jobs.addNeededMaterial', 'Add Needed Material / Equipment')}
          </Text>

          {/* Dynamic Field Rows */}
          {rows.map((item, index) => (
            <View key={item.id || String(index)} style={styles.rowContainer}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 2, backgroundColor: isDark ? '#0F172A' : '#FFFFFF', color: colors.text, borderColor: isDark ? '#475569' : '#CBD5E1' }
                ]}
                placeholder={t('jobs.materialNamePlaceholder', 'Material / Tool name')}
                placeholderTextColor={colors.textSecondary}
                value={item.name}
                onChangeText={(val) => handleUpdateItem(index, 'name', val)}
                editable={!readOnly}
              />
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, backgroundColor: isDark ? '#0F172A' : '#FFFFFF', color: colors.text, borderColor: isDark ? '#475569' : '#CBD5E1' }
                ]}
                placeholder={t('jobs.quantityPlaceholder', 'Qty (e.g. 2)')}
                placeholderTextColor={colors.textSecondary}
                value={item.quantity}
                onChangeText={(val) => handleUpdateItem(index, 'quantity', val)}
                editable={!readOnly}
              />

              {!readOnly && (
                <TouchableOpacity onPress={() => handleRemoveRow(index)} style={styles.removeBtn}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Add Another Item Button */}
          {!readOnly && (
            <TouchableOpacity style={styles.addAnotherBtn} onPress={handleAddRow}>
              <MaterialCommunityIcons name="plus" size={18} color="#0D9488" />
              <Text style={styles.addAnotherText}>
                {t('jobs.addAnotherItem', '+ Add another item')}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  diagnosisNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  diagnosisText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  removeBtn: {
    padding: 6,
  },
  addAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
  },
  addAnotherText: {
    color: '#0D9488',
    fontWeight: '700',
    fontSize: 13,
  },
});
