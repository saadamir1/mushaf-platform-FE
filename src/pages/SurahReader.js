import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { quranService, bookmarkService } from '../services/api';

const SurahReader = () => {
  const { number } = useParams();
  const [surah, setSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurahData();
  }, [number]);

  const fetchSurahData = async () => {
    try {
      const [surahRes, versesRes] = await Promise.all([
        quranService.getSurah(number),
        quranService.getSurahVerses(number)
      ]);
      setSurah(surahRes.data);
      setVerses(versesRes.data.verses || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (verseId) => {
    try {
      await bookmarkService.createBookmark(verseId);
      alert('Bookmark added!');
    } catch (error) {
      alert('Failed to add bookmark');
    }
  };

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className="home-container">
      <Link to="/" className="btn btn-outline-primary" style={{ marginBottom: '1rem' }}>← Back to Surahs</Link>
      
      <div className="card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2>{surah?.nameArabic}</h2>
        <h3>{surah?.nameEnglish}</h3>
        <p>{surah?.versesCount} verses • {surah?.revelationType}</p>
      </div>

      {verses.map(verse => (
        <div key={verse.id} className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#666' }}>{verse.verseNumber}</span>
            <button onClick={() => handleBookmark(verse.id)} className="btn btn-outline-primary" style={{ padding: '0.25rem 0.75rem' }}>
              🔖
            </button>
          </div>
          <p style={{ fontSize: '1.8rem', textAlign: 'right', margin: '1rem 0', lineHeight: '2.5' }}>{verse.textArabic}</p>
          <p style={{ fontSize: '1.1rem', color: '#333' }}>{verse.textUrdu}</p>
          {verse.transliteration && <p style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>{verse.transliteration}</p>}
        </div>
      ))}
    </div>
  );
};

export default SurahReader;
