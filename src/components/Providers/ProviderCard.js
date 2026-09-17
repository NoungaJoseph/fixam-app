import React from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getMediaUrl } from '../../services/api';

const ProviderCard = ({ provider, onPress, onCall, onChat }) => {
  const { colors, isDarkMode } = useTheme();
  const imageUri = getMediaUrl(provider.image || provider.avatar || provider.user?.avatar);
  
  return (
    <Card style={[styles.card, { backgroundColor: colors.card }]} onPress={onPress}>
      <View style={styles.container}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback, { backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
            <Text style={[styles.imageInitial, { color: colors.accent }]}>{(provider.name || provider.user?.fullName || '?').charAt(0)}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{provider.name}</Text>
          <Text style={[styles.skill, { color: colors.textSecondary }]}>{provider.skill}</Text>
          <View style={styles.row}>
            <MaterialCommunityIcons name="star" size={16} color="#FBBF24" />
            <Text style={[styles.rating, { color: colors.text }]}>{provider.rating}</Text>
            <Text style={[styles.dot, { color: colors.placeholder }]}> • </Text>
            <Text style={[styles.distance, { color: colors.textSecondary }]}>{provider.distance}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onChat} style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
            <MaterialCommunityIcons name="message-text" size={20} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onCall} style={[styles.iconButton, { backgroundColor: colors.accentSoft }]}>
            <MaterialCommunityIcons name="phone" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2E8F0',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageInitial: {
    fontSize: 20,
    fontWeight: '900',
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
  },
  skill: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  rating: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 4,
  },
  dot: {
    fontSize: 13,
  },
  distance: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProviderCard;
