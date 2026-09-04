import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiArrowRight } from 'react-icons/fi';
import { quranService } from '../services/api';
import { useDebounce } from '../utils';
import { SearchBar, EmptyState } from '../components/ui';

const SUGGESTIONS = ['توحید', 'نماز', 'روزہ', 'صبر', 'جنت', 'آخرت'];

const TopicSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounced = useDebounce(query, 400);

  const runSearch = async (q) => {
    const term = (q || '').trim();
    if (term.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const response = await quranService.searchTopics(term);
      setResults(response.data?.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounced.trim().length >= 2) runSearch(debounced);
  }, [debounced]);

  return (
    <div className="home-container">
      <div className="page-header">
        <div>
          <h1><FiSearch /> Topic Search</h1>
          <p className="subtitle">Urdu index → jump straight to the Mushaf page</p>
        </div>
      </div>

      <SearchBar
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => { setQuery(''); setResults([]); setSearched(false); }}
        placeholder="Search topics (توحید, نماز, روزہ…)"
      />

      <div className="home-related-chips" style={{ marginBottom: '1.25rem' }}>
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="home-chip" onClick={() => setQuery(s)}>{s}</button>
        ))}
      </div>

      {loading && <div className="loader-container"><div className="loader" /></div>}

      {!loading && searched && results.length === 0 && (
        <EmptyState icon={<FiSearch className="empty-icon-svg" />} title="No topics found" description="Try another Urdu keyword" />
      )}

      {results.length > 0 && (
        <div className="topic-grid">
          {results.map((topic) => (
            <Link key={topic.id} to={`/page/${topic.pageNumber}`} className="topic-card">
              <div>
                <h3>{topic.topicNameUrdu}</h3>
                {topic.topicNameEnglish && <p>{topic.topicNameEnglish}</p>}
                <div className="topic-meta">
                  {topic.category && <span className="meta-badge revelation">{topic.category}</span>}
                  <span className="meta-badge meta-badge--page">Page {topic.pageNumber}</span>
                </div>
              </div>
              <FiArrowRight />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicSearch;
