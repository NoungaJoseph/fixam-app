import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { getMediaUrl } from '../services/api';

const AVATAR_COLORS = [
  '#0D9488',
  '#2563EB',
  '#7C3AED',
  '#DB2777',
  '#DC2626',
  '#EA580C',
  '#16A34A',
  '#475569',
];

const getInitial = (name) => {
  const value = String(name || '').trim();
  return (value.charAt(0) || 'U').toUpperCase();
};

const getColorForName = (name) => {
  const value = String(name || 'User');
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const UserAvatar = ({
  uri,
  name,
  size = 54,
  radius,
  style,
  imageStyle,
  textStyle,
}) => {
  const borderRadius = radius ?? size / 2;
  const baseStyle = [
    styles.avatar,
    style,
    {
      width: size,
      height: size,
      borderRadius,
      backgroundColor: getColorForName(name),
    },
  ];

  if (uri) {
    const fullUri = getMediaUrl(uri);
    return (
      <Image
        source={{ uri: fullUri }}
        style={[baseStyle, imageStyle]}
        contentFit="cover"
        transition={180}
        cachePolicy="disk"
      />
    );
  }

  return (
    <View style={baseStyle}>
      <Text style={[styles.initial, { fontSize: Math.max(13, size * 0.38) }, textStyle]}>
        {getInitial(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    color: '#FFF',
    fontWeight: '900',
    includeFontPadding: false,
    textAlign: 'center',
  },
});

export { getColorForName, getInitial };
export default UserAvatar;
