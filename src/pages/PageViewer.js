import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { quranService, bookmarkService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TOTAL_PAGES = 604;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const PageViewer = () => {
    const { pageNumber } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const imgBoxRef = useRef(null);

    const current = clamp(parseInt(pageNumber) || 1, 1, TOTAL_PAGES);

    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [jumpVal, setJumpVal] = useState(String(current));
    const [toast, setToast] = useState('');

    useEffect(() => setJumpVal(String(current)), [current]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true); setImgLoaded(false); setError(null); setPageData(null);
        quranService.getPageByNumber(current)
            .then(r => { if (!cancelled) setPageData(r.data); })
            .catch(() => { if (!cancelled) setError('Failed to load page.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [current, go]);

    useEffect(() => {
        if (!user) return;
        bookmarkService.getBookmarkedPageNumbers()
            .then(r => {
                const nums = r.data?.pageNumbers || (Array.isArray(r.data) ? r.data : []);
                setIsBookmarked(nums.includes(current));
            }).catch(() => { });
    }, [current, user]);

    useEffect(() => {
        const h = e => {
            if (e.target.tagName === 'INPUT') return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(current + 1);
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(current - 1);
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [current]);

    const go = p => {
        const n = clamp(parseInt(p) || 1, 1, TOTAL_PAGES);
        setZoom(100); setRotation(0);
        navigate(`/page/${n}`);
    };

    const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2200); };

    const handleBookmark = async () => {
        if (!user) { showToast('Please login to bookmark'); return; }
        try {
            if (isBookmarked) {
                const res = await bookmarkService.getBookmarks(1, 200);
                const bms = res.data?.data || res.data || [];
                const bm = (Array.isArray(bms) ? bms : []).find(b => b.pageNumber === current);
                if (bm) await bookmarkService.deleteBookmark(bm.id);
                setIsBookmarked(false);
                showToast('Bookmark removed');
            } else {
                await bookmarkService.createBookmark(current, '');
                setIsBookmarked(true);
                showToast('✅ Page bookmarked!');
            }
        } catch (err) {
            showToast(err.response?.status === 409 ? 'Already bookmarked' : 'Bookmark failed');
        }
    };

    const progress = Math.round((current / TOTAL_PAGES) * 100);

    return (
        <div className="pv-shell">

            {/* ══ TOP BAR ══ */}
            <div className="pv-bar">

                {/* Left: back + page info */}
                <div className="pv-bar-left">
                    <Link to="/" className="pv-back">← Back</Link>
                    <div className="pv-page-info">
                        <span className="pv-page-num">Page {current}</span>
                        {pageData?.juzNumber && <span className="pv-chip">Juz {pageData.juzNumber}</span>}
                        {pageData?.surahNumberStart && <span className="pv-chip accent">Surah {pageData.surahNumberStart} starts</span>}
                    </div>
                </div>

                {/* Center: navigation */}
                <div className="pv-bar-nav">
                    <button className="pv-nav-btn" onClick={() => go(current - 1)} disabled={current <= 1}>‹</button>
                    <div className="pv-jump">
                        <input
                            type="number" className="pv-jump-in"
                            value={jumpVal} min={1} max={TOTAL_PAGES}
                            onChange={e => setJumpVal(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && go(jumpVal)}
                            aria-label="Page number"
                        />
                        <span className="pv-jump-of">/ {TOTAL_PAGES}</span>
                        <button className="pv-go" onClick={() => go(jumpVal)}>Go</button>
                    </div>
                    <button className="pv-nav-btn" onClick={() => go(current + 1)} disabled={current >= TOTAL_PAGES}>›</button>
                </div>

                {/* Right: tools */}
                <div className="pv-bar-right">
                    <div className="pv-zoom-row">
                        <button className="pv-tool" onClick={() => setZoom(z => clamp(z - 10, 60, 200))} disabled={zoom <= 60} title="Zoom out">A−</button>
                        <span className="pv-zoom-val">{zoom}%</span>
                        <button className="pv-tool" onClick={() => setZoom(z => clamp(z + 10, 60, 200))} disabled={zoom >= 200} title="Zoom in">A+</button>
                        <button className="pv-tool" onClick={() => { setZoom(100); setRotation(0); }} title="Reset">↺</button>
                        <button className="pv-tool" onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate">⟳</button>
                    </div>
                    <button
                        className={`pv-bookmark-btn${isBookmarked ? ' saved' : ''}`}
                        onClick={handleBookmark}
                    >
                        {isBookmarked ? '🔖 Saved' : '🏷️ Bookmark'}
                    </button>
                </div>
            </div>

            {/* ══ PROGRESS ══ */}
            <div className="pv-progress-track">
                <div className="pv-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="pv-progress-label">{progress}% · Page {current} of {TOTAL_PAGES}</div>

            {/* ══ READER CARD ══ */}
            <div className="pv-card">

                {/* Image viewport */}
                <div
                    className="pv-viewport"
                    ref={imgBoxRef}
                    style={{ overflow: zoom > 100 || rotation % 180 !== 0 ? 'auto' : 'hidden' }}
                >
                    {loading && (
                        <div className="pv-state">
                            <div className="pv-spinner" />
                            <span>Loading page {current}…</span>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="pv-state">
                            <span className="pv-state-icon">⚠️</span>
                            <p>{error}</p>
                            <button className="pv-nav-btn" style={{ padding: '.4rem 1rem' }} onClick={() => navigate(0)}>Retry</button>
                        </div>
                    )}

                    {!loading && !error && pageData?.imageUrl && (
                        <>
                            {!imgLoaded && <div className="pv-shimmer" />}
                            <img
                                src={pageData.imageUrl}
                                alt={`Quran page ${current}`}
                                className={`pv-img${imgLoaded ? ' loaded' : ''}`}
                                style={{
                                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                                    transformOrigin: 'center center',
                                    transition: 'transform .25s ease',
                                }}
                                onLoad={() => setImgLoaded(true)}
                                onError={() => { setImgLoaded(true); setError('Image failed to load.'); }}
                                draggable={false}
                            />
                        </>
                    )}

                    {!loading && !error && !pageData?.imageUrl && (
                        <div className="pv-state">
                            <span className="pv-state-icon">📄</span>
                            <p>No image for page {current}.</p>
                        </div>
                    )}
                </div>

                {/* Bottom nav strip */}
                <div className="pv-bottom-nav">
                    <button className="pv-nav-btn wide" onClick={() => go(current - 1)} disabled={current <= 1}>‹ Previous</button>
                    <span className="pv-bottom-label">Page {current} of {TOTAL_PAGES}</span>
                    <button className="pv-nav-btn wide" onClick={() => go(current + 1)} disabled={current >= TOTAL_PAGES}>Next ›</button>
                </div>

            </div>

            <p className="pv-hint">💡 Arrow keys navigate · A− / A+ to zoom</p>

            {toast && <div className="pv-toast">{toast}</div>}
        </div>
    );
};

export default PageViewer;