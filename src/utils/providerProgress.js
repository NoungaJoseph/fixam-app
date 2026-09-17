const DAY_MS = 24 * 60 * 60 * 1000;

const startOfLocalDay = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

const collectCompletionDates = (user, jobs = []) => {
  const candidates = [
    user?.completedJobs,
    user?.jobHistory,
    user?.providerProfile?.completedJobs,
    user?.providerProfile?.jobHistory,
    user?.providerProfile?.completionHistory,
  ].filter(Array.isArray).flat();

  const userId = user?.id;
  const providerId = user?.providerProfile?.id;
  const completedJobs = (jobs || []).filter((job) => {
    const status = String(job.status || '').toUpperCase();
    const belongsToProvider = !userId && !providerId
      ? true
      : job.providerId === providerId ||
        job.providerId === userId ||
        job.provider?.id === providerId ||
        job.provider?.id === userId ||
        job.provider?.userId === userId ||
        job.provider?.user?.id === userId ||
        job.assignments?.some((assignment) => (
          assignment.providerId === providerId ||
          assignment.provider?.id === providerId ||
          assignment.provider?.user?.id === userId
        ));
    return status === 'COMPLETED' && belongsToProvider;
  });

  return [...candidates, ...completedJobs]
    .map((item) => item.completedAt || item.completedDate || item.finishedAt || item.updatedAt || item.createdAt || item.date)
    .map(startOfLocalDay)
    .filter((value) => value !== null);
};

export const getLevelProgress = (completedCount = 0) => {
  const safeCount = Math.max(0, Number(completedCount) || 0);
  let level = 1;
  let currentThreshold = 0;
  let nextThreshold = 5;

  while (level < 200 && safeCount >= nextThreshold) {
    level += 1;
    currentThreshold = nextThreshold;
    nextThreshold += level * 5;
  }

  const span = Math.max(1, nextThreshold - currentThreshold);
  const progressCount = Math.max(0, safeCount - currentThreshold);

  return {
    level,
    currentThreshold,
    nextThreshold,
    progressCount,
    remaining: Math.max(0, nextThreshold - safeCount),
    progress: Math.min(1, progressCount / span),
  };
};

export const getProviderProgress = (user, jobs = []) => {
  const completionDates = collectCompletionDates(user, jobs);
  const explicitCompleted = Number(user?.providerProfile?.jobsCompleted ?? user?.jobsCompleted);
  const completedCount = Number.isFinite(explicitCompleted) && explicitCompleted > 0
    ? explicitCompleted
    : completionDates.length;

  const uniqueDays = Array.from(new Set(completionDates)).sort((a, b) => b - a);
  const today = startOfLocalDay(new Date());
  const yesterday = today - DAY_MS;
  const activeToday = uniqueDays.includes(today);
  let cursor = activeToday ? today : uniqueDays.includes(yesterday) ? yesterday : null;
  let dailyStreak = 0;

  while (cursor !== null && uniqueDays.includes(cursor)) {
    dailyStreak += 1;
    cursor -= DAY_MS;
  }

  const completedToday = completionDates.filter((day) => day === today).length;

  return {
    completedCount,
    completedToday,
    dailyStreak,
    activeToday,
    ...getLevelProgress(completedCount),
  };
};
