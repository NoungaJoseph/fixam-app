import { Platform } from 'react-native';

export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  system: Platform.OS === 'ios' ? 'System' : 'Roboto'
};

export const fontSize = {
  xs: 11,      // timestamps, labels
  sm: 13,      // captions, helper text
  base: 15,    // body text, list items
  md: 17,      // subheadings, card titles
  lg: 20,      // section headers
  xl: 24,      // page titles
  xxl: 28,     // hero text, welcome screens
  xxxl: 32     // large display numbers
};

export const typography = {
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    lineHeight: 32
  },
  h2: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    lineHeight: 28
  },
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    lineHeight: 24
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: 22
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    lineHeight: 22
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: 18
  },
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    lineHeight: 20
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    lineHeight: 16
  }
};
