import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../services/theme';

const CategoryCard = ({ category, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(category)}>
      <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
        <MaterialCommunityIcons
          name={category.icon}
          size={32}
          color={category.color}
        />
      </View>
      <Text style={styles.name}>{category.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    borderRadius: 12,
    marginBottom: 8,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
});

export default CategoryCard;
