// Quran data caching with localStorage
// Cache static Quran data to reduce API calls

const CACHE_KEYS = {
  SURAHS: 'quran_surahs_cache',
  JUZ: 'quran_juz_cache',
  PAGES_META: 'quran_pages_meta_cache',
};

const CACHE_VERSIONS = {
  SURAHS: 'v1',      // Change only when Surahs data changes
  JUZ: 'v1',         // Change only when Juz data changes
  PAGES_META: 'v1',  // Change only when Pages data changes
};
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// Get cached data
export const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp, version } = JSON.parse(cached);
    
    // Get expected version for this cache key
    const expectedVersion = CACHE_VERSIONS[key.replace('quran_', '').replace('_cache', '').toUpperCase().replace('-', '_')];
    
    // Check version first - if version changed, invalidate cache
    if (version !== expectedVersion) {
      localStorage.removeItem(key);
      return null;
    }
    
    const isExpired = Date.now() - timestamp > CACHE_DURATION;

    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

// Set cached data
export const setCachedData = (key, data) => {
  try {
    const versionKey = key.replace('quran_', '').replace('_cache', '').toUpperCase().replace('-', '_');
    const cacheObj = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSIONS[versionKey],
    };
    localStorage.setItem(key, JSON.stringify(cacheObj));
  } catch (err) {
    console.warn('Failed to cache data:', err);
  }
};

// Clear all Quran cache
export const clearQuranCache = () => {
  Object.values(CACHE_KEYS).forEach(key => localStorage.removeItem(key));
};

// Get page from cache by number
export const getCachedPage = (pageNumber) => {
  const allPages = getCachedData(CACHE_KEYS.PAGES_META);
  if (!allPages) return null;
  return allPages.find(p => p.pageNumber === pageNumber);
};

// Cache all pages metadata
export const cacheAllPages = (pages) => {
  setCachedData(CACHE_KEYS.PAGES_META, pages);
};

// Fetch with cache
export const fetchWithCache = async (cacheKey, fetchFn) => {
  // Try cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  // Fetch from API
  const data = await fetchFn();
  
  // Cache the result
  setCachedData(cacheKey, data);
  
  return data;
};

export { CACHE_KEYS };
