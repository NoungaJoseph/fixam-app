import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'appTheme';

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); // 'dark' | 'light' | null
  const [themeMode, setThemeMode] = useState('system'); // 'system' | 'dark' | 'light'

  // Initialize immediately from system appearance so iPhone dark mode users see dark mode on launch
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const initialSystem = Appearance.getColorScheme() || systemColorScheme;
    return initialSystem === 'dark';
  });

  // Sync with native Appearance changes (e.g. iOS Control Center toggle or sunrise/sunset schedule)
  useEffect(() => {
    const handleAppearanceChange = ({ colorScheme }) => {
      if (themeMode === 'system') {
        const isDark = (colorScheme || Appearance.getColorScheme() || systemColorScheme) === 'dark';
        setIsDarkMode(isDark);
      }
    };

    const subscription = Appearance.addChangeListener(handleAppearanceChange);
    return () => subscription.remove();
  }, [themeMode, systemColorScheme]);

  // Sync with React Native's useColorScheme hook as well for maximum reliability
  useEffect(() => {
    if (themeMode === 'system') {
      const activeScheme = systemColorScheme || Appearance.getColorScheme();
      if (activeScheme) {
        setIsDarkMode(activeScheme === 'dark');
      }
    }
  }, [systemColorScheme, themeMode]);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'dark') {
          // User explicitly enabled dark mode — honour their choice
          setThemeMode('dark');
          setIsDarkMode(true);
        } else {
          // 'light', null, or any other value → follow the system appearance
          // (clear stale 'light' override from the old toggle so the app
          //  always mirrors the iPhone / Android system dark-mode setting)
          if (saved === 'light') {
            await AsyncStorage.removeItem(THEME_STORAGE_KEY);
          }
          setThemeMode('system');
          const currentSystem = Appearance.getColorScheme() || systemColorScheme;
          if (currentSystem) {
            setIsDarkMode(currentSystem === 'dark');
          }
        }
      } catch (err) {
        console.log('Failed to load theme:', err);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    try {
      if (isDarkMode) {
        // Turning OFF dark mode → revert to following system appearance
        // (this is how iPhone users expect it: system controls the theme)
        setThemeMode('system');
        await AsyncStorage.removeItem(THEME_STORAGE_KEY);
        const currentSystem = Appearance.getColorScheme() || systemColorScheme;
        setIsDarkMode(currentSystem === 'dark');
      } else {
        // Turning ON dark mode → explicit dark override
        setIsDarkMode(true);
        setThemeMode('dark');
        await AsyncStorage.setItem(THEME_STORAGE_KEY, 'dark');
      }
    } catch (err) {
      console.log('Failed to save theme:', err);
    }
  };

  const setTheme = async (mode) => {
    try {
      setThemeMode(mode);
      if (mode === 'system') {
        await AsyncStorage.removeItem(THEME_STORAGE_KEY);
        const currentSystem = Appearance.getColorScheme() || systemColorScheme;
        if (currentSystem) {
          setIsDarkMode(currentSystem === 'dark');
        }
      } else {
        const isDark = mode === 'dark';
        setIsDarkMode(isDark);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      }
    } catch (err) {
      console.log('Failed to set theme:', err);
    }
  };

  const hasUserPreference = themeMode !== 'system';
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ isDarkMode, isDark: isDarkMode, themeMode, toggleTheme, setTheme, hasUserPreference, colors }}>
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
