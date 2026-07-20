/**
 * Events: campus-scoped upcoming and past events with RSVP.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getVisibleEvents, getOwnFeedback, toggleEventAttendance, submitEventFeedback, publicError } from '../lib/api';
import { useProfile, isEventPast } from '../lib/useProfile';
import StudentLayout from '../components/StudentLayout';
import { EventRow } from '../components/cards';
import { Loader, EmptyState, ErrorBanner, Modal, StarRating, Toast } from '../components/ui';
import { CalendarIcon, CheckIcon, MessageIcon, ClockIcon } from '../components/icons';

export default function Events() {
  const { loading, session, profile } = useProfile();
  const userId = session?.user?.id || null;

  const [events, setEvents] = useState([]);
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
    const [eventRows, feedbackRows] = await Promise.all([
      getVisibleEvents(), getOwnFeedback(userId),
    ]);
    setEvents(eventRows || []);
    setFeedback(feedbackRows || []);
  }, [userId]);

  const loadAll = useCallback(async () => {
    setDataLoading(true);
    setError('');
    try { await loadDynamic(); }
    catch (e) { setError(publicError(e, 'Could not load events.')); }
    finally { setDataLoading(false); }
  }, [loadDynamic]);

  useEffect(() => {
    if (loading) return undefined;
    const timer = setTimeout(() => { void loadAll(); }, 0);
    return () => clearTimeout(timer);
  }, [loading, loadAll]);


  const goingCount = useCallback((eid) => Number(events.find((e) => e.id === eid)?.going_count || 0), [events]);
  const amGoing = useCallback((eid) => !!events.find((e) => e.id === eid)?.i_am_going, [events]);
  const myFeedback = useCallback((eid) => feedback.find((f) => f.event_id === eid) || null, [feedback]);

  const toggleAttend = async (eid) => {
    if (!userId) return;
    setBusyId(eid);
    setError('');
    try { await toggleEventAttendance(eid); await loadDynamic(); }
    catch (e) { setError(publicError(e, 'Could not update your RSVP.')); }
    finally { setBusyId(null); }
  };

  const openFeedback = (ev) => {
    const existing = myFeedback(ev.id);
    setFbEvent(ev);
    setRating(existing?.rating || 0);
    setDidAttend(typeof existing?.did_attend === 'boolean' ? existing.did_attend : null);
    setComment(existing?.comment || '');
  };

  const submitFeedback = async () => {
    if (!userId || !fbEvent || !rating || didAttend === null) return;
    setSaving(true);
    setError('');
    try {
      await submitEventFeedback({ eventId: fbEvent.id, rating, comment: comment.trim(), didAttend });
      setFbEvent(null);
      setToast('Thanks for your feedback!');
      setTimeout(() => setToast(''), 3000);
      await loadDynamic();
    } catch (e) { setError(publicError(e, 'Could not submit feedback.')); }
    finally { setSaving(false); }
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
        title={fbEvent ? `Feedback: ${fbEvent.title}` : 'Feedback'}
        footer={(
          <>
            <button className="btn btn-ghost" onClick={() => setFbEvent(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitFeedback} disabled={!rating || didAttend === null || saving}>
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
            <button className={`choice ${didAttend === true ? 'on-yes' : ''}`} onClick={() => setDidAttend(true)}>Yes, I attended</button>
            <button className={`choice ${didAttend === false ? 'on-no' : ''}`} onClick={() => setDidAttend(false)}>No, I didn&apos;t</button>
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
