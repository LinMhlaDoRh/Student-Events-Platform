import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useProfile, isEventPast } from '../lib/useProfile';
import AdminLayout from '../components/AdminLayout';
import { Loader, StatCard, EmptyState, ErrorBanner } from '../components/ui';
import { prettyCampus } from '../lib/format';
import { LightbulbIcon, LayersIcon, CalendarIcon, HeartIcon, TrendingIcon, ArrowRightIcon } from '../components/icons';

const CAMPUSES = ['musgrave', 'umhlanga'];

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
    const [sRes, vRes, eRes] = await Promise.all([
      supabase.from('suggestions').select('id, text, campus, cluster_label, status'),
      supabase.from('votes').select('suggestion_id, vote_type'),
      supabase.from('events').select('id, status, event_date, campus_scope'),
    ]);
    if (sRes.error) setError(sRes.error.message);
    setSuggestions(sRes.data || []);
    setVotes(vRes.data || []);
    setEvents(eRes.data || []);
    setDataLoading(false);
  }, []);

  useEffect(() => { if (!loading) load(); }, [loading, load]);

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

  if (loading || dataLoading) {
    return <AdminLayout profile={profile}><Loader full /></AdminLayout>;
  }

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
      {/* FLAG: AI category-trend analytics (Phase 3 / Gemini clustering) is not
          implemented in the current system. We preserve the reference layout
          space but do not fabricate a chart or data. */}
      <EmptyState
        icon={<TrendingIcon size={22} />}
        title="Trend analysis not available yet"
        sub="Automatic category clustering and the underserved-categories trend are part of a planned AI phase that isn't built yet, so there's no data to chart here."
      />
    </AdminLayout>
  );
}
