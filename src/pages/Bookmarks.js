import React, { useState, useEffect } from 'react';
import { bookmarkService } from '../services/api';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookmarksRes, progressRes] = await Promise.all([
        bookmarkService.getBookmarks(),
        bookmarkService.getProgress().catch(() => ({ data: null }))
      ]);
      setBookmarks(bookmarksRes.data.data || []);
      setProgress(progressRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await bookmarkService.deleteBookmark(id);
      setBookmarks(bookmarks.filter(b => b.id !== id));
    } catch (error) {
      alert('Failed to delete bookmark');
    }
  };

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className="home-container">
      <h2>🔖 My Bookmarks</h2>

      {progress && (
        <div className="card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h3>Reading Progress</h3>
          <div style={{ fontSize: '2rem', margin: '1rem 0' }}>{progress.completionPercentage}%</div>
          <p>Last read: Verse {progress.lastVerseId}</p>
        </div>
      )}

      {bookmarks.length === 0 ? (
        <p>No bookmarks yet. Start reading and bookmark verses!</p>
      ) : (
        bookmarks.map(bookmark => (
          <div key={bookmark.id} className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>Verse {bookmark.verseId}</p>
                {bookmark.note && <p style={{ marginTop: '0.5rem' }}>{bookmark.note}</p>}
              </div>
              <button onClick={() => handleDelete(bookmark.id)} className="btn btn-outline-primary" style={{ padding: '0.25rem 0.75rem' }}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Bookmarks;
