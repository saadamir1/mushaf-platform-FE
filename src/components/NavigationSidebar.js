import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quranService } from '../services/api';

const NavigationSidebar = () => {
    const [surahs, setSurahs] = useState([]);
    const [juz, setJuz] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNavigationData();
    }, []);

    const fetchNavigationData = async () => {
        try {
            const [surahsRes, juzRes] = await Promise.all([
                quranService.getSurahs(),
                quranService.getJuz()
            ]);
            setSurahs(surahsRes.data || []);
            setJuz(juzRes.data || []);
        } catch (error) {
            console.error('Error fetching navigation data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card" style={{ padding: '1rem' }}>
                <div className="loader-container"><div className="loader"></div></div>
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: '1rem', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Navigation</h3>

            <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: '#666' }}>Surahs (114)</h4>
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                    {surahs.map(surah => (
                        <Link
                            key={surah.id}
                            to={`/page/${surah.startPageNumber || 1}`}
                            className="btn btn-outline-primary"
                            style={{
                                display: 'block',
                                textAlign: 'left',
                                marginBottom: '0.25rem',
                                fontSize: '0.9rem',
                                padding: '0.5rem',
                                border: '1px solid #eee'
                            }}
                            title={`${surah.nameArabic} - ${surah.nameEnglish} (${surah.versesCount} verses)`}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{surah.nameArabic}</span>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                    {surah.startPageNumber ? `Page ${surah.startPageNumber}` : 'Page 1'}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.25rem' }}>
                                {surah.nameEnglish} • {surah.revelationType}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: '#666' }}>Juz (30)</h4>
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {juz.map(j => (
                        <Link
                            key={j.id}
                            to={`/page/${j.startPageNumber || 1}`}
                            className="btn btn-outline-primary"
                            style={{
                                display: 'block',
                                textAlign: 'left',
                                marginBottom: '0.25rem',
                                fontSize: '0.9rem',
                                padding: '0.5rem',
                                border: '1px solid #eee'
                            }}
                            title={`Juz ${j.juzNumber} - ${j.startVerse} to ${j.endVerse}`}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Juz {j.juzNumber}</span>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                    {j.startPageNumber ? `Page ${j.startPageNumber}` : 'Page 1'}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.25rem' }}>
                                {j.startVerse} to {j.endVerse}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NavigationSidebar;