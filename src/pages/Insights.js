import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiZap, FiCalendar, FiTarget, FiTrendingUp } from 'react-icons/fi';
import { quranService } from '../services/api';
import { getLastPage, buildKhatmPlan, getReadingStreak, pageProgress } from '../utils';

const Insights = () => {
  const navigate = useNavigate();
  const lastPage = getLastPage();
  const streak = getReadingStreak();
  const [days, setDays] = useState(30);
  const [daily, setDaily] = useState(null);
  const [suggest, setSuggest] = useState(null);
  const [plan, setPlan] = useState(() => buildKhatmPlan(lastPage, 30));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [d, s, k] = await Promise.all([
          quranService.getDailyFocus().catch(() => null),
          quranService.getSmartSuggest(lastPage).catch(() => null),
          quranService.getKhatmPlan(lastPage, days).catch(() => null),
        ]);
        setDaily(d?.data || d);
        setSuggest(s?.data || s);
        setPlan(k?.data || k || buildKhatmPlan(lastPage, days));
      } finally {
        setLoading(false);
      }
    })();
  }, [lastPage, days]);

  const localPlan = buildKhatmPlan(lastPage, days);
  const activePlan = plan?.schedule ? plan : localPlan;

  return (
    <div className="home-container insights-page">
      <div className="page-header">
        <div>
          <h1>Reading guide</h1>
          <p className="subtitle">Plan your reading and track progress</p>
        </div>
      </div>

      <div className="insights-stats">
        <div className="insights-stat"><FiTrendingUp /><div><strong>{pageProgress(lastPage)}%</strong><span>Progress</span></div></div>
        <div className="insights-stat"><FiTarget /><div><strong>{streak.count || 0}</strong><span>Day streak</span></div></div>
        <div className="insights-stat"><FiCalendar /><div><strong>{activePlan.pagesPerDay}</strong><span>Pages / day</span></div></div>
      </div>

      {daily && (
        <button type="button" className="insights-daily" onClick={() => navigate(`/page/${daily.pageNumber}`)}>
          <strong>{daily.title || 'Today’s focus'}</strong>
          <p>{daily.message}</p>
          <span>{daily.nameArabic} · {daily.nameEnglish} · Page {daily.pageNumber}</span>
        </button>
      )}

      {suggest?.context && (
        <div className="insights-context card-soft">
          <h3>Where you are</h3>
          <p>
            {suggest.context.surah?.nameEnglish || '—'}
            {suggest.context.juz ? ` · Juz ${suggest.context.juz.juzNumber}` : ''}
            {' · '}{suggest.context.progressPercent}%
          </p>
          <Link className="btn btn-primary" to={`/page/${suggest.continueAt || lastPage}`}>Resume page {suggest.continueAt || lastPage}</Link>
        </div>
      )}

      <div className="insights-plan card-soft">
        <div className="insights-plan-head">
          <h3>Khatm planner</h3>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[7, 15, 30, 60, 90].map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
        {loading ? <p>Building plan…</p> : (
          <div className="insights-schedule">
            {(activePlan.schedule || []).slice(0, 14).map((row) => (
              <button
                key={row.day}
                type="button"
                className="insights-day"
                onClick={() => navigate(`/page/${row.from}`)}
              >
                <span>Day {row.day}</span>
                <span>p.{row.from}–{row.to}</span>
                <span>{row.pages} pg</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {suggest?.relatedTopics?.length > 0 && (
        <div className="card-soft">
          <h3>Related topics near you</h3>
          <div className="home-related-chips">
            {suggest.relatedTopics.map((t) => (
              <Link key={t.id} to={`/page/${t.pageNumber}`} className="home-chip">
                {t.topicNameUrdu || t.topicNameEnglish} · p.{t.pageNumber}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Insights;
