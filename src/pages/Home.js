import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quranService } from '../services/api';
import { SearchBar, EmptyState, SkeletonLoader } from '../components/ui';
import { useDebounce } from '../utils';
import QuranReader from '../components/QuranReader';
import { FiBook, FiSearch, FiFileText } from 'react-icons/fi';

const Home = () => {
  const [activeTab, setActiveTab] = useState('surahs');
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchSurahs();
  }, []);

  const fetchSurahs = async () => {
    try {
      const response = await quranService.getSurahs();
      setSurahs(response.data || response);
    } catch (error) {
      console.error('Error fetching surahs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSurahs = surahs.filter(
    (surah) =>
      surah.nameEnglish?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      surah.nameUrdu?.includes(debouncedSearchQuery) ||
      surah.nameArabic?.includes(debouncedSearchQuery)
  );

  return (
    <div className="home-container">

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1>Mushaf Platform</h1>
          <p className="subtitle">Digital Quran with Urdu Translation</p>
        </div>
        <div className="stats-badge">
          <span className="stat-number">{surahs.length || 114}</span>
          <span className="stat-label">Surahs</span>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="home-tabs">
        <button
          className={`home-tab-btn${activeTab === 'surahs' ? ' active' : ''}`}
          onClick={() => setActiveTab('surahs')}
        >
          <span className="tab-icon"><FiBook size={18} /></span>
          <span>Surahs</span>
        </button>
        <button
          className={`home-tab-btn${activeTab === 'reader' ? ' active' : ''}`}
          onClick={() => setActiveTab('reader')}
        >
          <span className="tab-icon"><FiSearch size={18} /></span>
          <span>Quran Reader</span>
        </button>
      </div>

      {/* ── Surahs Tab ── */}
      {activeTab === 'surahs' && (
        <div className="tab-content">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search by name (Arabic, English, Urdu)..."
          />

          {loading ? (
            <SkeletonLoader count={6} type="surah" />
          ) : filteredSurahs.length === 0 ? (
            <EmptyState
              icon={<FiSearch className="empty-icon-svg" />}
              title="No Surahs Found"
              description="Try searching with a different term"
            />
          ) : (
            <div className="surah-grid">
              {filteredSurahs.map((surah) => (
                <Link
                  key={surah.id}
                  to={`/page/${surah.startPageNumber || 1}`}
                  className="surah-card"
                >
                  <div className="surah-number">{surah.surahNumber}</div>
                  <div className="surah-content">
                    <div className="surah-name-row">
                      <h3 className="surah-name">{surah.nameEnglish}</h3>
                      <p className="surah-arabic">{surah.nameArabic}</p>
                    </div>
                    <div className="surah-meta">
                      <span className="meta-badge">
                        <FiFileText size={14} style={{ marginRight: '4px' }} /> {surah.versesCount} verses
                      </span>
                      <span className="meta-badge revelation">
                        {surah.revelationType}
                      </span>
                      {surah.startPageNumber && (
                        <span className="meta-badge meta-badge--page">
                          Page {surah.startPageNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="surah-arrow">→</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Quran Reader Tab ── */}
      {activeTab === 'reader' && (
        <div className="tab-content">
          <QuranReader surahs={surahs} />
        </div>
      )}
    </div>
  );
};

export default Home;