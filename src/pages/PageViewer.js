import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { quranService, bookmarkService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TOTAL_PAGES = 1027;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const PageViewer = () => {
    const { pageNumber } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

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
    const [showFab, setShowFab] = useState(true);
    const fabTimer = useRef(null);

    /* ── auto-hide FAB ── */
    const resetFabTimer = () => {
        setShowFab(true);
        clearTimeout(fabTimer.current);
        fabTimer.current = setTimeout(() => setShowFab(false), 4000);
    };

    const go = useCallback(p => {
        const n = clamp(parseInt(p) || 1, 1, TOTAL_PAGES);
        setZoom(100); setRotation(0);
        navigate(`/page/${n}`);
    }, [navigate]);

    useEffect(() => setJumpVal(String(current)), [current]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true); setImgLoaded(false); setError(null); setPageData(null);
        quranService.getPageByNumber(current)
            .then(r => { if (!cancelled) setPageData(r.data); })
            .catch(() => { if (!cancelled) setError('Failed to load page.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [current]);

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
    }, [current, go]);

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
        <div className="pv2-shell" onClick={resetFabTimer}>

            {/* ── Top Bar ── */}
            <div className="pv2-topbar">
                <div className="pv2-topbar-nav">
                    <Link to="/" className="pv2-back-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        Back
                    </Link>

                    <button className="pv2-nav-btn" onClick={() => go(current - 1)} disabled={current <= 1}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>

                    <div className="pv2-page-jump">
                        <input
                            type="number" className="pv2-jump-input"
                            value={jumpVal} min={1} max={TOTAL_PAGES}
                            onChange={e => setJumpVal(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && go(jumpVal)}
                            onFocus={e => e.target.select()}
                        />
                        <span className="pv2-jump-sep">/</span>
                        <span className="pv2-jump-total">{TOTAL_PAGES}</span>
                        <button className="pv2-jump-go" onClick={() => go(jumpVal)}>Go</button>
                    </div>

                    <button className="pv2-nav-btn" onClick={() => go(current + 1)} disabled={current >= TOTAL_PAGES}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                </div>

                {/* Center: page meta */}
                <div className="pv2-meta-badge">
                    {pageData?.juzNumber && <span className="pv2-chip">Juz {pageData.juzNumber}</span>}
                    <span className="pv2-chip accent">Page {current}</span>
                    {pageData?.surahNumberStart && <span className="pv2-chip">Surah {pageData.surahNumberStart}</span>}
                </div>

                {/* Right: bookmark */}
                <div className="pv2-topbar-actions">
                    <button
                        className={`pv2-action-btn${isBookmarked ? ' bookmarked' : ''}`}
                        onClick={handleBookmark}
                    >
                        {isBookmarked ? '🔖' : '🏷️'}
                        <span className="pv2-action-label">{isBookmarked ? 'Saved' : 'Save'}</span>
                    </button>
                </div>
            </div>

            {/* ── Progress ── */}
            <div className="pv2-progress">
                <div className="pv2-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="pv2-progress-label">{progress}% · Page {current} of {TOTAL_PAGES}</div>

            {/* ── Stage Wrapper ── */}
            <div className="pv2-stage-wrap">

                {/* Scrollable stage */}
                <div className="pv2-stage">
                    {loading && (
                        <div className="pv2-state">
                            <div className="pv2-spinner" />
                            <span>Loading page {current}…</span>
                        </div>
                    )}
                    {error && !loading && (
                        <div className="pv2-state">
                            <span className="pv2-state-icon">⚠️</span>
                            <p>{error}</p>
                            <button className="pv2-retry-btn" onClick={() => navigate(0)}>Retry</button>
                        </div>
                    )}
                    {!loading && !error && pageData?.imageUrl && (
                        <>
                            {!imgLoaded && <div className="pv2-shimmer" />}
                            <img
                                src={pageData.imageUrl}
                                alt={`Quran page ${current}`}
                                className={`pv2-img${imgLoaded ? ' loaded' : ''}`}
                                style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
                                onLoad={() => setImgLoaded(true)}
                                onError={() => { setImgLoaded(true); setError('Image failed to load.'); }}
                                draggable={false}
                            />
                        </>
                    )}
                    {!loading && !error && !pageData?.imageUrl && (
                        <div className="pv2-state">
                            <span className="pv2-state-icon">📄</span>
                            <p>No image for page {current}.</p>
                        </div>
                    )}
                </div>

                {/* Zoom FAB — sibling of stage, never scrolls */}
                <div className={`pv2-zoom-fab${showFab ? ' visible' : ''}`}>
                    <button className="pv2-zoom-btn" onClick={() => setZoom(z => clamp(z - 10, 60, 200))} disabled={zoom <= 60}>−</button>
                    <span className="pv2-zoom-val">{zoom}%</span>
                    <button className="pv2-zoom-btn" onClick={() => setZoom(z => clamp(z + 10, 60, 200))} disabled={zoom >= 200}>+</button>
                    <div className="pv2-zoom-divider" />
                    <button className="pv2-zoom-btn" onClick={() => { setZoom(100); setRotation(0); }}>↺</button>
                    <button className="pv2-zoom-btn" onClick={() => setRotation(r => (r + 90) % 360)}>⟳</button>
                </div>

            </div>

            {/* ── Bottom Nav ── */}
            <div className="pv2-bottom-nav">
                <button className="pv2-bottom-btn" onClick={() => go(current - 1)} disabled={current <= 1}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    Prev
                </button>
                <span className="pv2-bottom-info">Page {current}</span>
                <button className="pv2-bottom-btn" onClick={() => go(current + 1)} disabled={current >= TOTAL_PAGES}>
                    Next
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
            </div>

            {toast && <div className="pv2-toast">{toast}</div>}
        </div>
    );
};

export default PageViewer;