/**
 * SRC admin feedback: ratings, attendance, and comments collected after events.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useProfile } from '../lib/useProfile';
import AdminLayout from '../components/AdminLayout';
import { Loader, StatCard, EmptyState, ErrorBanner, Donut, StarRating, Badge } from '../components/ui';
import { fmtDate } from '../lib/format';
import { StarIcon, MessageIcon, UsersIcon, CheckCircleIcon } from '../components/icons';

export default function AdminFeedback() {
  const { loading, profile } = useProfile();
  const [feedback, setFeedback] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) { setError('Not connected to Supabase.'); setDataLoading(false); return; }
    setDataLoading(true);
    setError('');
    const [fRes, eRes] = await Promise.all([
      supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('events').select('id, title'),
    ]);
    if (fRes.error) setError(fRes.error.message);
    setFeedback(fRes.data || []);
    setEvents(eRes.data || []);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return undefined;
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [loading, load]);

  const titleOf = useCallback((eid) => (events.find((e) => e.id === eid) || {}).title || 'Event', [events]);

  const summary = useMemo(() => {
    const total = feedback.length;
    const avg = total ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / total) : 0;
    const attended = feedback.filter((f) => f.did_attend === true).length;
    const notAttended = feedback.filter((f) => f.did_attend === false).length;
    const dist = [1, 2, 3, 4, 5].map((n) => feedback.filter((f) => Math.round(f.rating) === n).length);
    return { total, avg, attended, notAttended, dist };
  }, [feedback]);

  const comments = useMemo(() => feedback.filter((f) => (f.comment || '').trim()), [feedback]);

  if (loading || dataLoading) {
    return <AdminLayout profile={profile}><Loader full /></AdminLayout>;
  }

  const maxDist = Math.max(...summary.dist, 1);
  const donutCenter = { value: summary.total, label: 'Responses' };

  return (
    <AdminLayout profile={profile}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Feedback</h1>
          <p className="page-sub">Ratings, attendance and comments students shared after events.</p>
        </div>
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      {summary.total === 0 ? (
        <EmptyState icon={<MessageIcon size={22} />} title="No feedback yet" sub="Once students leave feedback on past events, summaries and comments appear here." />
      ) : (
        <>
          <div className="grid grid-4">
            <StatCard icon={<StarIcon size={19} />} value={summary.avg.toFixed(1)} label="Average rating" />
            <StatCard icon={<MessageIcon size={19} />} value={summary.total} label="Total responses" />
            <StatCard icon={<CheckCircleIcon size={19} />} value={summary.attended} label="Attended" />
            <StatCard icon={<UsersIcon size={19} />} value={summary.notAttended} label="Didn't attend" />
          </div>

          <div className="grid grid-2" style={chartsGap}>
            <div className="card card-pad">
              <h3 className="section-title nomargin">Rating distribution</h3>
              <div className="bars" style={barsTop}>
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = summary.dist[n - 1];
                  const barStyle = { width: `${Math.round((count / maxDist) * 100)}%` };
                  return (
                    <div key={n} className="bar-row">
                      <div className="bar-label">
                        <span className="bar-name">{n} star{n === 1 ? '' : 's'}</span>
                        <span className="bar-val">{count}</span>
                      </div>
                      <div className="bar-track"><div className="bar-fill" style={barStyle} /></div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card card-pad">
              <h3 className="section-title nomargin">Attendance</h3>
              <div className="donut-wrap">
                <Donut
                  segments={[
                    { value: summary.attended, color: 'var(--blue-600)' },
                    { value: summary.notAttended, color: '#e2e8f0' },
                  ]}
                  center={donutCenter}
                />
                <div className="legend">
                  <div className="legend-item"><span className="dot blue" /> Attended ({summary.attended})</div>
                  <div className="legend-item"><span className="dot gray" /> Didn&apos;t attend ({summary.notAttended})</div>
                </div>
              </div>
            </div>
          </div>

          <div className="section-head">
            <h2 className="section-title">Comments</h2>
          </div>
          {comments.length === 0 ? (
            <EmptyState title="No written comments" sub="Students left ratings but no written comments yet." small />
          ) : (
            <div className="grid" style={tightGrid}>
              {comments.map((f) => (
                <div key={`${f.event_id}-${f.user_id}`} className="card card-pad">
                  <div className="poll-head">
                    <div className="fb-head">
                      <span className="fb-event">{titleOf(f.event_id)}</span>
                      <StarRating value={f.rating} display />
                    </div>
                    <Badge tone={f.did_attend ? 'green' : 'gray'}>{f.did_attend ? 'Attended' : 'Did not attend'}</Badge>
                  </div>
                  <p style={commentText}>&ldquo;{f.comment}&rdquo;</p>
                  {f.created_at ? <p className="page-sub" style={metaText}>{fmtDate(f.created_at)}</p> : null}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}

const barsTop = { marginTop: 16 };
const chartsGap = { marginTop: 28 };
const tightGrid = { gap: 12 };
const commentText = { fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55, margin: '12px 0 8px' };
const metaText = { margin: 0, fontSize: 12.5 };
