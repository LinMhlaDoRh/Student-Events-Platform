/**
 * Active polls: students register interest in suggested events.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getActivePolls, toggleInterest as toggleInterestRequest, publicError } from '../lib/api';
import { useProfile } from '../lib/useProfile';
import StudentLayout from '../components/StudentLayout';
import { PollCard } from '../components/cards';
import { Loader, EmptyState, ErrorBanner } from '../components/ui';
import { prettyCampus } from '../lib/format';
import { VoteIcon } from '../components/icons';

/*
  Active Polls
  ------------
  Students vote on CLUSTERED ideas (suggestions an admin has given a
  cluster_label). Cross-campus visibility is intentional. The only signal is
  "Interested". Attendance commitment happens later on confirmed events, so we
  deliberately do not show an "I'll attend" control at the poll stage.
  Counts update live via a Supabase realtime channel on the votes table.
*/

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'musgrave', label: 'Musgrave' },
  { key: 'umhlanga', label: 'uMhlanga' },
];

export default function Voting() {
  const { loading, session, profile } = useProfile();
  const userId = session?.user?.id || null;

  const [suggestions, setSuggestions] = useState([]);
  const [tab, setTab] = useState('all');
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);


  const loadAll = useCallback(async () => {
    setDataLoading(true);
    setError('');
    try { setSuggestions(await getActivePolls()); }
    catch (e) { setError(publicError(e, 'Could not load active polls.')); }
    finally { setDataLoading(false); }
  }, []);

  useEffect(() => {
    if (loading) return undefined;
    const timer = setTimeout(() => { void loadAll(); }, 0);
    return () => clearTimeout(timer);
  }, [loading, loadAll]);


  const countFor = useCallback((sid) => Number(suggestions.find((row) => row.id === sid)?.interested_count || 0), [suggestions]);
  const didVote = useCallback((sid) => !!suggestions.find((row) => row.id === sid)?.i_voted, [suggestions]);

  const toggleInterest = async (sid) => {
    if (!userId) return;
    setBusyKey(sid);
    setError('');
    try { await toggleInterestRequest(sid); await loadAll(); }
    catch (e) { setError(publicError(e, 'Could not update your vote.')); }
    finally { setBusyKey(null); }
  };

  // Polls leave the board once the SRC has decided on them: an approved idea is
  // on its way to becoming a confirmed event, and a rejected one is closed, so
  // neither is still votable here.
  const filtered = useMemo(
    () => suggestions.filter(
      (s) => !['approved', 'rejected'].includes(s.status)
        && (tab === 'all' || (s.campus || '').toLowerCase() === tab),
    ),
    [suggestions, tab],
  );

  if (loading || dataLoading) {
    return <StudentLayout profile={profile}><Loader full /></StudentLayout>;
  }

  return (
    <StudentLayout profile={profile}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Active Polls</h1>
          <p className="page-sub">Tap &ldquo;I&apos;m Interested&rdquo; to show the SRC which ideas you want to see become real events.</p>
        </div>
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      <div style={tabsRow}>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<VoteIcon size={22} />}
          title="No active polls"
          sub="Once the SRC groups student suggestions into ideas, they appear here for voting."
        />
      ) : (
        <div className="grid grid-3">
          {filtered.map((s) => (
            <PollCard
              key={s.id}
              idea={s.cluster_label || 'Event idea'}
              description={s.text}
              campus={prettyCampus(s.campus)}
              interested={countFor(s.id)}
              active={didVote(s.id)}
              busy={busyKey === s.id}
              onToggle={() => toggleInterest(s.id)}
            />
          ))}
        </div>
      )}
    </StudentLayout>
  );
}

const tabsRow = { marginBottom: 20 };
