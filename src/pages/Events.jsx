import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useProfile, isEventPast } from '../lib/useProfile';
import StudentLayout from '../components/StudentLayout';
import { EventRow } from '../components/cards';
import { Loader, EmptyState, ErrorBanner, Modal, StarRating, Toast } from '../components/ui';
import { CalendarIcon, CheckIcon, MessageIcon, ClockIcon } from '../components/icons';

export default function Events() {
  const { loading, session, profile } = useProfile();
  const userId = session?.user?.id || null;

  const [events, setEvents] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Feedback modal state
  const [fbEvent, setFbEvent] = useState(null);
  const [rating, setRating] = useState(0);
  const [didAttend, setDidAttend] = useState(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const loadDynamic = useCallback(async () => {
    if (!supabase) return;
    const [attRes, fbRes] = await Promise.all([
      supabase.from('event_attendees').select('event_id, user_id'),
      userId ? supabase.from('feedback').select('*').eq('user_id', userId) : Promise.resolve({ data: [] }),
    ]);
    setAttendees(attRes.data || []);
    setFeedback(fbRes.data || []);
  }, [userId]);

  const loadAll = useCallback(async () => {
    if (!supabase) { setError('Not connected to Supabase.'); setDataLoading(false); return; }
    setDataLoading(true);
    setError('');
    const { data, error: eErr } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    if (eErr) setError(eErr.message);
    else setEvents(data || []);
    await loadDynamic();
    setDataLoading(false);
  }, [loadDynamic]);

  useEffect(() => { if (!loading) loadAll(); }, [loading, loadAll]);

  useEffect(() => {
    if (!supabase) return undefined;
    const ch = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_attendees' }, () => loadDynamic())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadDynamic]);

  const goingCount = useCallback((eid) => attendees.filter((a) => a.event_id === eid).length, [attendees]);
  const amGoing = useCallback((eid) => attendees.some((a) => a.event_id === eid && a.user_id === userId), [attendees, userId]);
  const myFeedback = useCallback((eid) => feedback.find((f) => f.event_id === eid) || null, [feedback]);

  const toggleAttend = async (eid) => {
    if (!supabase || !userId) return;
    setBusyId(eid);
    setError('');
    if (amGoing(eid)) {
      const { error: e } = await supabase.from('event_attendees').delete().eq('event_id', eid).eq('user_id', userId);
      if (e) setError(e.message);
    } else {
      const { error: e } = await supabase.from('event_attendees').insert({ event_id: eid });
      if (e) setError(e.message);
    }
    await loadDynamic();
    setBusyId(null);
  };

  const openFeedback = (ev) => {
    const existing = myFeedback(ev.id);
    setFbEvent(ev);
    setRating(existing?.rating || 0);
    setDidAttend(typeof existing?.did_attend === 'boolean' ? existing.did_attend : null);
    setComment(existing?.comment || '');
  };

  const submitFeedback = async () => {
    if (!supabase || !userId || !fbEvent || !rating) return;
    setSaving(true);
    setError('');
    const payload = {
      event_id: fbEvent.id,
      user_id: userId,
      rating,
      comment: comment.trim() || null,
      did_attend: didAttend,
    };
    const { error: e } = await supabase.from('feedback').upsert(payload, { onConflict: 'event_id,user_id' });
    setSaving(false);
    if (e) { setError(e.message); return; }
    setFbEvent(null);
    setToast('Thanks for your feedback!');
    setTimeout(() => setToast(''), 3000);
    await loadDynamic();
  };

  const { upcoming, past } = useMemo(() => {
    const up = [];
    const pa = [];
    events.forEach((ev) => {
      if (ev.status === 'cancelled') return;
      if (isEventPast(ev)) pa.push(ev); else up.push(ev);
    });
    pa.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    return { upcoming: up, past: pa };
  }, [events]);

  if (loading || dataLoading) {
    return <StudentLayout profile={profile}><Loader full /></StudentLayout>;
  }

  return (
    <StudentLayout profile={profile}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-sub">Confirmed events for your campus. Mark your attendance and leave feedback afterwards.</p>
        </div>
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      <div className="section-head">
        <h2 className="section-title"><CalendarIcon size={16} /> Upcoming Events</h2>
      </div>
      {upcoming.length === 0 ? (
        <EmptyState icon={<CalendarIcon size={22} />} title="No upcoming events" sub="When the SRC confirms an event, it will appear here for you to attend." />
      ) : (
        <div className="grid" style={tightGrid}>
          {upcoming.map((ev) => {
            const going = amGoing(ev.id);
            return (
              <EventRow
                key={ev.id}
                event={ev}
                goingCount={goingCount(ev.id)}
                right={(
                  <button
                    className={`btn btn-sm ${going ? 'btn-secondary' : 'btn-primary'}`}
                    disabled={busyId === ev.id}
                    onClick={() => toggleAttend(ev.id)}
                  >
                    {going ? <><CheckIcon size={14} /> Attending</> : "I'm Attending"}
                  </button>
                )}
              />
            );
          })}
        </div>
      )}

      <div className="section-head">
        <h2 className="section-title"><ClockIcon size={16} /> Past Events</h2>
      </div>
      {past.length === 0 ? (
        <EmptyState icon={<ClockIcon size={22} />} title="No past events yet" sub="Once events wrap up, they move here so you can share feedback." small />
      ) : (
        <div className="grid" style={tightGrid}>
          {past.map((ev) => {
            const fb = myFeedback(ev.id);
            return (
              <EventRow
                key={ev.id}
                event={ev}
                goingCount={goingCount(ev.id)}
                right={(
                  <button className="btn btn-secondary btn-sm" onClick={() => openFeedback(ev)}>
                    <MessageIcon size={14} /> {fb ? 'Edit feedback' : 'Leave feedback'}
                  </button>
                )}
              />
            );
          })}
        </div>
      )}

      <Modal
        open={!!fbEvent}
        onClose={() => setFbEvent(null)}
        title={fbEvent ? `Feedback — ${fbEvent.title}` : 'Feedback'}
        footer={(
          <>
            <button className="btn btn-ghost" onClick={() => setFbEvent(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitFeedback} disabled={!rating || saving}>
              {saving ? <span className="spinner" /> : null} Submit feedback
            </button>
          </>
        )}
      >
        <div className="field">
          <label className="field-label">How would you rate it?</label>
          <StarRating value={rating} onChange={setRating} />
        </div>
        <div className="field">
          <label className="field-label">Did you attend?</label>
          <div className="choice-row">
            <button className={`choice ${didAttend === true ? 'active' : ''}`} onClick={() => setDidAttend(true)}>Yes, I attended</button>
            <button className={`choice ${didAttend === false ? 'active' : ''}`} onClick={() => setDidAttend(false)}>No, I didn&apos;t</button>
          </div>
        </div>
        <div className="field">
          <label className="field-label">Comments <span className="optional">(optional)</span></label>
          <textarea className="textarea" placeholder="What did you enjoy? What could be better?" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
      </Modal>

      <Toast show={!!toast}><CheckIcon size={15} /> {toast}</Toast>
    </StudentLayout>
  );
}

const tightGrid = { gap: 12 };
