// Static Quran data - fallback when backend is offline
import surahs from './surahs.json';
import pages from './pages.json';
import juz from './juz.json';

export const STATIC_SURAHS = surahs;
export const STATIC_PAGES = pages;
export const STATIC_JUZ = juz;

// Helper to get page by number
export const getStaticPage = (pageNumber) => {
  return STATIC_PAGES.find(p => p.pageNumber === pageNumber);
};
