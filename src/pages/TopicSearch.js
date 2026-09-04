import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiArrowRight, FiBookOpen } from 'react-icons/fi';
import { quranService } from '../services/api';
import { useDebounce } from '../utils';
import { SearchBar, EmptyState } from '../components/ui';

const SUGGESTIONS = [
  { label: 'توحید', hint: 'Oneness' },
  { label: 'نماز', hint: 'Prayer' },
  { label: 'روزہ', hint: 'Fasting' },
  { label: 'صبر', hint: 'Patience' },
  { label: 'جنت', hint: 'Paradise' },
  { label: 'آخرت', hint: 'Hereafter' },
];

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
    <div className="home-container topic-page">
      <div className="page-header page-header--stack">
        <div>
          <p className="home-kicker">Topics</p>
          <h1>Topic Search</h1>
          <p className="subtitle">Search the Urdu index and jump straight to the Mushaf page</p>
        </div>
      </div>

      <SearchBar
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => { setQuery(''); setResults([]); setSearched(false); }}
        placeholder="Search topics (توحید, نماز, روزہ…)"
      />

      <section className="topic-suggest">
        <h2 className="topic-section-title">Popular topics</h2>
        <div className="home-related-chips topic-suggest-chips">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              className="home-chip home-chip--topic"
              onClick={() => setQuery(s.label)}
            >
              <span className="home-chip-urdu">{s.label}</span>
              <span className="home-chip-hint">{s.hint}</span>
            </button>
          ))}
        </div>
      </section>

      {loading && <div className="loader-container"><div className="loader" /></div>}

      {!loading && !searched && (
        <div className="topic-idle card-soft">
          <FiBookOpen className="topic-idle-icon" />
          <h3>Find a theme, open the page</h3>
          <p>Pick a popular topic above or type at least two characters in Urdu or English.</p>
        </div>
      )}

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
