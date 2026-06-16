import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enHome from './locales/en/home.json';
import enJobs from './locales/en/jobs.json';
import enChat from './locales/en/chat.json';
import enSettings from './locales/en/settings.json';
import enWallet from './locales/en/wallet.json';
import enProfile from './locales/en/profile.json';
import enBooking from './locales/en/booking.json';
import enNotifications from './locales/en/notifications.json';
import enLegal from './locales/en/legal.json';

import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frHome from './locales/fr/home.json';
import frJobs from './locales/fr/jobs.json';
import frChat from './locales/fr/chat.json';
import frSettings from './locales/fr/settings.json';
import frWallet from './locales/fr/wallet.json';
import frProfile from './locales/fr/profile.json';
import frBooking from './locales/fr/booking.json';
import frNotifications from './locales/fr/notifications.json';
import frLegal from './locales/fr/legal.json';

export const SUPPORTED_LANGUAGES = ['en', 'fr'];
export const I18N_STORAGE_KEY = 'appLanguage';

export const namespaces = [
  'common',
  'auth',
  'home',
  'jobs',
  'chat',
  'settings',
  'wallet',
  'payments',
  'profile',
  'booking',
  'notifications',
  'legal',
];

const resources = {
  en: {
    common: normalizeNamespaceResource(enCommon, 'common'),
    auth: normalizeNamespaceResource(enAuth, 'auth'),
    home: normalizeNamespaceResource(enHome, 'home'),
    jobs: normalizeNamespaceResource(enJobs, 'jobs'),
    chat: normalizeNamespaceResource(enChat, 'chat'),
    settings: normalizeNamespaceResource(enSettings, 'settings'),
    wallet: normalizeNamespaceResource(enWallet, 'wallet'),
    payments: normalizeNamespaceResource(enWallet, 'payments'),
    profile: normalizeNamespaceResource(enProfile, 'profile'),
    booking: normalizeNamespaceResource(enBooking, 'booking', ['bookings']),
    notifications: normalizeNamespaceResource(enNotifications, 'notifications'),
    legal: normalizeNamespaceResource(enLegal, 'legal'),
  },
  fr: {
    common: normalizeNamespaceResource(frCommon, 'common'),
    auth: normalizeNamespaceResource(frAuth, 'auth'),
    home: normalizeNamespaceResource(frHome, 'home'),
    jobs: normalizeNamespaceResource(frJobs, 'jobs'),
    chat: normalizeNamespaceResource(frChat, 'chat'),
    settings: normalizeNamespaceResource(frSettings, 'settings'),
    wallet: normalizeNamespaceResource(frWallet, 'wallet'),
    payments: normalizeNamespaceResource(frWallet, 'payments'),
    profile: normalizeNamespaceResource(frProfile, 'profile'),
    booking: normalizeNamespaceResource(frBooking, 'booking', ['bookings']),
    notifications: normalizeNamespaceResource(frNotifications, 'notifications'),
    legal: normalizeNamespaceResource(frLegal, 'legal'),
  },
};

function normalizeNamespaceResource(resource, namespace, aliases = []) {
  return {
    ...resource,
    ...(resource?.[namespace] || {}),
    ...aliases.reduce((acc, alias) => ({ ...acc, ...(resource?.[alias] || {}) }), {}),
  };
}

function humanizeMissingKey(key) {
  const value = String(key || '').split('.').pop() || '';
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

export const getDeviceLanguage = () => {
  const code = Localization.getLocales()?.[0]?.languageCode?.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(code) ? code : 'en';
};

export const normalizeLanguage = (language) => {
  const code = String(language || '').split('-')[0].toLowerCase();
  return SUPPORTED_LANGUAGES.includes(code) ? code : 'en';
};

export const resolveI18nKey = (key) => {
  const value = String(key || '');
  const [maybeNamespace, ...path] = value.split(':');
  if (path.length > 0 && namespaces.includes(maybeNamespace)) {
    return { ns: maybeNamespace, key: path.join(':') };
  }
  const dotIndex = value.indexOf('.');
  if (dotIndex > 0) {
    const namespace = value.slice(0, dotIndex);
    if (namespaces.includes(namespace)) {
      return { ns: namespace, key: value.slice(dotIndex + 1) };
    }
  }
  return { ns: 'common', key: value };
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    returnNull: false,
    returnEmptyString: false,
    parseMissingKeyHandler: humanizeMissingKey,
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: namespaces,
    defaultNS: 'common',
    fallbackNS: namespaces,
    compatibilityJSON: 'v4',
    interpolation: { escapeValue: false },
    react: {
      bindI18n: 'languageChanged loaded',
      useSuspense: false,
    },
  });
}

export default i18n;
