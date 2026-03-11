import React, { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { quranService } from '../services/api';
import { useDebounce } from '../utils';
import { SearchBar, EmptyState, SkeletonLoader } from '../components/ui';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      handleSearch();
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await quranService.searchVerses(debouncedQuery);
      setResults(response.data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="page-header">
        <div>
          <h1><FiSearch size={28} /> Search Quran</h1>
          <p className="subtitle">Search in Arabic, Urdu, or Tafseer</p>
        </div>
      </div>

      <SearchBar
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery('')}
        placeholder="Type to search verses..."
      />

      {loading && <SkeletonLoader count={3} type="default" />}

      {!loading && query && results.length === 0 && (
        <EmptyState
          icon={<FiSearch className="empty-icon-svg" />}
          title="No Results Found"
          description="Try different keywords in Arabic or Urdu"
        />
      )}

      {!loading && results.length > 0 && (
        <div>
          <p style={{ marginBottom: '1rem', color: 'var(--gray-color)' }}>
            Found {results.length} result{results.length > 1 ? 's' : ''}
          </p>
          {results.map(verse => (
            <div key={verse.id} className="card" style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-color)', marginBottom: '0.5rem' }}>
                Surah {verse.surah?.nameEnglish} - Verse {verse.verseNumber}
              </p>
              <p style={{ fontSize: '1.5rem', textAlign: 'right', margin: '0.5rem 0', fontFamily: 'Amiri, serif' }}>
                {verse.textArabic}
              </p>
              <p style={{ fontSize: '1rem', color: 'var(--text-color)' }}>{verse.textUrdu}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
