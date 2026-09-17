import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { COLORS } from '../../services/theme';

const CustomButton = ({ title, onPress, mode = 'contained', style, labelStyle, loading, disabled }) => {
  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      style={[
        styles.button,
        mode === 'contained' ? styles.contained : styles.outlined,
        style
      ]}
      labelStyle={[styles.label, labelStyle]}
    >
      {title}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    marginVertical: 10,
    height: 56,
    justifyContent: 'center',
  },
  contained: {
    backgroundColor: COLORS.accent,
  },
  outlined: {
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default CustomButton;
