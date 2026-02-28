import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { quranService, bookmarkService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PageViewer = () => {
    const { pageNumber } = useParams();
    const { user } = useAuth();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookmarkedPageNumbers, setBookmarkedPageNumbers] = useState([]);
    const [zoomLevel, setZoomLevel] = useState(1);

    useEffect(() => {
        fetchPageData();
    }, [pageNumber]);

    useEffect(() => {
        if (user) {
            fetchBookmarkedPageNumbers();
        }
    }, [user]);

    const fetchPageData = async () => {
        try {
            const response = await quranService.getPageByNumber(pageNumber);
            setPage(response.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookmarkedPageNumbers = async () => {
        try {
            const response = await bookmarkService.getBookmarkedPageNumbers();
            setBookmarkedPageNumbers(response.data.pageNumbers || []);
        } catch (error) {
            console.error('Error fetching bookmarked page numbers:', error);
        }
    };

    const handleBookmark = async (pageNum) => {
        try {
            await bookmarkService.createBookmark(pageNum);
            alert('Bookmark added!');
            setBookmarkedPageNumbers([...bookmarkedPageNumbers, pageNum]);
        } catch (error) {
            if (error.response?.status === 409) {
                alert('This page is already bookmarked!');
            } else if (error.response?.status === 401) {
                alert('Please login to add bookmarks');
            } else {
                alert('Failed to add bookmark');
            }
        }
    };

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
    const handleResetZoom = () => setZoomLevel(1);

    const handlePrevPage = () => {
        if (pageNumber > 1) {
            window.location.href = `/page/${parseInt(pageNumber) - 1}`;
        }
    };

    const handleNextPage = () => {
        if (pageNumber < 1027) {
            window.location.href = `/page/${parseInt(pageNumber) + 1}`;
        }
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    if (!page) {
        return (
            <div className="home-container">
                <Link to="/" className="btn btn-outline-primary" style={{ marginBottom: '1rem' }}>← Back to Navigation</Link>
                <div className="card">
                    <h2>Page Not Found</h2>
                    <p>Page {pageNumber} does not exist.</p>
                </div>
            </div>
        );
    }

    const isBookmarked = bookmarkedPageNumbers.includes(parseInt(pageNumber));

    return (
        <div className="home-container">
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" className="btn btn-outline-primary">← Back to Navigation</Link>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handlePrevPage} className="btn btn-outline-primary" disabled={pageNumber <= 1}>
                        ← Previous
                    </button>
                    <input
                        type="number"
                        value={pageNumber}
                        onChange={(e) => window.location.href = `/page/${e.target.value}`}
                        style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        min="1"
                        max="1027"
                    />
                    <button onClick={handleNextPage} className="btn btn-outline-primary" disabled={pageNumber >= 1027}>
                        Next →
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleZoomOut} className="btn btn-outline-primary">-</button>
                    <button onClick={handleResetZoom} className="btn btn-outline-primary">100%</button>
                    <button onClick={handleZoomIn} className="btn btn-outline-primary">+</button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1rem', textAlign: 'center' }}>
                <h2>Quran Aziz - Page {page.pageNumber}</h2>
                {page.juzNumber && <p>Juz {page.juzNumber}</p>}
                {page.surahNumberStart && <p>Surah {page.surahNumberStart} starts here</p>}
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'auto',
                maxHeight: '80vh',
                border: '1px solid #ddd',
                borderRadius: '8px'
            }}>
                {page.imageUrl ? (
                    <img
                        src={page.imageUrl}
                        alt={`Quran Aziz Page ${page.pageNumber}`}
                        style={{
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '100%',
                            maxHeight: '80vh',
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.2s ease'
                        }}
                    />
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                        Image not available for this page
                    </div>
                )}
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button
                    onClick={() => handleBookmark(parseInt(pageNumber))}
                    className={isBookmarked ? "btn" : "btn btn-outline-primary"}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: isBookmarked ? 'var(--primary-color)' : 'transparent',
                        color: isBookmarked ? 'white' : 'var(--primary-color)',
                        border: isBookmarked ? 'none' : '1px solid var(--primary-color)'
                    }}
                >
                    {isBookmarked ? '🔖 Bookmarked' : '📑 Bookmark Page'}
                </button>
            </div>
        </div>
    );
};

export default PageViewer;