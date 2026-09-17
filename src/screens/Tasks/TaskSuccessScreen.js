import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';


import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const TaskSuccessScreen = ({ navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();

  return (
    <View 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="check-circle" size={90} color={colors.success} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t('jobs.taskPosted')}</Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('jobs.taskPostedSubtitle')}
        </Text>

        <View style={[styles.infoBox, { backgroundColor: colors.accentSoft }]}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={colors.accent} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.infoTitle, { color: colors.accent }]}>{t('jobs.whatHappensNext')}</Text>
            <Text style={[styles.infoText, { color: colors.accent }]}>
              {t('jobs.taskApprovalNotification')}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('MyTasksMain')}
          >
            <MaterialCommunityIcons name="eye-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>{t('jobs.viewJobStatus')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.primary }]}
            onPress={() => navigation.navigate('PostTask')}
          >
            <MaterialCommunityIcons name="plus" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>{t('jobs.postAnotherTask')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => navigation.getParent()?.navigate('MainTabs', { screen: 'Home' })}
          >
            <MaterialCommunityIcons name="home-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>{t('common.returnHome')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 30,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  iconWrap: { 
    marginBottom: 24,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    textAlign: 'center', 
    marginBottom: 12 
  },
  subtitle: { 
    fontSize: 15, 
    textAlign: 'center', 
    lineHeight: 22, 
    marginBottom: 30 
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    width: '100%',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    borderRadius: 10,
    paddingVertical: 16, 
    width: '100%', 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 10, 
    elevation: 5,
  },
  primaryBtnText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  secondaryBtn: {
    borderWidth: 1.5, 
    borderRadius: 10,
    paddingVertical: 15, 
    width: '100%', 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryBtnText: { 
    fontSize: 16, 
    fontWeight: '700' 
  },
});

export default TaskSuccessScreen;
