import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quranService, bookmarkService } from '../services/api';
import { SearchBar, EmptyState, SkeletonLoader } from '../components/ui';
import {
  useDebounce, getLastPage, getReadingStreak, buildKhatmPlan, QURAN, pageProgress,
} from '../utils';
import { useAuth } from '../context/AuthContext';
import QuranReader from '../components/QuranReader';
import { FiBook, FiSearch, FiFileText, FiPlay, FiZap, FiCalendar, FiLayers } from 'react-icons/fi';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('surahs');
  const [surahs, setSurahs] = useState([]);
  const [juzList, setJuzList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [daily, setDaily] = useState(null);
  const [suggest, setSuggest] = useState(null);
  const [serverProgress, setServerProgress] = useState(null);
  const debounced = useDebounce(searchQuery, 300);
  const lastPage = getLastPage();
  const streak = getReadingStreak();
  const plan = buildKhatmPlan(lastPage, 30);

  useEffect(() => {
    (async () => {
      try {
        const [s, j, d, sug] = await Promise.all([
          quranService.getSurahs(),
          quranService.getJuz(),
          quranService.getDailyFocus().catch(() => null),
          quranService.getSmartSuggest(lastPage).catch(() => null),
        ]);
        setSurahs(s.data || s || []);
        setJuzList(j.data || j || []);
        setDaily(d?.data || d);
        setSuggest(sug?.data || sug);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [lastPage]);

  useEffect(() => {
    if (!user) return;
    bookmarkService.getProgress().then((r) => setServerProgress(r.data)).catch(() => {});
  }, [user]);

  const resumePage = serverProgress?.lastPageNumber || lastPage || 1;

  const filteredSurahs = surahs.filter((surah) => {
    const q = debounced.toLowerCase();
    return (
      surah.nameEnglish?.toLowerCase().includes(q) ||
      surah.nameUrdu?.includes(debounced) ||
      surah.nameArabic?.includes(debounced) ||
      String(surah.surahNumber).includes(q)
    );
  });

  return (
    <div className="home-container">
      <div className="page-header home-hero">
        <div>
          <h1>Mushaf Platform</h1>
          <p className="subtitle">Quran Aziz — clear page reading with Urdu topics</p>
        </div>
        <div className="home-hero-stats">
          <div className="stats-badge"><span className="stat-number">{QURAN.TOTAL_PAGES}</span><span className="stat-label">Pages</span></div>
          <div className="stats-badge"><span className="stat-number">{streak.count || 0}</span><span className="stat-label">Day streak</span></div>
        </div>
      </div>

      <div className="home-smart-grid">
        <button type="button" className="home-resume-card" onClick={() => navigate(`/page/${resumePage}`)}>
          <div className="home-resume-icon"><FiPlay /></div>
          <div>
            <strong>Continue reading</strong>
            <p>Page {resumePage} · {pageProgress(resumePage)}% complete</p>
          </div>
          <div className="home-resume-bar"><span style={{ width: `${pageProgress(resumePage)}%` }} /></div>
        </button>

        {daily && (
          <button type="button" className="home-daily-card" onClick={() => navigate(`/page/${daily.pageNumber}`)}>
            <FiZap />
            <div>
              <strong>Today’s reading</strong>
              <p>{daily.nameArabic} · {daily.nameEnglish}</p>
            </div>
          </button>
        )}

        <button type="button" className="home-plan-card" onClick={() => navigate('/insights')}>
          <FiCalendar />
          <div>
            <strong>30-day khatm</strong>
            <p>{plan.pagesPerDay} pages/day from p.{plan.fromPage}</p>
          </div>
        </button>
      </div>

      {suggest?.relatedTopics?.length > 0 && (
        <div className="home-related">
          <span className="home-related-label"><FiZap /> Related topics nearby</span>
          <div className="home-related-chips">
            {suggest.relatedTopics.map((t) => (
              <Link key={t.id} to={`/page/${t.pageNumber}`} className="home-chip">
                {t.topicNameUrdu || t.topicNameEnglish}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="home-tabs">
        <button type="button" className={`home-tab-btn${activeTab === 'surahs' ? ' active' : ''}`} onClick={() => setActiveTab('surahs')}>
          <FiBook size={18} /> Surahs
        </button>
        <button type="button" className={`home-tab-btn${activeTab === 'juz' ? ' active' : ''}`} onClick={() => setActiveTab('juz')}>
          <FiLayers size={18} /> Juz
        </button>
        <button type="button" className={`home-tab-btn${activeTab === 'reader' ? ' active' : ''}`} onClick={() => setActiveTab('reader')}>
          <FiSearch size={18} /> Reader
        </button>
      </div>

      {activeTab === 'surahs' && (
        <div className="tab-content">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search Surah (Arabic, English, Urdu, number)..."
          />
          {loading ? (
            <SkeletonLoader count={6} type="surah" />
          ) : filteredSurahs.length === 0 ? (
            <EmptyState icon={<FiSearch className="empty-icon-svg" />} title="No Surahs Found" description="Try another search" />
          ) : (
            <div className="surah-grid">
              {filteredSurahs.map((surah) => (
                <Link key={surah.id || surah.surahNumber} to={`/page/${surah.startPageNumber || 1}`} className="surah-card">
                  <div className="surah-number">{surah.surahNumber}</div>
                  <div className="surah-content">
                    <div className="surah-name-row">
                      <h3 className="surah-name">{surah.nameEnglish}</h3>
                      <p className="surah-arabic">{surah.nameArabic}</p>
                    </div>
                    <div className="surah-meta">
                      <span className="meta-badge"><FiFileText size={14} /> {surah.versesCount} verses</span>
                      <span className="meta-badge revelation">{surah.revelationType}</span>
                      {surah.startPageNumber && <span className="meta-badge meta-badge--page">Page {surah.startPageNumber}</span>}
                    </div>
                  </div>
                  <div className="surah-arrow">→</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'juz' && (
        <div className="tab-content juz-grid">
          {juzList.map((j) => (
            <Link key={j.id || j.juzNumber} to={`/page/${j.startPageNumber || 1}`} className="juz-card">
              <span className="juz-num">Juz {j.juzNumber}</span>
              <span className="juz-range">{j.startVerse} → {j.endVerse}</span>
              <span className="juz-page">Page {j.startPageNumber || '—'}</span>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'reader' && (
        <div className="tab-content">
          <QuranReader surahs={surahs} />
        </div>
      )}
    </div>
  );
};

export default Home;
