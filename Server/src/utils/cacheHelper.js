const ONE_DAY = 24 * 60 * 60 * 1000;
const STALE_THRESHOLD = 7 * ONE_DAY;

export const isExpired = (date) => {
  return (Date.now() - new Date(date)) > ONE_DAY;
};

export const isStale = (date) => {
  return (Date.now() - new Date(date)) > STALE_THRESHOLD;
};

export const getCacheTTL = (days = 1) => {
  return new Date(Date.now() + days * ONE_DAY);
};
