import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiBookmark, FiBook, FiShare2, FiMoon, FiSun, FiMenu, FiX, FiZap, FiEye,
} from 'react-icons/fi';
import { quranService, bookmarkService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  QURAN, clampPage, pageProgress, preloadPageImages, rememberLastPage,
  resolveSurahForPage, resolveJuzForPage, storage, STORAGE_KEYS,
  buildSurahPageIndex, buildJuzPageIndex, mapPage,
} from '../utils';

const TOTAL = QURAN.TOTAL_PAGES;

const Drawer = ({ title, onClose, children }) => (
  <div className="pv2-drawer-overlay" onClick={onClose}>
    <div className="pv2-drawer" onClick={(e) => e.stopPropagation()}>
      <div className="pv2-drawer-header">
        <span>{title}</span>
        <button type="button" onClick={onClose} aria-label="Close"><FiX /></button>
      </div>
      <div className="pv2-drawer-body">{children}</div>
    </div>
  </div>
);

const PageViewer = () => {
  const { pageNumber } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const current = clampPage(pageNumber);

  const [pageData, setPageData] = useState(null);
  const [map, setMap] = useState(null);
  const [surahs, setSurahs] = useState([]);
  const [juzList, setJuzList] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [topics, setTopics] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [surahIndex, setSurahIndex] = useState(null);
  const [juzIndex, setJuzIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [jumpVal, setJumpVal] = useState(String(current));
  const [toast, setToast] = useState('');
  const [showFab, setShowFab] = useState(true);
  const [night, setNight] = useState(storage.get(STORAGE_KEYS.NIGHT_PAGE) === '1');
  const [focus, setFocus] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const fabTimer = useRef(null);
  const touchX = useRef(null);

  const go = useCallback((p) => {
    navigate(`/page/${clampPage(p)}`);
    setZoom(100);
    setRotation(0);
    setActiveHotspot(null);
  }, [navigate]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const resetFab = () => {
    setShowFab(true);
    clearTimeout(fabTimer.current);
    fabTimer.current = setTimeout(() => setShowFab(false), 4000);
  };

  useEffect(() => setJumpVal(String(current)), [current]);

  useEffect(() => {
    quranService.getSurahs().then((r) => {
      const list = r.data || r || [];
      setSurahs(list);
      setSurahIndex(buildSurahPageIndex(list));
    }).catch(() => {});
    quranService.getJuz().then((r) => {
      const list = r.data || r || [];
      setJuzList(list);
      setJuzIndex(buildJuzPageIndex(list));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setImgLoaded(false);
    setError(null);
    setPageData(null);
    setHotspots([]);
    setTopics([]);
    setKeywords([]);

    rememberLastPage(current);

    Promise.all([
      quranService.getPageByNumber(current),
      quranService.getPageMap(current).catch(() => null),
      quranService.getHotspots(current).catch(() => ({ data: [] })),
      quranService.getPageInsights(current).catch(() => null),
    ])
      .then(([pageRes, mapRes, hsRes, insightRes]) => {
        if (cancelled) return;
        setPageData(pageRes.data);
        setMap(mapRes?.data || null);
        setHotspots(Array.isArray(hsRes?.data) ? hsRes.data : []);
        const insight = insightRes?.data || insightRes;
        setTopics(insight?.nearbyTopics || insight?.topicsOnPage || []);
        setKeywords(mapRes?.data?.keywords || insight?.topicsOnPage || []);
      })
      .catch(() => { if (!cancelled) setError('Failed to load page.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    if (user) {
      bookmarkService.updateProgress(current).catch(() => {});
      bookmarkService.getBookmarkedPageNumbers()
        .then((r) => {
          const nums = r.data?.pageNumbers || [];
          if (!cancelled) setIsBookmarked(nums.includes(current));
        })
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, [current, user]);

  // Preload neighbors
  useEffect(() => {
    const neighbors = [current - 1, current + 1, current + 2].filter((p) => p >= 1 && p <= TOTAL);
    Promise.all(neighbors.map((p) => quranService.getPageByNumber(p).catch(() => null)))
      .then((results) => preloadPageImages(results.map((r) => r?.data?.imageUrl)));
  }, [current]);

  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(current + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(current - 1);
      if (e.key === 'f' || e.key === 'F') setFocus((v) => !v);
      if (e.key === 'n' || e.key === 'N') toggleNight();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [current, go]);

  const toggleNight = () => {
    setNight((v) => {
      const next = !v;
      storage.set(STORAGE_KEYS.NIGHT_PAGE, next ? '1' : '0');
      return next;
    });
  };

  const handleBookmark = async () => {
    if (!user) return showToast('Please login to bookmark');
    try {
      if (isBookmarked) {
        const res = await bookmarkService.getBookmarks(1, 200);
        const bms = res.data?.data || res.data || [];
        const bm = (Array.isArray(bms) ? bms : []).find((b) => b.pageNumber === current);
        if (bm) await bookmarkService.deleteBookmark(bm.id);
        setIsBookmarked(false);
        showToast('Bookmark removed');
      } else {
        await bookmarkService.createBookmark(current, '');
        setIsBookmarked(true);
        showToast('Bookmarked!');
      }
    } catch {
      showToast('Bookmark failed');
    }
  };

  const sharePage = async () => {
    const url = `${window.location.origin}/page/${current}`;
    try {
      if (navigator.share) await navigator.share({ title: `Mushaf page ${current}`, url });
      else {
        await navigator.clipboard.writeText(url);
        showToast('Link copied');
      }
    } catch {
      showToast('Share cancelled');
    }
  };

  const onTouchStart = (e) => { touchX.current = e.changedTouches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 60) go(dx < 0 ? current + 1 : current - 1);
    touchX.current = null;
  };

  const localMap = mapPage(current, { surahIndex, juzIndex });
  const surah = map?.surah || localMap.surah || resolveSurahForPage(surahs, current);
  const juz = map?.juz || localMap.juz || resolveJuzForPage(juzList, current);
  const pageKeywords = (keywords?.length ? keywords : topics).slice(0, 8);
  const progress = pageProgress(current);

  return (
    <div
      className={`pv2-shell${focus ? ' focus' : ''}${night ? ' night' : ''}`}
      onClick={resetFab}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {!focus && (
        <div className="pv2-topbar">
          <div className="pv2-topbar-nav">
            <Link to="/" className="pv2-back-btn">Back</Link>
            <button type="button" className="pv2-nav-btn" onClick={() => go(current - 1)} disabled={current <= 1}>‹</button>
            <div className="pv2-page-jump">
              <input
                type="number"
                className="pv2-jump-input"
                value={jumpVal}
                min={1}
                max={TOTAL}
                onChange={(e) => setJumpVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && go(jumpVal)}
                onFocus={(e) => e.target.select()}
              />
              <span className="pv2-jump-sep">/</span>
              <span className="pv2-jump-total">{TOTAL}</span>
              <button type="button" className="pv2-jump-go" onClick={() => go(jumpVal)}>Go</button>
            </div>
            <button type="button" className="pv2-nav-btn" onClick={() => go(current + 1)} disabled={current >= TOTAL}>›</button>
          </div>

          <div className="pv2-meta-badge">
            {surah && <span className="pv2-chip">{surah.nameEnglish}</span>}
            {juz && <span className="pv2-chip">Juz {juz.juzNumber}</span>}
          </div>

          <div className="pv2-topbar-actions">
            <button type="button" className="pv2-action-btn" onClick={toggleNight} title="Night page">{night ? <FiSun /> : <FiMoon />}</button>
            <button type="button" className="pv2-action-btn" onClick={() => setFocus(true)} title="Focus mode"><FiEye /></button>
            <button type="button" className="pv2-action-btn" onClick={sharePage} title="Share"><FiShare2 /></button>
            <button type="button" className={`pv2-action-btn${isBookmarked ? ' bookmarked' : ''}`} onClick={handleBookmark}>
              {isBookmarked ? <FiBookmark /> : <FiBook />}
            </button>
            <button type="button" className="pv2-action-btn" onClick={() => setDrawer('nav')}><FiMenu /></button>
          </div>
        </div>
      )}

      {!focus && (
        <>
          <div className="pv2-progress"><div className="pv2-progress-fill" style={{ width: `${progress}%` }} /></div>
        </>
      )}

      {!focus && pageKeywords.length > 0 && (
        <div className="pv2-keyword-row">
          <span className="pv2-keyword-label">Keywords on this page</span>
          <div className="pv2-keyword-chips">
            {pageKeywords.map((k) => (
              <button
                key={k.id || k.label}
                type="button"
                className="pv2-smart-chip"
                onClick={() => go(k.pageNumber || current)}
                title={k.english || k.category || ''}
              >
                {k.label || k.topicNameUrdu || k.topicNameEnglish}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pv2-stage-wrap">
        <div className="pv2-stage">
          {loading && <div className="pv2-state"><div className="pv2-spinner" /><span>Loading page {current}…</span></div>}
          {error && !loading && (
            <div className="pv2-state">
              <p>{error}</p>
              <button type="button" className="pv2-retry-btn" onClick={() => go(current)}>Retry</button>
            </div>
          )}
          {!loading && !error && pageData?.imageUrl && (
            <div className="pv2-img-frame">
              {!imgLoaded && <div className="pv2-shimmer" />}
              <img
                src={pageData.imageUrl}
                alt={`Quran page ${current}`}
                className={`pv2-img${imgLoaded ? ' loaded' : ''}${night ? ' night-filter' : ''}`}
                style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
                onLoad={() => setImgLoaded(true)}
                onError={() => { setImgLoaded(true); setError('Image failed to load.'); }}
                draggable={false}
              />
              {showHotspots && imgLoaded && hotspots.map((hs) => (
                <button
                  key={hs.id}
                  type="button"
                  className={`pv2-hotspot${activeHotspot?.id === hs.id ? ' active' : ''}`}
                  style={{ left: `${hs.x}%`, top: `${hs.y}%`, width: `${hs.width}%`, height: `${hs.height}%` }}
                  onClick={(e) => { e.stopPropagation(); setActiveHotspot(hs); }}
                  title={hs.label || 'Topic'}
                />
              ))}
            </div>
          )}
          {!loading && !error && !pageData?.imageUrl && (
            <div className="pv2-state"><p>No image for page {current}.</p></div>
          )}
        </div>

        <div className={`pv2-zoom-fab${showFab || focus ? ' visible' : ''}`}>
          <button type="button" className="pv2-zoom-btn" onClick={() => setZoom((z) => Math.max(60, z - 10))}>−</button>
          <span className="pv2-zoom-val">{zoom}%</span>
          <button type="button" className="pv2-zoom-btn" onClick={() => setZoom((z) => Math.min(200, z + 10))}>+</button>
          <div className="pv2-zoom-divider" />
          <button type="button" className="pv2-zoom-btn" onClick={() => { setZoom(100); setRotation(0); }}>↺</button>
          <button type="button" className="pv2-zoom-btn" onClick={() => setRotation((r) => (r + 90) % 360)}>⟳</button>
          {focus && <button type="button" className="pv2-zoom-btn" onClick={() => setFocus(false)}>Exit</button>}
        </div>
      </div>

      {!focus && topics.length > 0 && (
        <div className="pv2-smart-strip">
          <FiZap className="pv2-smart-icon" />
          <div className="pv2-smart-chips">
            {topics.slice(0, 5).map((t) => (
              <button key={t.id} type="button" className="pv2-smart-chip" onClick={() => go(t.pageNumber)}>
                {t.topicNameUrdu || t.topicNameEnglish} · p.{t.pageNumber}
              </button>
            ))}
          </div>
          <button type="button" className={`pv2-hs-toggle${showHotspots ? ' on' : ''}`} onClick={() => setShowHotspots((v) => !v)}>
            Hotspots
          </button>
        </div>
      )}

      {!focus && (
        <div className="pv2-bottom-nav">
          <button type="button" className="pv2-bottom-btn" onClick={() => go(current - 1)} disabled={current <= 1}>Prev</button>
          <span className="pv2-bottom-info">
            {surah ? `${surah.nameArabic}` : ''}
            {surah ? ' · ' : ''}
            Page {current}
            <span className="pv2-bottom-pct">{progress}%</span>
          </span>
          <button type="button" className="pv2-bottom-btn" onClick={() => go(current + 1)} disabled={current >= TOTAL}>Next</button>
        </div>
      )}

      {activeHotspot && (
        <div className="pv2-hotspot-card">
          <strong>{activeHotspot.label || 'Highlight'}</strong>
          {activeHotspot.topic && <p>{activeHotspot.topic.topicNameUrdu}</p>}
          <div className="pv2-hotspot-actions">
            {activeHotspot.topic?.pageNumber && (
              <button type="button" className="pv2-jump-go" onClick={() => { go(activeHotspot.topic.pageNumber); setActiveHotspot(null); }}>
                Open topic page
              </button>
            )}
            <button type="button" className="pv2-back-btn" onClick={() => setActiveHotspot(null)}>Close</button>
          </div>
        </div>
      )}

      {drawer === 'nav' && (
        <Drawer title="Jump by Surah / Juz" onClose={() => setDrawer(null)}>
          <h4 className="pv2-drawer-section">Surahs</h4>
          {surahs.map((s) => (
            <button
              key={s.id || s.surahNumber}
              type="button"
              className={`pv2-drawer-item${surah?.surahNumber === s.surahNumber ? ' active' : ''}`}
              onClick={() => { go(s.startPageNumber || 1); setDrawer(null); }}
            >
              <span>{s.surahNumber}. {s.nameEnglish}</span>
              <span>p.{s.startPageNumber || '—'}</span>
            </button>
          ))}
          <h4 className="pv2-drawer-section">Juz</h4>
          {juzList.map((j) => (
            <button
              key={j.id || j.juzNumber}
              type="button"
              className={`pv2-drawer-item${juz?.juzNumber === j.juzNumber ? ' active' : ''}`}
              onClick={() => { go(j.startPageNumber || 1); setDrawer(null); }}
            >
              <span>Juz {j.juzNumber}</span>
              <span>p.{j.startPageNumber || '—'}</span>
            </button>
          ))}
        </Drawer>
      )}

      {toast && <div className="pv2-toast">{toast}</div>}
    </div>
  );
};

export default PageViewer;
