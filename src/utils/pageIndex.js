/**
 * Image pages cannot be searched as text.
 * Industry pattern for scanned Mushaf:
 *  1) Surah/Juz → startPageNumber (external index)
 *  2) Topic/keyword → pageNumber (topic_index)
 *  3) Hotspots = % boxes on the IMAGE that jump to topics
 * This module builds that index client-side from static + API data.
 */
import { QURAN } from './constants';

export function buildSurahPageIndex(surahs = []) {
  const sorted = [...surahs]
    .filter((s) => s.startPageNumber != null)
    .sort((a, b) => a.startPageNumber - b.startPageNumber);

  const byPage = new Array(QURAN.TOTAL_PAGES + 1).fill(null);
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const start = s.startPageNumber;
    const end = i + 1 < sorted.length
      ? sorted[i + 1].startPageNumber - 1
      : QURAN.TOTAL_PAGES;
    for (let p = start; p <= end; p++) {
      byPage[p] = {
        surahNumber: s.surahNumber,
        nameEnglish: s.nameEnglish,
        nameArabic: s.nameArabic,
        nameUrdu: s.nameUrdu,
        revelationType: s.revelationType,
        startPageNumber: s.startPageNumber,
        endPageNumber: end,
      };
    }
  }
  return byPage;
}

/** If Juz lacks startPageNumber, split Mushaf evenly across 30 juz (algorithmic fallback). */
export function buildJuzPageIndex(juzList = [], totalPages = QURAN.TOTAL_PAGES) {
  const withStarts = [...juzList]
    .filter((j) => j.startPageNumber != null)
    .sort((a, b) => a.startPageNumber - b.startPageNumber);

  const byPage = new Array(totalPages + 1).fill(null);

  if (withStarts.length >= 2) {
    for (let i = 0; i < withStarts.length; i++) {
      const j = withStarts[i];
      const start = j.startPageNumber;
      const end = i + 1 < withStarts.length
        ? withStarts[i + 1].startPageNumber - 1
        : totalPages;
      for (let p = start; p <= end; p++) {
        byPage[p] = {
          juzNumber: j.juzNumber,
          startPageNumber: start,
          endPageNumber: end,
          startVerse: j.startVerse,
          endVerse: j.endVerse,
        };
      }
    }
    return byPage;
  }

  const size = Math.ceil(totalPages / 30);
  for (let juz = 1; juz <= 30; juz++) {
    const start = (juz - 1) * size + 1;
    const end = Math.min(totalPages, juz * size);
    for (let p = start; p <= end; p++) {
      byPage[p] = {
        juzNumber: juz,
        startPageNumber: start,
        endPageNumber: end,
        startVerse: null,
        endVerse: null,
        estimated: true,
      };
    }
  }
  return byPage;
}

/** Keyword map: pageNumber → [{id, label, category}] from topic index rows. */
export function buildKeywordIndex(topics = []) {
  const map = {};
  for (const t of topics) {
    const p = t.pageNumber;
    if (!p) continue;
    if (!map[p]) map[p] = [];
    map[p].push({
      id: t.id,
      label: t.topicNameUrdu || t.topicNameEnglish,
      english: t.topicNameEnglish,
      category: t.category,
      pageNumber: p,
    });
  }
  return map;
}

export function mapPage(pageNumber, { surahIndex, juzIndex, keywordIndex } = {}) {
  const p = Math.max(1, Math.min(QURAN.TOTAL_PAGES, pageNumber | 0));
  return {
    pageNumber: p,
    surah: surahIndex?.[p] || null,
    juz: juzIndex?.[p] || null,
    keywords: keywordIndex?.[p] || [],
    progressPercent: Math.round((p / QURAN.TOTAL_PAGES) * 100),
  };
}
