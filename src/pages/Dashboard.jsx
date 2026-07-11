/**
 * Student home: active polls and a snapshot of the student's activity.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActivePolls, getVisibleEvents, getMySuggestions, toggleInterest as toggleInterestRequest, publicError } from '../lib/api';
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
  const [events, setEvents] = useState([]);
  const [mine, setMine] = useState([]);
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);


  const loadAll = useCallback(async () => {
    setDataLoading(true);
    setError('');
    try {
      const [pollRows, eventRows, ownRows] = await Promise.all([
        getActivePolls(), getVisibleEvents(), getMySuggestions(userId),
      ]);
      setPolls(pollRows || []);
      setEvents(eventRows || []);
      setMine(ownRows || []);
    } catch (e) { setError(publicError(e, 'Could not load the dashboard.')); }
    finally { setDataLoading(false); }
  }, [userId]);

  useEffect(() => {
    if (loading) return undefined;
    const timer = setTimeout(() => { void loadAll(); }, 0);
    return () => clearTimeout(timer);
  }, [loading, loadAll]);


  const countFor = useCallback((sid) => Number(polls.find((row) => row.id === sid)?.interested_count || 0), [polls]);
  const didVote = useCallback((sid) => !!polls.find((row) => row.id === sid)?.i_voted, [polls]);

  const toggleInterest = async (sid) => {
    if (!userId) return;
    setBusyKey(sid);
    setError('');
    try { await toggleInterestRequest(sid); await loadAll(); }
    catch (e) { setError(publicError(e, 'Could not update your vote.')); }
    finally { setBusyKey(null); }
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
            <EventRow key={ev.id} event={ev} goingCount={Number(ev.going_count || 0)} showDescription={false}
              right={<button className="btn btn-secondary btn-sm" onClick={() => navigate('/events')}>Details</button>} />
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
