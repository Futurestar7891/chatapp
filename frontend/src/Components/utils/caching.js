export const getCacheKey = (senderId, receiverId) => {
  return `messages_${[senderId, receiverId].sort().join("-")}`;
};

export const getCachedData = (cacheKey) => {
  const cachedData = sessionStorage.getItem(cacheKey);
  return cachedData ? JSON.parse(cachedData) : null;
};

export const setCachedData = (cacheKey, data) => {
  sessionStorage.setItem(cacheKey, JSON.stringify(data));
};
