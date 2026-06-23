/**
 * Student suggestions: submit event ideas (optionally anonymous) and browse community ideas.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useProfile } from '../lib/useProfile';
import StudentLayout from '../components/StudentLayout';
import { Loader, EmptyState, ErrorBanner, Switch, Badge, Toast } from '../components/ui';
import { prettyCampus, fmtDate, SUGGESTION_STATUS } from '../lib/format';
import { SendIcon, InfoIcon, LightbulbIcon, TrashIcon, MapPinIcon, SparkleIcon } from '../components/icons';

const MAX = 280;
/* One OPEN suggestion per student at a time. A new slot frees up once their idea is decided (approved or rejected). */
const ONE_PER_ROUND = true;
const CAMPUSES = ['musgrave', 'umhlanga'];

export default function Suggestions() {
  const { loading, session, profile } = useProfile();
  const userId = session?.user?.id || null;

  const [idea, setIdea] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(false);
  const [error, setError] = useState('');
  const [mine, setMine] = useState([]);
  const [community, setCommunity] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) { setDataLoading(false); return; }
    setDataLoading(true);
    const [mineRes, commRes] = await Promise.all([
      userId
        ? supabase.from('suggestions').select('*').eq('submitted_by', userId).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase.from('suggestions').select('id, text, campus, cluster_label, status').not('cluster_label', 'is', null),
    ]);
    setMine(mineRes.data || []);
    setCommunity(commRes.data || []);
    setDataLoading(false);
  }, [userId]);

  useEffect(() => { if (!loading) load(); }, [loading, load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!idea.trim() || submitting) return;
    if (!supabase) { setError('Not connected to the server.'); return; }
    if (ONE_PER_ROUND && mine.some((s) => s.status !== 'approved' && s.status !== 'rejected')) {
      setError("You already have an idea in review. You can suggest again once it's been approved or rejected.");
      return;
    }
    setSubmitting(true);
    setError('');
    const campusRaw = (profile?.campus || '').toLowerCase();
    // Persist the anonymity choice. If the optional `anonymous` column has not
    // been added to the database yet, fall back to inserting without it so
    // submissions keep working either way.
    let { data, error: insErr } = await supabase
      .from('suggestions')
      .insert({ text: idea.trim(), campus: campusRaw, anonymous })
      .select()
      .single();
    if (insErr && /anonymous/i.test(insErr.message || '')) {
      ({ data, error: insErr } = await supabase
        .from('suggestions')
        .insert({ text: idea.trim(), campus: campusRaw })
        .select()
        .single());
    }
    setSubmitting(false);
    if (insErr) { setError(insErr.message || 'Could not submit. Please try again.'); return; }
    setMine((prev) => [data, ...prev]);
    setIdea('');
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const withdraw = async (id) => {
    if (!supabase) return;
    const prev = mine;
    setMine((m) => m.filter((s) => s.id !== id));
    const { error: delErr } = await supabase.from('suggestions').delete().eq('id', id);
    if (delErr) { setMine(prev); setError(delErr.message); }
  };

  // Count how many community suggestions share each cluster label per campus.
  const similarCount = useMemo(() => {
    const m = {};
    community.forEach((s) => {
      const key = `${(s.campus || '').toLowerCase()}::${s.cluster_label}`;
      m[key] = (m[key] || 0) + 1;
    });
    return m;
  }, [community]);

  const byCampus = (c) => community.filter((s) => (s.campus || '').toLowerCase() === c);

  if (loading || dataLoading) {
    return <StudentLayout profile={profile}><Loader full /></StudentLayout>;
  }

  const campus = prettyCampus(profile?.campus);
  const alreadySubmitted = ONE_PER_ROUND && mine.some((s) => s.status !== 'approved' && s.status !== 'rejected');
  const overLimit = idea.length > MAX - 30;

  return (
    <StudentLayout profile={profile}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Suggest an Event</h1>
          <p className="page-sub">Share an idea for {campus}. The SRC reviews and groups similar ideas into polls.</p>
        </div>
        <span className="campus-badge ghost"><MapPinIcon size={13} /> {campus}</span>
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      <div className="grid grid-2">
        <div>
          <div className="card card-pad">
            <div className="field">
              <label className="field-label" htmlFor="idea">Your event idea</label>
              <textarea
                id="idea"
                className="textarea"
                placeholder="e.g. A beach clean-up followed by a picnic on Sunday afternoon…"
                value={idea}
                onChange={(e) => setIdea(e.target.value.slice(0, MAX))}
                disabled={alreadySubmitted}
              />
              <div className={`input-counter ${overLimit ? 'warn' : ''}`}>{idea.length} / {MAX}</div>
            </div>

            <div className="row-divider" />
            <div style={switchRow}>
              <Switch checked={anonymous} onChange={setAnonymous} label="Submit anonymously" />
            </div>
            <p className="page-sub" style={hintText}>Other students never see your name. Submit anonymously and the SRC sees this idea marked &ldquo;Anonymous&rdquo; too.</p>

            <div style={actionsRow}>
              <button className="btn btn-primary" onClick={submit} disabled={!idea.trim() || submitting || alreadySubmitted}>
                {submitting ? <span className="spinner" /> : <SendIcon size={15} />} Submit Suggestion
              </button>
              <button className="btn btn-ghost" onClick={() => setIdea('')} disabled={!idea}>Clear</button>
            </div>

            {alreadySubmitted ? (
              <div className="notice notice-blue" style={noticeTop}>
                <InfoIcon size={16} />
                <span>You&apos;ve already shared an idea. You can suggest again once it&apos;s been approved or rejected. Track its status under &ldquo;Your submissions&rdquo;.</span>
              </div>
            ) : null}
          </div>

          <div className="notice notice-blue" style={noticeTop}>
            <InfoIcon size={16} />
            <span>Once enough students show interest in similar ideas, the SRC turns them into a poll, then a confirmed event.</span>
          </div>
        </div>

        <div>
          <h2 className="section-title first">Your submissions</h2>
          {mine.length === 0 ? (
            <EmptyState icon={<LightbulbIcon size={22} />} title="No suggestions yet" sub="Your submitted ideas will appear here so you can track their status." small />
          ) : (
            <div className="grid" style={tightGrid}>
              {mine.map((s) => {
                const st = SUGGESTION_STATUS[s.status] || SUGGESTION_STATUS.submitted;
                const canWithdraw = s.status === 'submitted' || s.status === 'review';
                return (
                  <div key={s.id} className="card card-pad">
                    <div className="poll-head">
                      <Badge tone={st.cls.replace('badge-', '')}>{st.label}</Badge>
                      {canWithdraw ? (
                        <button className="btn btn-danger btn-sm" onClick={() => withdraw(s.id)}><TrashIcon size={13} /> Withdraw</button>
                      ) : null}
                    </div>
                    <p style={ideaText}>&ldquo;{s.text}&rdquo;</p>
                    <p className="page-sub" style={metaText}>Submitted {fmtDate(s.created_at)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="section-head">
        <h2 className="section-title">Community Suggestions</h2>
      </div>
      <div className="grid grid-2">
        {CAMPUSES.map((c) => {
          const items = byCampus(c);
          return (
            <div key={c} className="card card-pad">
              <div className="poll-head">
                <h3 className="section-title" style={noMargin}>{prettyCampus(c)}</h3>
                <Badge tone="blue">{items.length}</Badge>
              </div>
              {items.length === 0 ? (
                <EmptyState title="Nothing here yet" sub="Ideas the SRC has grouped will show up under this campus." small />
              ) : (
                <div className="grid" style={tightGrid}>
                  {items.map((s) => {
                    const key = `${c}::${s.cluster_label}`;
                    return (
                      <div key={s.id} className="card card-pad" style={feedItem}>
                        <Badge tone="gray">{s.cluster_label}</Badge>
                        <p style={ideaText}>{s.text}</p>
                        <p className="page-sub" style={metaText}>{similarCount[key]} similar suggestion{similarCount[key] === 1 ? '' : 's'} in this group</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Toast show={toast}><SparkleIcon size={15} /> Idea submitted — thanks!</Toast>
    </StudentLayout>
  );
}

const switchRow = { display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, cursor: 'pointer' };
const hintText = { margin: '6px 0 0', fontSize: 12.5 };
const actionsRow = { display: 'flex', gap: 10, marginTop: 18 };
const noticeTop = { marginTop: 16 };
const tightGrid = { gap: 12 };
const ideaText = { fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55, margin: '12px 0 8px' };
const metaText = { margin: 0, fontSize: 12.5 };
const noMargin = { margin: 0 };
const feedItem = { background: 'var(--surface-2)' };
