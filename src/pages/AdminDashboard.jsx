/**
 * SRC admin dashboard: demand metrics, clustered suggestions by campus, and the underserved-category trend.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getAdminSuggestions, publicError } from '../lib/api';
import { useProfile, isEventPast } from '../lib/useProfile';
import AdminLayout from '../components/AdminLayout';
import { Loader, StatCard, EmptyState, ErrorBanner } from '../components/ui';
import { prettyCampus, CATEGORY_LABELS } from '../lib/format';
import { LightbulbIcon, LayersIcon, CalendarIcon, HeartIcon, TrendingIcon, ArrowRightIcon } from '../components/icons';

const CAMPUSES = ['musgrave', 'umhlanga'];
const CATEGORY_KEYS = ['sports', 'social', 'academic', 'cultural', 'other'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { loading, profile } = useProfile();
  const [suggestions, setSuggestions] = useState([]);
  const [votes, setVotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) { setError('Not connected to Supabase.'); setDataLoading(false); return; }
    setDataLoading(true);
    setError('');
    let suggestionRows = [];
    try { suggestionRows = await getAdminSuggestions(); } catch (e) { setError(publicError(e, 'Could not load suggestions.')); }
    const [vRes, eRes] = await Promise.all([
      supabase.from('votes').select('suggestion_id, vote_type').limit(2000),
      supabase.from('events').select('id, status, event_date, campus_scope, category'),
    ]);
    setSuggestions(suggestionRows || []);
    setVotes(vRes.data || []);
    setEvents(eRes.data || []);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return undefined;
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [loading, load]);

  const interestedFor = useCallback(
    (sid) => votes.filter((v) => v.suggestion_id === sid && v.vote_type === 'interested').length,
    [votes],
  );

  const stats = useMemo(() => {
    const clustered = suggestions.filter((s) => s.cluster_label);
    const upcoming = events.filter((e) => e.status !== 'cancelled' && !isEventPast(e));
    const interested = votes.filter((v) => v.vote_type === 'interested').length;
    return {
      total: suggestions.length,
      clustered: clustered.length,
      upcoming: upcoming.length,
      interested,
    };
  }, [suggestions, events, votes]);

  // Real cluster groupings per campus: label -> { ideas, interested }
  const clustersByCampus = useMemo(() => {
    const out = { musgrave: {}, umhlanga: {} };
    suggestions.forEach((s) => {
      if (!s.cluster_label) return;
      const c = (s.campus || '').toLowerCase();
      if (!out[c]) return;
      if (!out[c][s.cluster_label]) out[c][s.cluster_label] = { ideas: 0, interested: 0 };
      out[c][s.cluster_label].ideas += 1;
      out[c][s.cluster_label].interested += interestedFor(s.id);
    });
    return out;
  }, [suggestions, interestedFor]);

  // Category demand vs supply. "Underserved" = students are asking for a
  // category (suggestions / interest) but few or no events are scheduled for it.
  const categoryTrend = useMemo(() => {
    const rows = CATEGORY_KEYS.map((key) => {
      const sugg = suggestions.filter((s) => (s.category || '').toLowerCase() === key);
      const interested = sugg.reduce((sum, s) => sum + interestedFor(s.id), 0);
      const evCount = events.filter(
        (e) => (e.category || '').toLowerCase() === key && e.status !== 'cancelled',
      ).length;
      return { key, label: CATEGORY_LABELS[key] || key, ideas: sugg.length, interested, events: evCount };
    }).filter((r) => r.ideas > 0 || r.events > 0);
    rows.sort((a, b) => (b.interested - a.interested) || (b.ideas - a.ideas));
    return rows;
  }, [suggestions, events, interestedFor]);

  if (loading || dataLoading) {
    return <AdminLayout profile={profile}><Loader full /></AdminLayout>;
  }

  const trendMax = categoryTrend.reduce((m, r) => Math.max(m, r.interested), 0) || 1;

  return (
    <AdminLayout profile={profile}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">An overview of student suggestions, polling interest, and events across both campuses.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/suggestions')}>
          Manage suggestions <ArrowRightIcon size={14} />
        </button>
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      <div className="grid grid-4">
        <StatCard icon={<LightbulbIcon size={19} />} value={stats.total} label="Total suggestions" />
        <StatCard icon={<LayersIcon size={19} />} value={stats.clustered} label="Clustered ideas" />
        <StatCard icon={<HeartIcon size={19} />} value={stats.interested} label="Interested votes" />
        <StatCard icon={<CalendarIcon size={19} />} value={stats.upcoming} label="Upcoming events" />
      </div>

      <div className="section-head">
        <h2 className="section-title">Clustered Suggestions by Campus</h2>
      </div>
      <div className="grid grid-2">
        {CAMPUSES.map((c) => {
          const groups = Object.entries(clustersByCampus[c] || {})
            .sort((a, b) => b[1].interested - a[1].interested);
          const max = groups.reduce((m, g) => Math.max(m, g[1].interested), 0) || 1;
          return (
            <div key={c} className="card card-pad">
              <div className="poll-head">
                <h3 className="section-title nomargin">{prettyCampus(c)}</h3>
                <span className="badge badge-blue">{groups.length} clusters</span>
              </div>
              {groups.length === 0 ? (
                <EmptyState title="No clusters yet" sub="Label suggestions on the Suggestions page to group them into ideas." small />
              ) : (
                <div className="bars">
                  {groups.map(([label, g]) => {
                    const barStyle = { width: `${Math.round((g.interested / max) * 100)}%` };
                    return (
                      <div key={label} className="bar-row">
                        <div className="bar-label">
                          <span className="bar-name">{label}</span>
                          <span className="bar-val">{g.interested} interested · {g.ideas} idea{g.ideas === 1 ? '' : 's'}</span>
                        </div>
                        <div className="bar-track"><div className="bar-fill" style={barStyle} /></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="section-head">
        <h2 className="section-title"><TrendingIcon size={16} /> Underserved Categories Trend</h2>
      </div>
      <div className="card card-pad">
        {categoryTrend.length === 0 ? (
          <EmptyState
            icon={<TrendingIcon size={22} />}
            title="No category data yet"
            sub="Run AI analysis on the Suggestions page to tag suggestions by category. Demand by category will then appear here."
            small
          />
        ) : (
          <>
            <p className="page-sub">Categories students are asking for, ranked by interest. A category with demand but no scheduled events is underserved.</p>
            <div className="bars">
              {categoryTrend.map((r) => {
                const barStyle = { width: `${Math.round((r.interested / trendMax) * 100)}%` };
                const underserved = r.events === 0 && (r.interested > 0 || r.ideas > 0);
                return (
                  <div key={r.key} className="bar-row">
                    <div className="bar-label">
                      <span className="bar-name">{r.label} {underserved ? <span className="badge badge-amber">Underserved</span> : null}</span>
                      <span className="bar-val">{r.interested} interested · {r.ideas} idea{r.ideas === 1 ? '' : 's'} · {r.events} event{r.events === 1 ? '' : 's'}</span>
                    </div>
                    <div className="bar-track"><div className="bar-fill" style={barStyle} /></div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
