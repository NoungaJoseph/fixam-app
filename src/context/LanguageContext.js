import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nextProvider } from 'react-i18next';
import i18n, { I18N_STORAGE_KEY, normalizeLanguage, resolveI18nKey, SUPPORTED_LANGUAGES } from '../i18n';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(normalizeLanguage(i18n.language));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(I18N_STORAGE_KEY)
      .then(async (saved) => {
        const nextLanguage = saved ? normalizeLanguage(saved) : normalizeLanguage(i18n.language);
        if (nextLanguage !== normalizeLanguage(i18n.language)) {
          await i18n.changeLanguage(nextLanguage);
        }
        if (mounted) {
          setLocale(nextLanguage);
          setReady(true);
        }
      })
      .catch(() => {
        if (mounted) setReady(true);
      });

    const handleLanguageChanged = (language) => {
      if (mounted) {
        setLocale(normalizeLanguage(language));
      }
    };
    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      mounted = false;
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []); // Remove dependency on changing i18n instance

  const changeLanguage = useCallback(async (language) => {
    const nextLanguage = normalizeLanguage(language);
    await i18n.changeLanguage(nextLanguage);
    await AsyncStorage.setItem(I18N_STORAGE_KEY, nextLanguage);
    setLocale(nextLanguage);
  }, []);

  const t = useCallback((key, options) => {
    const resolved = resolveI18nKey(key);
    return i18n.t(resolved.key, { ns: resolved.ns, ...options });
  }, [locale]); // re-bind when locale changes

  const value = useMemo(() => ({
    language: locale,
    locale,
    ready,
    supportedLanguages: SUPPORTED_LANGUAGES,
    changeLanguage,
    t,
  }), [changeLanguage, locale, ready, t]);


  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={value}>
        {children}
      </LanguageContext.Provider>
    </I18nextProvider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
};
