import React, { useState, useEffect } from 'react';
import { quranService, bookmarkService } from '../services/api';

const TOTAL_PAGES = 604;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// ── Sidebar panels ────────────────────────────────────────────
const SurahNav = ({ surahs, currentPage, onSelect }) => (
  <div className="qr-sidebar-inner">
    <div className="qr-sidebar-title">📋 Surahs</div>
    <div className="qr-surah-list">
      {surahs.map((s, i) => {
        const next = surahs[i + 1];
        const active = s.startPageNumber <= currentPage && (!next || next.startPageNumber > currentPage);
        return (
          <button key={s.id} className={`qr-surah-row${active ? ' active' : ''}`} onClick={() => onSelect(s.startPageNumber || 1)}>
            <span className="qr-s-num">{s.surahNumber}</span>
            <span className="qr-s-info">
              <span className="qr-s-en">{s.nameEnglish}</span>
              <span className="qr-s-ar">{s.nameArabic}</span>
            </span>
            <span className="qr-s-pg">p.{s.startPageNumber}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const BookmarkPanel = ({ bookmarks, onGoTo, onDelete }) => (
  <div className="qr-sidebar-inner">
    <div className="qr-sidebar-title">🔖 Bookmarks</div>
    {bookmarks.length === 0 ? (
      <div className="qr-panel-empty">
        <span>🏷️</span><p>No bookmarks yet</p>
        <small>Tap "Bookmark" to save your place</small>
      </div>
    ) : (
      <div className="qr-bm-list">
        {bookmarks.map(bm => (
          <div key={bm.id} className="qr-bm-row">
            <span className="qr-bm-pg">Page {bm.pageNumber}</span>
            {bm.note && <span className="qr-bm-note">{bm.note}</span>}
            <div className="qr-bm-btns">
              <button className="qr-bm-btn go" onClick={() => onGoTo(bm.pageNumber)}>Go →</button>
              <button className="qr-bm-btn del" onClick={() => onDelete(bm.id)}>×</button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ── Main ──────────────────────────────────────────────────────
const QuranReader = ({ surahs = [] }) => {
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [panel, setPanel] = useState('surahs');
  const [panelOpen, setPanelOpen] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const [bkdPages, setBkdPages] = useState(new Set());
  const [jumpVal, setJumpVal] = useState('1');
  const [toast, setToast] = useState('');

  useEffect(() => setJumpVal(String(page)), [page]);

  // Fetch page
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setImgLoaded(false); setError(null); setPageData(null);
    quranService.getPageByNumber(page)
      .then(r => { if (!cancelled) setPageData(r.data); })
      .catch(() => { if (!cancelled) setError('Failed to load page.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  // Fetch bookmarks
  useEffect(() => {
    bookmarkService.getBookmarks(1, 200)
      .then(r => {
        const arr = Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [];
        setBookmarks(arr);
        setBkdPages(new Set(arr.map(b => b.pageNumber)));
      }).catch(() => { });
  }, []);

  // Keyboard
  useEffect(() => {
    const h = e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setPage(p => clamp(p + 1, 1, TOTAL_PAGES));
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setPage(p => clamp(p - 1, 1, TOTAL_PAGES));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const go = p => { const n = clamp(parseInt(p) || 1, 1, TOTAL_PAGES); setPage(n); };

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2200); };

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
        showToast('✅ Page bookmarked!');
      }
    } catch { showToast('Bookmark action failed'); }
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

  // Image transform — use CSS transform, NOT the CSS zoom property
  const isRotated = rotation % 180 !== 0;
  const imgTransform = `scale(${zoom / 100}) rotate(${rotation}deg)`;

  const NavRow = ({ top }) => (
    <div className={`qr-nav-row${top ? ' top' : ''}`}>
      <button className="qr-nav-btn" onClick={() => go(page - 1)} disabled={page <= 1}>‹ Prev</button>
      {top ? (
        <div className="qr-pg-wrap">
          <span className="qr-pg-lbl">Page</span>
          <input
            type="number" className="qr-pg-in"
            value={jumpVal} min={1} max={TOTAL_PAGES}
            onChange={e => setJumpVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && go(jumpVal)}
          />
          <span className="qr-pg-lbl">of {TOTAL_PAGES}</span>
          <button className="qr-go-btn" onClick={() => go(jumpVal)}>Go</button>
        </div>
      ) : (
        <span className="qr-pg-lbl">Page {page} of {TOTAL_PAGES}</span>
      )}
      <button className="qr-nav-btn" onClick={() => go(page + 1)} disabled={page >= TOTAL_PAGES}>Next ›</button>
    </div>
  );

  return (
    <div className="qr-wrap">

      {/* Toolbar */}
      <div className="qr-bar">
        <div className="qr-bar-l">
          <button className={`qr-ham${panelOpen ? ' on' : ''}`} onClick={() => setPanelOpen(v => !v)} title="Toggle sidebar">☰</button>
          <div className="qr-pills">
            <button className={`qr-pill${panel === 'surahs' ? ' on' : ''}`}
              onClick={() => { setPanel('surahs'); setPanelOpen(true); }}>📋 Surahs</button>
            <button className={`qr-pill${panel === 'bookmarks' ? ' on' : ''}`}
              onClick={() => { setPanel('bookmarks'); setPanelOpen(true); }}>
              🔖 Bookmarks{bookmarks.length > 0 && <span className="qr-cnt">{bookmarks.length}</span>}
            </button>
          </div>
          {activeSurah && (
            <div className="qr-cur-surah">
              <span className="qr-cs-badge">{activeSurah.surahNumber}</span>
              <span className="qr-cs-en">{activeSurah.nameEnglish}</span>
              <span className="qr-cs-ar">{activeSurah.nameArabic}</span>
            </div>
          )}
        </div>
        <div className="qr-bar-r">
          <div className="qr-tools">
            <button className="qr-tbtn" onClick={() => setZoom(z => clamp(z - 10, 60, 200))} disabled={zoom <= 60} title="Zoom out">A−</button>
            <span className="qr-zlbl">{zoom}%</span>
            <button className="qr-tbtn" onClick={() => setZoom(z => clamp(z + 10, 60, 200))} disabled={zoom >= 200} title="Zoom in">A+</button>
            <button className="qr-tbtn" onClick={() => { setZoom(100); setRotation(0); }} title="Reset">↺</button>
            <button className="qr-tbtn" onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate 90°">⟳</button>
          </div>
          <button className={`qr-bm-btn-main${isBookmarked ? ' on' : ''}`} onClick={toggleBookmark}>
            {isBookmarked ? '🔖 Saved' : '🏷️ Bookmark'}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="qr-prog-bar">
        <div className="qr-prog-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="qr-prog-lbl">Page {page} / {TOTAL_PAGES} · {progress}% complete</div>

      {/* Body: sidebar + pane */}
      <div className={`qr-body${panelOpen ? '' : ' closed'}`}>

        {panelOpen && (
          <aside className="qr-sidebar">
            {panel === 'surahs'
              ? <SurahNav surahs={surahs} currentPage={page}
                onSelect={p => { go(p); if (window.innerWidth < 900) setPanelOpen(false); }} />
              : <BookmarkPanel bookmarks={bookmarks}
                onGoTo={p => { go(p); if (window.innerWidth < 900) setPanelOpen(false); }}
                onDelete={deleteBm} />
            }
          </aside>
        )}

        {/* Main reading pane — fixed height, internal scroll */}
        <div className="qr-pane">
          <NavRow top />

          {/* Image container — fixed height, centered, scrollable if zoomed */}
          <div className={`qr-img-box${isRotated ? ' rotated' : ''}`}>
            {loading && (
              <div className="qr-state-box">
                <div className="qr-spin" /><span>Loading page {page}…</span>
              </div>
            )}
            {error && !loading && (
              <div className="qr-state-box">
                <span style={{ fontSize: '2rem' }}>⚠️</span>
                <p>{error}</p>
                <button className="qr-nav-btn" onClick={() => setPage(p => p)}>Retry</button>
              </div>
            )}
            {!loading && !error && pageData?.imageUrl && (
              <>
                {!imgLoaded && <div className="qr-shimmer" />}
                <img
                  src={pageData.imageUrl}
                  alt={`Quran page ${page}`}
                  className={`qr-img${imgLoaded ? ' ready' : ''}`}
                  style={{ transform: imgTransform, transformOrigin: 'center center', transition: 'transform 0.25s ease' }}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => { setImgLoaded(true); setError('Image failed to load.'); }}
                  draggable={false}
                />
              </>
            )}
            {!loading && !error && !pageData?.imageUrl && (
              <div className="qr-state-box">
                <span style={{ fontSize: '2rem' }}>📄</span>
                <p>No image for page {page}.</p>
              </div>
            )}
          </div>

          <NavRow />
          <p className="qr-hint">💡 Use ← → arrow keys to navigate</p>
        </div>
      </div>

      {toast && <div className="qr-toast">{toast}</div>}
    </div>
  );
};

export default QuranReader;