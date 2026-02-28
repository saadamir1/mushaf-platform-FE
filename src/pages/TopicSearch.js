import React, { useState } from 'react';
import { quranService } from '../services/api';

const TopicSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const response = await quranService.searchTopics(query);
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
            <h2>🔍 Topic Search</h2>
            <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
                <input
                    type="text"
                    placeholder="Search topics in Urdu (e.g., توحید, نماز, روزہ)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                />
                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                    Search Topics
                </button>
            </form>

            {loading && <div className="loader-container"><div className="loader"></div></div>}

            {results.length > 0 && (
                <div>
                    <p style={{ marginBottom: '1rem' }}>Found {results.length} topics</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {results.map(topic => (
                            <div key={topic.id} className="card" style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem' }}>{topic.topicNameUrdu}</h3>
                                        {topic.topicNameEnglish && (
                                            <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>{topic.topicNameEnglish}</p>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            fontSize: '0.8rem',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            backgroundColor: '#f0f0f0',
                                            color: '#666'
                                        }}>
                                            Page {topic.pageNumber}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                    {topic.category && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white'
                                        }}>
                                            {topic.category}
                                        </span>
                                    )}
                                    {topic.surahNumber && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            backgroundColor: '#e3f2fd',
                                            color: '#1976d2'
                                        }}>
                                            Surah {topic.surahNumber}
                                        </span>
                                    )}
                                    {topic.juzNumber && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            backgroundColor: '#fff3e0',
                                            color: '#f57c00'
                                        }}>
                                            Juz {topic.juzNumber}
                                        </span>
                                    )}
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <a
                                        href={`/page/${topic.pageNumber}`}
                                        className="btn btn-primary"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        View Page {topic.pageNumber}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {results.length === 0 && !loading && query && (
                <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                    <p>No topics found for "{query}"</p>
                    <p>Try searching for common topics like:</p>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
                        {['توحید', 'نماز', 'روزہ', 'زکوٰۃ', 'حج', 'قرآن', 'ایمان', 'جنت', 'جہنم'].map(topic => (
                            <button
                                key={topic}
                                onClick={() => setQuery(topic)}
                                className="btn btn-outline-primary"
                                style={{ fontSize: '0.9rem', padding: '0.25rem 0.75rem' }}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopicSearch;