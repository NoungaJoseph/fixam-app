import i18n, { resolveI18nKey } from './index';

export const translate = (key, options) => {
  const resolved = resolveI18nKey(key);
  return i18n.t(resolved.key, { ns: resolved.ns, ...options });
};

export const translateStatus = (value, options) => {
  const code = String(value || '').trim().toUpperCase().replace(/\s+/g, '_');
  if (!code) return '';
  const translated = translate(`statuses.${code}`, options);
  return translated === code ? String(value) : translated;
};

export const translateService = (value, options) => {
  if (!value) return '';
  const translated = translate(`services.${value}`, options);
  return translated === value ? value : translated;
};

export const translateApiError = (error, fallbackKey = 'errors.generic') => {
  const code = error?.response?.data?.code || error?.response?.data?.errorCode;
  if (code) {
    const translated = translate(`errors.${code}`);
    if (translated !== code) return translated;
  }
  return translate(fallbackKey);
};
