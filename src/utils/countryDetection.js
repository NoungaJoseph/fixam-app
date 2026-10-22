import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import api from '../services/api';
import { SUPPORTED_COUNTRIES } from '../constants/countries';

export const COUNTRY_STORAGE_KEY = 'FIXAM_LAST_SELECTED_COUNTRY';

const findCountry = (value) => SUPPORTED_COUNTRIES.find((country) =>
  country.name === value || country.code === String(value || '').toUpperCase()
);

export const detectPreferredCountry = async () => {
  const stored = await AsyncStorage.getItem(COUNTRY_STORAGE_KEY).catch(() => null);
  const storedCountry = findCountry(stored);
  if (storedCountry) return storedCountry;

  const deviceCountry = findCountry(Localization.getLocales?.()?.[0]?.regionCode);
  if (deviceCountry) return deviceCountry;

  try {
    const response = await api.get('/auth/detect-country');
    const detected = findCountry(response.data?.data?.countryCode) || findCountry(response.data?.data?.country);
    if (detected) return detected;
  } catch (_) {}
  return SUPPORTED_COUNTRIES[0];
};

export const rememberCountry = (country) => AsyncStorage.setItem(COUNTRY_STORAGE_KEY, country.name);
