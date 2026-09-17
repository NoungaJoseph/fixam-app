import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAppContext } from '../../context/AppContext';
import { CustomHeader } from '../../navigation/NavigationComponents';

const NotificationsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const { notifications } = useAppContext();

  const renderItem = ({ item }) => (
    <View style={[styles.notiItem, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
        <MaterialCommunityIcons 
          name={item.type === 'MESSAGE' ? 'message-text-outline' : 'bell-outline'} 
          size={22} 
          color={colors.accent} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{item.message}</Text>
        <Text style={[styles.time, { color: colors.textTertiary || '#888' }]}>
          {new Date(item.createdAt).toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US')}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <CustomHeader navigation={navigation} title={t('notifications.title')} colors={colors} />
      
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="bell-off-outline" size={80} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t('notifications.emptyYet')}</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t('notifications.emptySubtitle')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 20 },
  notiItem: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, gap: 15 },
  iconContainer: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  body: { fontSize: 14, lineHeight: 20 },
  time: { fontSize: 11, marginTop: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 20 },
  emptySub: { fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 20 },
});

export default NotificationsScreen;
