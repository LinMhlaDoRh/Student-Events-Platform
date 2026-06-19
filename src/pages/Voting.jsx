import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
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
  "Interested" — attendance commitment happens later on confirmed events, so we
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
  const [votes, setVotes] = useState([]);
  const [tab, setTab] = useState('all');
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  const loadVotes = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from('votes').select('suggestion_id, user_id, vote_type');
    setVotes(data || []);
  }, []);

  const loadAll = useCallback(async () => {
    if (!supabase) { setError('Not connected to Supabase.'); setDataLoading(false); return; }
    setDataLoading(true);
    setError('');
    const { data, error: sErr } = await supabase
      .from('suggestions')
      .select('id, text, campus, cluster_label, status, created_at')
      .not('cluster_label', 'is', null)
      .order('cluster_label', { ascending: true });
    if (sErr) setError(sErr.message);
    else setSuggestions(data || []);
    await loadVotes();
    setDataLoading(false);
  }, [loadVotes]);

  useEffect(() => { if (!loading) loadAll(); }, [loading, loadAll]);

  useEffect(() => {
    if (!supabase) return undefined;
    const ch = supabase
      .channel('polls-realtime')
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
      const { error: e } = await supabase.from('votes').insert({ suggestion_id: sid, vote_type: 'interested' });
      if (e) setError(e.message);
    }
    await loadVotes();
    setBusyKey(null);
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
