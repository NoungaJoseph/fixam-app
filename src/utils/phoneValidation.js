/**
 * Phone validation utilities for Cameroon mobile networks.
 * Validates phone numbers against MTN and Orange prefix ranges.
 */

const MTN_PREFIXES = [
  '650','651','652','653','654','655','656','657','658','659',
  '670','671','672','673','674','675','676','677','678','679',
  '680','681','682','683','684','685','686','687','688','689',
];

const ORANGE_PREFIXES = [
  '690','691','692','693','694','695','696','697','698','699',
];

/**
 * Detect the mobile network from a Cameroon phone number.
 * @param {string} phone - Phone number (with or without country code)
 * @returns {'MTN'|'ORANGE'|'UNKNOWN'|null}
 */
export const getNetworkFromPhone = (phone) => {
  if (!phone) return null;

  // Remove spaces, dashes, and country code
  let cleaned = phone.replace(/[\s\-]/g, '').replace(/^\+?237/, '');

  if (cleaned.length < 9) return null;

  const prefix = cleaned.substring(0, 3);

  if (MTN_PREFIXES.includes(prefix)) return 'MTN';
  if (ORANGE_PREFIXES.includes(prefix)) return 'ORANGE';
  return 'UNKNOWN';
};

/**
 * Validate that a phone number matches the selected payment provider.
 * @param {string} phone
 * @param {'MTN'|'ORANGE'} provider
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validatePhoneForProvider = (phone, provider) => {
  const network = getNetworkFromPhone(phone);

  if (!network || network === 'UNKNOWN') {
    return {
      valid: false,
      error: 'validation.invalidCameroonNumber',
    };
  }

  if (provider === 'MTN' && network !== 'MTN') {
    return {
      valid: false,
      error: 'validation.notMtnNumber',
    };
  }

  if (provider === 'ORANGE' && network !== 'ORANGE') {
    return {
      valid: false,
      error: 'validation.notOrangeNumber',
    };
  }

  return { valid: true, error: null };
};

/**
 * Format a Cameroon phone number to E.164 (+237...).
 * @param {string} phone
 * @returns {string}
 */
export const formatCameroonPhone = (phone) => {
  let cleaned = phone.replace(/[\s\-]/g, '').replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('+237')) return cleaned;
  if (cleaned.startsWith('237')) return '+' + cleaned;
  if (cleaned.length === 9) return '+237' + cleaned;
  return cleaned;
};
