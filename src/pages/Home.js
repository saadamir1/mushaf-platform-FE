import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { quranService } from '../services/api';
import { SearchBar, EmptyState, SkeletonLoader, Button } from '../components/ui';

const Home = () => {
  const { user } = useAuth();
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSurahs();
  }, []);

  const fetchSurahs = async () => {
    try {
      const response = await quranService.getSurahs();
      setSurahs(response.data);
    } catch (error) {
      console.error('Error fetching surahs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSurahs = surahs.filter(surah =>
    surah.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.nameUrdu.includes(searchQuery) ||
    surah.nameArabic.includes(searchQuery)
  );

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-icon">🕌</div>
          <h2>Mushaf Platform</h2>
          <p style={{ textAlign: 'center', color: 'var(--gray-color)', marginBottom: '2rem' }}>
            Digital Quran with Urdu Translation
          </p>
          <Button as={Link} to="/login" variant="primary" size="lg" fullWidth>
            Login to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="page-header">
        <div>
          <h1>📚 Quran Surahs</h1>
          <p className="subtitle">Select a Surah to start your spiritual journey</p>
        </div>
        <div className="stats-badge">
          <span className="stat-number">{surahs.length}</span>
          <span className="stat-label">Surahs</span>
        </div>
      </div>

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
          icon="🔍"
          title="No Surahs Found"
          description="Try searching with a different term"
        />
      ) : (
        <div className="surah-grid">
          {filteredSurahs.map(surah => (
            <Link key={surah.id} to={`/surah/${surah.surahNumber}`} className="surah-card">
              <div className="surah-number">{surah.surahNumber}</div>
              <div className="surah-content">
                <h3 className="surah-name">{surah.nameEnglish}</h3>
                <p className="surah-arabic">{surah.nameArabic}</p>
                <div className="surah-meta">
                  <span className="meta-badge">📜 {surah.versesCount} verses</span>
                  <span className="meta-badge revelation">{surah.revelationType}</span>
                </div>
              </div>
              <div className="surah-arrow">→</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
