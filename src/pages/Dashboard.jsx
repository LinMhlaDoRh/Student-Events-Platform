import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useProfile, isEventPast } from '../lib/useProfile';
import StudentLayout from '../components/StudentLayout';
import { PollCard, EventRow } from '../components/cards';
import { Loader, EmptyState, StatCard, ErrorBanner } from '../components/ui';
import { firstName, prettyCampus } from '../lib/format';
import { VoteIcon, CalendarIcon, LightbulbIcon, PlusCircleIcon, ArrowRightIcon } from '../components/icons';

export default function Dashboard() {
  const navigate = useNavigate();
  const { loading, session, profile } = useProfile();
  const userId = session?.user?.id || null;

  const [polls, setPolls] = useState([]);
  const [votes, setVotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [mine, setMine] = useState([]);
  const [counts, setCounts] = useState({});
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  const loadVotes = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from('votes').select('suggestion_id, user_id, vote_type');
    setVotes(data || []);
  }, []);

  const loadAll = useCallback(async () => {
    if (!supabase) { setDataLoading(false); return; }
    setDataLoading(true);
    setError('');
    const [suggRes, evRes, mineRes, attRes] = await Promise.all([
      supabase.from('suggestions').select('id, text, campus, cluster_label, status').not('cluster_label', 'is', null),
      supabase.from('events').select('*').order('event_date', { ascending: true }),
      userId
        ? supabase.from('suggestions').select('id, status').eq('submitted_by', userId)
        : Promise.resolve({ data: [] }),
      supabase.from('event_attendees').select('event_id'),
    ]);
    if (suggRes.error) setError(suggRes.error.message);
    setPolls(suggRes.data || []);
    setEvents(evRes.data || []);
    setMine(mineRes.data || []);
    const cmap = {};
    (attRes.data || []).forEach((r) => { cmap[r.event_id] = (cmap[r.event_id] || 0) + 1; });
    setCounts(cmap);
    await loadVotes();
    setDataLoading(false);
  }, [userId, loadVotes]);

  useEffect(() => { if (!loading) loadAll(); }, [loading, loadAll]);

  useEffect(() => {
    if (!supabase) return undefined;
    const ch = supabase
      .channel('home-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => loadVotes())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadVotes]);

  const countFor = useCallback(
    (sid) => votes.filter((v) => v.suggestion_id === sid && v.vote_type === 'interested').length,
    [votes],
  );
  const didVote = useCallback(
    (sid) => votes.some((v) => v.suggestion_id === sid && v.user_id === userId && v.vote_type === 'interested'),
    [votes, userId],
  );

  const toggleInterest = async (sid) => {
    if (!supabase || !userId) return;
    setBusyKey(sid);
    setError('');
    if (didVote(sid)) {
      const { error: e } = await supabase.from('votes').delete()
        .eq('suggestion_id', sid).eq('user_id', userId).eq('vote_type', 'interested');
      if (e) setError(e.message);
    } else {
      const { error: e } = await supabase.from('votes')
        .insert({ suggestion_id: sid, vote_type: 'interested' });
      if (e) setError(e.message);
    }
    await loadVotes();
    setBusyKey(null);
  };

  const upcoming = useMemo(
    () => events.filter((e) => e.status !== 'cancelled' && !isEventPast(e)),
    [events],
  );

  const activePolls = useMemo(
    () => polls.filter((p) => !['approved', 'rejected'].includes(p.status)),
    [polls],
  );

  const topPolls = useMemo(() => {
    const withCounts = activePolls.map((p) => ({ ...p, _c: countFor(p.id) }));
    withCounts.sort((a, b) => b._c - a._c);
    return withCounts.slice(0, 4);
  }, [activePolls, countFor]);

  if (loading || dataLoading) {
    return <StudentLayout profile={profile}><Loader full /></StudentLayout>;
  }

  const name = firstName(profile?.full_name, profile?.email);
  const campus = prettyCampus(profile?.campus);

  return (
    <StudentLayout profile={profile}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Hey, {name} 👋</h1>
          <p className="page-sub">Here&apos;s what&apos;s happening at {campus} right now.</p>
        </div>
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      <div className="grid grid-3">
        <StatCard icon={<VoteIcon size={19} />} value={activePolls.length} label="Active polls" />
        <StatCard icon={<CalendarIcon size={19} />} value={upcoming.length} label="Upcoming events" />
        <StatCard icon={<LightbulbIcon size={19} />} value={mine.length} label="Your suggestions" />
      </div>

      <div className="section-head">
        <h2 className="section-title">Active Polls</h2>
        <button className="link-btn" onClick={() => navigate('/vote')}>View all <ArrowRightIcon size={13} /></button>
      </div>
      {topPolls.length === 0 ? (
        <EmptyState
          icon={<VoteIcon size={22} />}
          title="No active polls yet"
          sub="When the SRC groups student suggestions into ideas, they appear here for you to vote on."
          small
        />
      ) : (
        <div className="grid grid-3">
          {topPolls.map((p) => (
            <PollCard
              key={p.id}
              idea={p.cluster_label || 'Event idea'}
              description={p.text}
              campus={prettyCampus(p.campus)}
              interested={countFor(p.id)}
              active={didVote(p.id)}
              busy={busyKey === p.id}
              onToggle={() => toggleInterest(p.id)}
            />
          ))}
        </div>
      )}

      <div className="section-head">
        <h2 className="section-title">Upcoming Events</h2>
        <button className="link-btn" onClick={() => navigate('/events')}>View all <ArrowRightIcon size={13} /></button>
      </div>
      {upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={22} />}
          title="No upcoming events"
          sub="Confirmed events show up here. Vote on polls to help the SRC decide what to run next."
          small
        />
      ) : (
        <div className="grid">
          {upcoming.slice(0, 4).map((ev) => (
            <EventRow key={ev.id} event={ev} goingCount={counts[ev.id] || 0} showDescription={false}
              right={<button className="btn btn-secondary btn-sm" onClick={() => navigate('/events')}>Details</button>} />
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
