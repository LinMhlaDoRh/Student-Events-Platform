import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useProfile } from '../lib/useProfile';
import StudentLayout from '../components/StudentLayout';
import { Loader, StatCard, EmptyState, ErrorBanner, Badge } from '../components/ui';
import { prettyCampus, fmtDate, initials, SUGGESTION_STATUS } from '../lib/format';
import { LightbulbIcon, HeartIcon, CalendarIcon, MapPinIcon, UserIcon } from '../components/icons';

export default function Profile() {
  const { loading, session, profile } = useProfile();
  const userId = session?.user?.id || null;

  const [memberSince, setMemberSince] = useState(null);
  const [mine, setMine] = useState([]);
  const [voteCount, setVoteCount] = useState(0);
  const [attendCount, setAttendCount] = useState(0);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase || !userId) { setDataLoading(false); return; }
    setDataLoading(true);
    setError('');
    const [meRes, suggRes, votesRes, attRes] = await Promise.all([
      supabase.from('users').select('created_at').eq('id', userId).single(),
      supabase.from('suggestions').select('id, text, status, campus, created_at').eq('submitted_by', userId).order('created_at', { ascending: false }),
      supabase.from('votes').select('suggestion_id').eq('user_id', userId),
      supabase.from('event_attendees').select('event_id').eq('user_id', userId),
    ]);
    if (meRes.data?.created_at) setMemberSince(meRes.data.created_at);
    setMine(suggRes.data || []);
    setVoteCount((votesRes.data || []).length);
    setAttendCount((attRes.data || []).length);
    setDataLoading(false);
  }, [userId]);

  useEffect(() => { if (!loading) load(); }, [loading, load]);

  if (loading || dataLoading) {
    return <StudentLayout profile={profile}><Loader full /></StudentLayout>;
  }

  const campus = prettyCampus(profile?.campus);

  return (
    <StudentLayout profile={profile}>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-sub">Your account details and activity on the platform.</p>
        </div>
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      <div className="card card-pad identity-card">
        <span className="avatar" style={bigAvatar}>{initials(profile?.full_name, profile?.email)}</span>
        <div style={identityMain}>
          <h2 style={nameText}>{profile?.full_name || 'Student'}</h2>
          <p className="page-sub" style={emailText}>{profile?.email}</p>
          <div style={chipRow}>
            <Badge tone="blue"><MapPinIcon size={12} /> {campus}</Badge>
            <Badge tone="gray"><UserIcon size={12} /> Student</Badge>
            {memberSince ? <Badge tone="gray">Joined {fmtDate(memberSince)}</Badge> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={statsTop}>
        <StatCard icon={<LightbulbIcon size={19} />} value={mine.length} label="Suggestions made" />
        <StatCard icon={<HeartIcon size={19} />} value={voteCount} label="Polls you're interested in" />
        <StatCard icon={<CalendarIcon size={19} />} value={attendCount} label="Events attending" />
      </div>

      <div className="section-head">
        <h2 className="section-title">Your suggestions</h2>
      </div>
      {mine.length === 0 ? (
        <EmptyState icon={<LightbulbIcon size={22} />} title="No suggestions yet" sub="Ideas you submit will be listed here with their current status." small />
      ) : (
        <div className="grid" style={tightGrid}>
          {mine.map((s) => {
            const st = SUGGESTION_STATUS[s.status] || SUGGESTION_STATUS.submitted;
            return (
              <div key={s.id} className="card card-pad">
                <div className="poll-head">
                  <Badge tone={st.cls.replace('badge-', '')}>{st.label}</Badge>
                  <span className="page-sub" style={metaText}>{fmtDate(s.created_at)}</span>
                </div>
                <p style={ideaText}>&ldquo;{s.text}&rdquo;</p>
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}

const bigAvatar = { width: 60, height: 60, fontSize: 20, borderRadius: 16 };
const identityMain = { minWidth: 0 };
const nameText = { fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' };
const emailText = { margin: '4px 0 0', wordBreak: 'break-word' };
const chipRow = { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' };
const statsTop = { marginTop: 18 };
const tightGrid = { gap: 12 };
const ideaText = { fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55, margin: '12px 0 0' };
const metaText = { margin: 0, fontSize: 12.5 };
