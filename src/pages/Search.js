import React, { useState } from 'react';
import { quranService } from '../services/api';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await quranService.searchVerses(query);
      setResults(response.data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <h2>🔍 Search Quran</h2>
      <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search in Arabic, Urdu, or Tafseer..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
          Search
        </button>
      </form>

      {loading && <div className="loader-container"><div className="loader"></div></div>}

      {results.length > 0 && (
        <div>
          <p style={{ marginBottom: '1rem' }}>Found {results.length} results</p>
          {results.map(verse => (
            <div key={verse.id} className="card" style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                Surah {verse.surah?.nameEnglish} - Verse {verse.verseNumber}
              </p>
              <p style={{ fontSize: '1.5rem', textAlign: 'right', margin: '0.5rem 0' }}>{verse.textArabic}</p>
              <p style={{ fontSize: '1rem' }}>{verse.textUrdu}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
