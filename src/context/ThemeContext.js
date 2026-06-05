import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleTheme = () => setIsDarkMode(v => !v);
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

// ─── PREMIUM LIGHT MODE ────────────────────────────────────────────────────────
const LIGHT_COLORS = {
  // Brand
  primary:      '#0F172A',
  accent:       '#0D9488',        // Primary Teal
  accentBlue:   '#2563EB',        // Modern Blue
  accentLight:  '#14B8A6',        // Secondary Teal
  accentSoft:   '#F0FDFA',        // Teal wash
  accentBlueSoft: '#EFF6FF',
  teal:         '#14B8A6',

  // Surfaces
  background:   '#F8FAFC',
  surface:      '#FFFFFF',
  card:         '#FFFFFF',
  tabBar:       '#FFFFFF',
  divider:      '#F1F5F9',

  // Text
  text:          '#0F172A',
  textSecondary: '#64748B',
  placeholder:   '#94A3B8',

  // Borders
  border:        '#E2E8F0',

  // Status
  success:  '#22C55E',
  warning:  '#F59E0B',
  error:    '#EF4444',
  info:     '#2563EB',

  // Gradients (used in JS-driven gradient backgrounds)
  gradientStart: '#0D9488',
  gradientEnd:   '#2563EB',

  // Misc
  white:    '#FFFFFF',
  navyDark: '#0F172A',
  overlay:  'rgba(15,23,42,0.5)',
};

// ─── PREMIUM DARK MODE ─────────────────────────────────────────────────────────
const DARK_COLORS = {
  // Brand
  primary:      '#F8FAFC',
  accent:       '#14B8A6',        // Brighter teal for dark
  accentBlue:   '#2563EB',
  accentLight:  '#0D9488',
  accentSoft:   'rgba(20,184,166,0.15)',
  accentBlueSoft: 'rgba(59,130,246,0.15)',
  teal:         '#2DD4BF',

  // Surfaces
  background:   '#0B1120',
  surface:      '#111827',
  card:         '#111827',
  tabBar:       '#111827',
  divider:      '#1F2937',

  // Text
  text:          '#F9FAFB',
  textSecondary: '#9CA3AF',
  placeholder:   '#6B7280',

  // Borders
  border:        '#1F2937',

  // Status
  success:  '#22C55E',
  warning:  '#F59E0B',
  error:    '#EF4444',
  info:     '#60A5FA',

  // Gradients
  gradientStart: '#0D9488',
  gradientEnd:   '#1D4ED8',

  // Misc
  white:    '#FFFFFF',
  navyDark: '#0B1120',
  overlay:  'rgba(11,17,32,0.72)',
};
