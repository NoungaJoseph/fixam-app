import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function MaterialsListDisplay({
  materialsList = [],
  requiresDiagnosis = false
}) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  if (requiresDiagnosis) {
    return (
      <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="stethoscope" size={20} color="#2563EB" style={{ marginRight: 8 }} />
          <Text style={[styles.title, { color: colors.text }]}>
            {t('jobs.diagnosisRequiredFirst', 'Diagnosis required first')}
          </Text>
        </View>
      </View>
    );
  }

  if (!materialsList || materialsList.length === 0) {
    return null;
  }

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('jobs.requiredMaterialsAndEquipment', 'Required Materials & Equipment')}
        </Text>
      </View>

      <View style={{ marginTop: 6 }}>
        {materialsList.map((item, idx) => (
          <View key={item.id || idx} style={[styles.itemRow, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
            <MaterialCommunityIcons name="circle-small" size={18} color="#0D9488" />
            <Text style={[styles.itemText, { color: colors.text }]}>{item.name}</Text>
            {Boolean(item.quantity) && (
              <Text style={[styles.itemQty, { color: colors.textSecondary }]}>({item.quantity})</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  itemText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  itemQty: {
    fontSize: 12,
  },
});
