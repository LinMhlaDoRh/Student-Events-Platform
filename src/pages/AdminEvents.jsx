/**
 * SRC admin events: create and manage scheduled events.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useProfile } from '../lib/useProfile';
import AdminLayout from '../components/AdminLayout';
import { Loader, EmptyState, ErrorBanner, Modal, Badge } from '../components/ui';
import { prettyScope, fmtDateTime, CATEGORY_LABELS, titleize } from '../lib/format';
import { CalendarIcon, PlusIcon, TrashIcon, UsersIcon, StarIcon } from '../components/icons';

const SCOPES = ['both', 'musgrave', 'umhlanga'];
const CATEGORIES = ['sports', 'social', 'academic', 'cultural', 'other'];
const STATUSES = ['upcoming', 'past', 'cancelled'];
const EMPTY_FORM = { title: '', description: '', campus_scope: 'both', category: 'other', event_date: '' };

export default function AdminEvents() {
  const { loading, profile } = useProfile();
  const [events, setEvents] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) { setError('Not connected to Supabase.'); setDataLoading(false); return; }
    setDataLoading(true);
    setError('');
    const [eRes, aRes, fRes, iRes] = await Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: false }),
      supabase.from('event_attendees').select('event_id'),
      supabase.from('feedback').select('event_id, rating, did_attend'),
      supabase.from('suggestions').select('id, text, campus, cluster_label').not('cluster_label', 'is', null),
    ]);
    if (eRes.error) setError(eRes.error.message);
    setEvents(eRes.data || []);
    setAttendees(aRes.data || []);
    setFeedback(fRes.data || []);
    setIdeas(iRes.data || []);
    setDataLoading(false);
  }, []);

  useEffect(() => { if (!loading) load(); }, [loading, load]);

  const goingCount = useCallback((eid) => attendees.filter((a) => a.event_id === eid).length, [attendees]);
  const fbSummary = useCallback((eid) => {
    const items = feedback.filter((f) => f.event_id === eid);
    if (items.length === 0) return null;
    const avg = items.reduce((s, f) => s + (f.rating || 0), 0) / items.length;
    return { avg: avg.toFixed(1), count: items.length };
  }, [feedback]);

  const pickIdea = (id) => {
    const idea = ideas.find((i) => i.id === id);
    if (!idea) return;
    setForm((f) => ({
      ...f,
      title: idea.cluster_label || f.title,
      description: idea.text || f.description,
      campus_scope: (idea.campus || '').toLowerCase() || 'both',
    }));
  };

  const createEvent = async () => {
    if (!supabase || !form.title.trim() || !form.event_date) return;
    setSaving(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      campus_scope: form.campus_scope,
      category: form.category,
      event_date: new Date(form.event_date).toISOString(),
      status: 'upcoming',
    };
    const { error: e } = await supabase.from('events').insert(payload);
    setSaving(false);
    if (e) { setError(e.message); return; }
    setOpen(false);
    setForm(EMPTY_FORM);
    load();
  };

  const changeField = async (id, field, value) => {
    if (!supabase) return;
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
    const { error: e } = await supabase.from('events').update({ [field]: value }).eq('id', id);
    if (e) { setError(e.message); load(); }
  };

  const deleteEvent = async (id) => {
    if (!supabase) return;
    const prev = events;
    setEvents((e) => e.filter((x) => x.id !== id));
    const { error: e } = await supabase.from('events').delete().eq('id', id);
    if (e) { setError(e.message); setEvents(prev); }
  };

  const valid = form.title.trim() && form.event_date;

  if (loading || dataLoading) {
    return <AdminLayout profile={profile}><Loader full /></AdminLayout>;
  }

  return (
    <AdminLayout profile={profile}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Polls &amp; Events</h1>
          <p className="page-sub">Confirm ideas into events, manage status and scope, and track attendance and feedback.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setOpen(true); }}>
          <PlusIcon size={16} /> Create Event
        </button>
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      {events.length === 0 ? (
        <EmptyState icon={<CalendarIcon size={22} />} title="No events yet" sub="Create an event from scratch or confirm one of the clustered student ideas." action={<button className="btn btn-primary" onClick={() => setOpen(true)}><PlusIcon size={15} /> Create Event</button>} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Scope</th>
                <th>Category</th>
                <th className="num">Going</th>
                <th>Feedback</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const fb = fbSummary(ev.id);
                return (
                  <tr key={ev.id}>
                    <td className="cell-idea">{ev.title}</td>
                    <td className="muted-cell">{fmtDateTime(ev.event_date)}</td>
                    <td>
                      <select className="select select-sm" value={ev.campus_scope || 'both'} onChange={(e) => changeField(ev.id, 'campus_scope', e.target.value)}>
                        {SCOPES.map((s) => <option key={s} value={s}>{prettyScope(s)}</option>)}
                      </select>
                    </td>
                    <td><Badge tone="gray">{CATEGORY_LABELS[ev.category] || titleize(ev.category)}</Badge></td>
                    <td className="num"><span className="attend-count"><UsersIcon size={13} /> {goingCount(ev.id)}</span></td>
                    <td>{fb ? <span className="attend-count"><StarIcon size={13} /> {fb.avg} ({fb.count})</span> : <span className="muted-cell">—</span>}</td>
                    <td>
                      <select className="select select-sm" value={ev.status || 'upcoming'} onChange={(e) => changeField(ev.id, 'status', e.target.value)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
                      </select>
                    </td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => deleteEvent(ev.id)}><TrashIcon size={13} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create event"
        sub="Confirm a clustered idea or start from scratch."
        footer={(
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createEvent} disabled={!valid || saving}>{saving ? <span className="spinner" /> : null} Create event</button>
          </>
        )}
      >
        {ideas.length > 0 ? (
          <div className="field">
            <label className="field-label">Confirm from a student idea <span className="optional">(optional)</span></label>
            <select className="select" defaultValue="" onChange={(e) => e.target.value && pickIdea(e.target.value)}>
              <option value="">Start from scratch…</option>
              {ideas.map((i) => <option key={i.id} value={i.id}>{i.cluster_label} — {i.text.slice(0, 50)}</option>)}
            </select>
          </div>
        ) : null}
        <div className="field">
          <label className="field-label">Title</label>
          <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Event title" />
        </div>
        <div className="field">
          <label className="field-label">Description <span className="optional">(optional)</span></label>
          <textarea className="textarea" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What's happening?" />
        </div>
        <div className="grid grid-2" style={modalGrid}>
          <div className="field">
            <label className="field-label">Campus scope</label>
            <select className="select" value={form.campus_scope} onChange={(e) => setForm((f) => ({ ...f, campus_scope: e.target.value }))}>
              {SCOPES.map((s) => <option key={s} value={s}>{prettyScope(s)}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Category</label>
            <select className="select" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c] || titleize(c)}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label className="field-label">Date &amp; time</label>
          <input className="input" type="datetime-local" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} />
        </div>
      </Modal>
    </AdminLayout>
  );
}

const modalGrid = { gap: 14 };
