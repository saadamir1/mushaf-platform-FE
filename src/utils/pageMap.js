import { QURAN, STORAGE_KEYS } from './constants';
import { storage } from './helpers';

/** Resolve active Surah for a page from startPageNumber map. */
export function resolveSurahForPage(surahs = [], pageNumber) {
  const sorted = [...surahs]
    .filter((s) => s.startPageNumber != null)
    .sort((a, b) => a.startPageNumber - b.startPageNumber);
  let match = sorted[0] || null;
  for (const s of sorted) {
    if (s.startPageNumber <= pageNumber) match = s;
    else break;
  }
  return match;
}

export function resolveJuzForPage(juzList = [], pageNumber) {
  const sorted = [...juzList]
    .filter((j) => j.startPageNumber != null)
    .sort((a, b) => a.startPageNumber - b.startPageNumber);
  let match = sorted[0] || null;
  for (const j of sorted) {
    if (j.startPageNumber <= pageNumber) match = j;
    else break;
  }
  return match;
}

export function clampPage(n) {
  return Math.max(1, Math.min(QURAN.TOTAL_PAGES, parseInt(n, 10) || 1));
}

export function pageProgress(pageNumber) {
  return Math.round((clampPage(pageNumber) / QURAN.TOTAL_PAGES) * 100);
}

/** Preload adjacent page images for smooth flipping. */
export function preloadPageImages(urls = []) {
  urls.filter(Boolean).forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

export function rememberLastPage(pageNumber) {
  storage.set(STORAGE_KEYS.LAST_PAGE, String(clampPage(pageNumber)));
  bumpReadingStreak();
}

export function getLastPage() {
  const v = storage.get(STORAGE_KEYS.LAST_PAGE);
  return v ? clampPage(v) : 1;
}

function bumpReadingStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const raw = storage.get(STORAGE_KEYS.READING_STREAK);
  let data = { lastDate: null, count: 0 };
  try {
    data = raw ? JSON.parse(raw) : data;
  } catch {
    data = { lastDate: null, count: 0 };
  }
  if (data.lastDate === today) return data;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  data.count = data.lastDate === yesterday ? (data.count || 0) + 1 : 1;
  data.lastDate = today;
  storage.set(STORAGE_KEYS.READING_STREAK, JSON.stringify(data));
  return data;
}

export function getReadingStreak() {
  try {
    return JSON.parse(storage.get(STORAGE_KEYS.READING_STREAK) || '{}');
  } catch {
    return { count: 0 };
  }
}

/** Local khatm plan (client-side mirror of BE algorithm). */
export function buildKhatmPlan(fromPage = 1, days = 30) {
  const start = clampPage(fromPage);
  const remaining = QURAN.TOTAL_PAGES - start + 1;
  const d = Math.max(1, Math.min(365, days));
  const perDay = Math.ceil(remaining / d);
  const schedule = [];
  let cursor = start;
  for (let i = 1; i <= d && cursor <= QURAN.TOTAL_PAGES; i++) {
    const end = Math.min(QURAN.TOTAL_PAGES, cursor + perDay - 1);
    schedule.push({ day: i, from: cursor, to: end, pages: end - cursor + 1 });
    cursor = end + 1;
  }
  return { fromPage: start, days: d, pagesPerDay: perDay, remaining, schedule };
}
