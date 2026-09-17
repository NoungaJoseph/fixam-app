import { DefaultTheme } from 'react-native-paper';

export const COLORS = {
  primary: '#0D1B2A',      // Deep navy
  accent: '#0D9488',
  accentSoft: '#EAF2FF',
  teal: '#14B8A6',
  background: '#FAFAFA',
  surface: '#FFFFFF',      // Card white
  text: '#0D1B2A',
  textSecondary: '#4B5563',
  placeholder: '#6B7280',
  success: '#22C55E',
  error: '#EF4444',
  white: '#FFFFFF',
  border: '#E5E7EB',
  tagBg: '#E8ECF5',
  tagText: '#4B5563',
  navyDark: '#0D1B2A',
};

export const FONTS = {
  regular: { fontFamily: 'Inter-Regular', fontWeight: '400' },
  medium: { fontFamily: 'Inter-Medium', fontWeight: '500' },
  semiBold: { fontFamily: 'Inter-SemiBold', fontWeight: '600' },
  bold: { fontFamily: 'Inter-Bold', fontWeight: '700' },
  extraBold: { fontFamily: 'Inter-Black', fontWeight: '800' },
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    accent: COLORS.accent,
    background: COLORS.background,
    surface: COLORS.surface,
    text: COLORS.text,
    placeholder: COLORS.placeholder,
    outline: COLORS.border,
  },
};
