const normalizeMessage = (value) => String(value || '').toLowerCase();

export const getVerificationStatus = (user) => (
  String(user?.providerProfile?.verification || user?.verification || 'UNVERIFIED').toUpperCase()
);

export const isIdentityVerified = (user) => getVerificationStatus(user) === 'VERIFIED';

export const getVerificationMessageKey = (user, action = 'generic') => {
  const status = getVerificationStatus(user);
  if (status === 'PENDING') return 'eligibility.verificationPending';
  if (status === 'REJECTED' || status === 'FAILED') return 'eligibility.verificationRejected';
  if (action === 'booking') return 'verification.bookingRequired';
  if (action === 'apply') return 'verification.jobRequired';
  return 'verification.requiredMessage';
};

export const translateApiError = (error, t, fallbackKey = 'common.tryAgain') => {
  const data = error?.response?.data || {};
  const code = String(data.code || '').toUpperCase();
  const raw = normalizeMessage(data.message);

  if (data.requiresVerification || code === 'VERIFICATION_REQUIRED' || raw.includes('verify your identity') || raw.includes('verification')) {
    return t('eligibility.verificationRequiredAction');
  }
  if (code === 'VERIFICATION_PENDING' || raw.includes('pending verification') || raw.includes('under review')) {
    return t('eligibility.verificationPending');
  }
  if (code === 'PROVIDER_OFFLINE' || raw.includes('available for work') || raw.includes('online')) {
    return t('eligibility.providerOffline');
  }
  if (code === 'INSUFFICIENT_COINS' || raw.includes('coin') || raw.includes('credit')) {
    return t('eligibility.insufficientCredits');
  }
  if (code === 'ALREADY_APPLIED' || raw.includes('already applied')) {
    return t('jobs.alreadyAppliedBody');
  }
  if (code === 'ACCOUNT_BLOCKED' || raw.includes('blocked')) {
    return t('eligibility.accountBlocked');
  }
  if (raw.includes('not available')) {
    return t('eligibility.notAvailable');
  }

  return data.message || t(fallbackKey);
};
