import React, { useState, useEffect, useRef } from 'react';
import { quranService, bookmarkService } from '../services/api';

const TOTAL_PAGES = 1027;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const SurahDrawer = ({ surahs, currentPage, onSelect, onClose }) => (
  <div className="qr2-drawer-overlay" onClick={onClose}>
    <div className="qr2-drawer" onClick={e => e.stopPropagation()}>
      <div className="qr2-drawer-header">
        <span className="qr2-drawer-title">Surahs</span>
        <button className="qr2-drawer-close" onClick={onClose}>✕</button>
      </div>
      <div className="qr2-drawer-list">
        {surahs.map((s, i) => {
          const next = surahs[i + 1];
          const active = s.startPageNumber <= currentPage && (!next || next.startPageNumber > currentPage);
          return (
            <button key={s.id} className={`qr2-surah-item${active ? ' active' : ''}`}
              onClick={() => { onSelect(s.startPageNumber || 1); onClose(); }}>
              <span className="qr2-si-num">{s.surahNumber}</span>
              <span className="qr2-si-body">
                <span className="qr2-si-en">{s.nameEnglish}</span>
                <span className="qr2-si-ar">{s.nameArabic}</span>
              </span>
              <span className="qr2-si-pg">p.{s.startPageNumber}</span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

const BookmarkDrawer = ({ bookmarks, onGoTo, onDelete, onClose }) => (
  <div className="qr2-drawer-overlay" onClick={onClose}>
    <div className="qr2-drawer" onClick={e => e.stopPropagation()}>
      <div className="qr2-drawer-header">
        <span className="qr2-drawer-title">Bookmarks</span>
        <button className="qr2-drawer-close" onClick={onClose}>✕</button>
      </div>
      {bookmarks.length === 0 ? (
        <div className="qr2-drawer-empty">
          <div className="qr2-empty-icon">🏷️</div>
          <p>No bookmarks yet</p>
          <small>Tap the bookmark button to save your place</small>
        </div>
      ) : (
        <div className="qr2-drawer-list">
          {bookmarks.map(bm => (
            <div key={bm.id} className="qr2-bm-item">
              <div className="qr2-bm-info">
                <span className="qr2-bm-page">Page {bm.pageNumber}</span>
                {bm.note && <span className="qr2-bm-note">{bm.note}</span>}
              </div>
              <div className="qr2-bm-actions">
                <button className="qr2-bm-go" onClick={() => { onGoTo(bm.pageNumber); onClose(); }}>Go</button>
                <button className="qr2-bm-del" onClick={() => onDelete(bm.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const QuranReader = ({ surahs = [] }) => {
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [drawer, setDrawer] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [bkdPages, setBkdPages] = useState(new Set());
  const [jumpVal, setJumpVal] = useState('1');
  const [toast, setToast] = useState('');
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef(null);

  useEffect(() => setJumpVal(String(page)), [page]);

  const resetControlsTimer = () => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 4000);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setImgLoaded(false); setError(null); setPageData(null);
    quranService.getPageByNumber(page)
      .then(r => { if (!cancelled) setPageData(r.data); })
      .catch(() => { if (!cancelled) setError('Failed to load page.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  useEffect(() => {
    bookmarkService.getBookmarks(1, 200)
      .then(r => {
        const arr = Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [];
        setBookmarks(arr);
        setBkdPages(new Set(arr.map(b => b.pageNumber)));
      }).catch(() => { });
  }, []);

  useEffect(() => {
    const h = e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(page + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(page - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [page]);

  const go = p => setPage(clamp(parseInt(p) || 1, 1, TOTAL_PAGES));
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const toggleBookmark = async () => {
    try {
      if (bkdPages.has(page)) {
        const bm = bookmarks.find(b => b.pageNumber === page);
        if (!bm) return;
        await bookmarkService.deleteBookmark(bm.id);
        setBookmarks(prev => prev.filter(b => b.id !== bm.id));
        setBkdPages(prev => { const s = new Set(prev); s.delete(page); return s; });
        showToast('Bookmark removed');
      } else {
        const r = await bookmarkService.createBookmark(page, '');
        setBookmarks(prev => [...prev, r.data]);
        setBkdPages(prev => new Set([...prev, page]));
        showToast('Bookmarked!');
      }
    } catch { showToast('Action failed'); }
  };

  const deleteBm = async id => {
    try {
      const bm = bookmarks.find(b => b.id === id);
      await bookmarkService.deleteBookmark(id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
      if (bm) setBkdPages(prev => { const s = new Set(prev); s.delete(bm.pageNumber); return s; });
      showToast('Bookmark deleted');
    } catch { showToast('Failed to delete'); }
  };

  const isBookmarked = bkdPages.has(page);
  const progress = Math.round((page / TOTAL_PAGES) * 100);
  const activeSurah = surahs.find((s, i) => {
    const next = surahs[i + 1];
    return s.startPageNumber <= page && (!next || next.startPageNumber > page);
  });
  const imgTransform = `scale(${zoom / 100}) rotate(${rotation}deg)`;

  return (
    <div className="qr2-shell" onClick={resetControlsTimer}>

      <div className="qr2-topbar">
        <div className="qr2-topbar-nav">
          <button className="qr2-nav-btn" onClick={() => go(page - 1)} disabled={page <= 1}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="qr2-page-jump">
            <input type="number" className="qr2-jump-input" value={jumpVal} min={1} max={TOTAL_PAGES}
              onChange={e => setJumpVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && go(jumpVal)}
              onFocus={e => e.target.select()} />
            <span className="qr2-jump-sep">/</span>
            <span className="qr2-jump-total">{TOTAL_PAGES}</span>
            <button className="qr2-jump-go" onClick={() => go(jumpVal)}>Go</button>
          </div>
          <button className="qr2-nav-btn" onClick={() => go(page + 1)} disabled={page >= TOTAL_PAGES}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {activeSurah && (
          <div className="qr2-surah-badge">
            <span className="qr2-sb-num">{activeSurah.surahNumber}</span>
            <span className="qr2-sb-en">{activeSurah.nameEnglish}</span>
            <span className="qr2-sb-ar">{activeSurah.nameArabic}</span>
          </div>
        )}

        <div className="qr2-topbar-actions">
          <button className={`qr2-action-btn${isBookmarked ? ' bookmarked' : ''}`} onClick={toggleBookmark}>
            {isBookmarked ? '🔖' : '🏷️'}
            <span className="qr2-action-label">{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>
          <button className="qr2-action-btn" onClick={() => setDrawer('bookmarks')}>
            📚{bookmarks.length > 0 && <span className="qr2-bm-count">{bookmarks.length}</span>}
          </button>
          <button className="qr2-action-btn" onClick={() => setDrawer('surahs')}>☰</button>
        </div>
      </div>

      <div className="qr2-progress">
        <div className="qr2-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="qr2-progress-label">
        {progress}% · {activeSurah ? activeSurah.nameEnglish : ''}
      </div>

      {/* KEY: wrapper div that is position:relative + overflow:hidden.
          The scrollable .qr2-stage is inside it via position:absolute inset:0.
          The zoom FAB is also inside the wrapper but NOT inside the stage,
          so it is anchored to the wrapper and never scrolls. */}
      <div className="qr2-stage-wrap">

        <div className="qr2-stage">
          {loading && (
            <div className="qr2-state">
              <div className="qr2-spinner" /><span>Loading page {page}…</span>
            </div>
          )}
          {error && !loading && (
            <div className="qr2-state">
              <span className="qr2-state-icon">⚠️</span>
              <p>{error}</p>
              <button className="qr2-retry-btn" onClick={() => setPage(p => p)}>Retry</button>
            </div>
          )}
          {!loading && !error && pageData?.imageUrl && (
            <>
              {!imgLoaded && <div className="qr2-shimmer" />}
              <img src={pageData.imageUrl} alt={`Quran page ${page}`}
                className={`qr2-img${imgLoaded ? ' loaded' : ''}`}
                style={{ transform: imgTransform }}
                onLoad={() => setImgLoaded(true)}
                onError={() => { setImgLoaded(true); setError('Image failed to load.'); }}
                draggable={false} />
            </>
          )}
          {!loading && !error && !pageData?.imageUrl && (
            <div className="qr2-state">
              <span className="qr2-state-icon">📄</span>
              <p>No image for page {page}.</p>
            </div>
          )}
        </div>

        {/* FAB lives here — sibling of .qr2-stage, child of .qr2-stage-wrap */}
        <div className={`qr2-zoom-fab${showControls ? ' visible' : ''}`}>
          <button className="qr2-zoom-btn" onClick={() => setZoom(z => clamp(z - 10, 60, 200))} disabled={zoom <= 60}>−</button>
          <span className="qr2-zoom-val">{zoom}%</span>
          <button className="qr2-zoom-btn" onClick={() => setZoom(z => clamp(z + 10, 60, 200))} disabled={zoom >= 200}>+</button>
          <div className="qr2-zoom-divider" />
          <button className="qr2-zoom-btn" onClick={() => { setZoom(100); setRotation(0); }}>↺</button>
          <button className="qr2-zoom-btn" onClick={() => setRotation(r => (r + 90) % 360)}>⟳</button>
        </div>

      </div>

      <div className="qr2-bottom-nav">
        <button className="qr2-bottom-btn" onClick={() => go(page - 1)} disabled={page <= 1}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Prev
        </button>
        <span className="qr2-bottom-info">Page {page}</span>
        <button className="qr2-bottom-btn" onClick={() => go(page + 1)} disabled={page >= TOTAL_PAGES}>
          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {drawer === 'surahs' && <SurahDrawer surahs={surahs} currentPage={page} onSelect={go} onClose={() => setDrawer(null)} />}
      {drawer === 'bookmarks' && <BookmarkDrawer bookmarks={bookmarks} onGoTo={go} onDelete={deleteBm} onClose={() => setDrawer(null)} />}
      {toast && <div className="qr2-toast">{toast}</div>}
    </div>
  );
};

export default QuranReader;