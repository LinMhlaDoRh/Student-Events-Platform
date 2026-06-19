import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useProfile } from '../lib/useProfile';
import AdminLayout from '../components/AdminLayout';
import { Loader, EmptyState, ErrorBanner, Badge } from '../components/ui';
import { prettyCampus, fmtDate, SUGGESTION_STATUS, CATEGORY_LABELS } from '../lib/format';
import { LightbulbIcon, SearchIcon, TrashIcon, CheckIcon, SparkleIcon } from '../components/icons';

const STATUS_OPTIONS = ['submitted', 'review', 'considering', 'approved', 'rejected'];
const CAMPUS_TABS = [
  { key: 'all', label: 'All campuses' },
  { key: 'musgrave', label: 'Musgrave' },
  { key: 'umhlanga', label: 'uMhlanga' },
];
const ANON_TAG = { marginLeft: 8, verticalAlign: 'middle' };

export default function AdminSuggestions() {
  const { loading, profile } = useProfile();
  const [rows, setRows] = useState([]);
  const [votes, setVotes] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [campus, setCampus] = useState('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) { setError('Not connected to Supabase.'); setDataLoading(false); return; }
    setDataLoading(true);
    setError('');
    const [sRes, vRes] = await Promise.all([
      supabase.from('suggestions').select('*').order('created_at', { ascending: false }),
      supabase.from('votes').select('suggestion_id, vote_type'),
    ]);
    if (sRes.error) setError(sRes.error.message);
    setRows(sRes.data || []);
    setVotes(vRes.data || []);
    const d = {};
    (sRes.data || []).forEach((r) => { d[r.id] = r.cluster_label || ''; });
    setDrafts(d);
    setDataLoading(false);
  }, []);

  useEffect(() => { if (!loading) load(); }, [loading, load]);

  const countFor = useCallback(
    (sid) => votes.filter((v) => v.suggestion_id === sid && v.vote_type === 'interested').length,
    [votes],
  );

  const saveCluster = async (id) => {
    if (!supabase) return;
    setBusyId(id);
    setError('');
    const value = (drafts[id] || '').trim() || null;
    const { error: e } = await supabase.from('suggestions').update({ cluster_label: value }).eq('id', id);
    if (e) setError(e.message);
    else setRows((prev) => prev.map((r) => (r.id === id ? { ...r, cluster_label: value } : r)));
    setBusyId(null);
  };

  const changeStatus = async (id, status) => {
    if (!supabase) return;
    setError('');
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error: e } = await supabase.from('suggestions').update({ status }).eq('id', id);
    if (e) { setError(e.message); load(); }
  };

  const deleteSuggestion = async (id) => {
    if (!supabase) return;
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== id));
    const { error: e } = await supabase.from('suggestions').delete().eq('id', id);
    if (e) { setError(e.message); setRows(prev); }
  };

  const analyse = async () => {
    if (!supabase) return;
    setAnalysing(true);
    setError('');
    const { data, error: e } = await supabase.functions.invoke('cluster-suggestions');
    setAnalysing(false);
    if (e) { setError(e.message || 'AI analysis failed. Is the Edge Function deployed?'); return; }
    if (data?.error) { setError(data.error); return; }
    await load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (campus !== 'all' && (r.campus || '').toLowerCase() !== campus) return false;
      if (q && !(`${r.text} ${r.cluster_label || ''}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, campus, search]);

  if (loading || dataLoading) {
    return <AdminLayout profile={profile}><Loader full /></AdminLayout>;
  }

  return (
    <AdminLayout profile={profile}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Suggestions</h1>
          <p className="page-sub">Review student ideas, group them with a cluster label, and move them through the pipeline.</p>
        </div>
        <button className="btn btn-secondary" onClick={analyse} disabled={analysing} title="Group similar ideas and auto-tag categories with AI">
          {analysing ? <span className="spinner" /> : <SparkleIcon size={15} />} {analysing ? 'Analysing…' : 'Analyse Suggestions'}
        </button>
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      <div className="toolbar">
        <div className="tabs">
          {CAMPUS_TABS.map((t) => (
            <button key={t.key} className={`tab ${campus === t.key ? 'active' : ''}`} onClick={() => setCampus(t.key)}>{t.label}</button>
          ))}
        </div>
        <div className="search-box">
          <SearchIcon size={15} />
          <input className="search-input" placeholder="Search ideas…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<LightbulbIcon size={22} />} title="No suggestions" sub="Student suggestions will appear here as they are submitted." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Idea</th>
                <th>Campus</th>
                <th>Cluster label</th>
                <th>Category</th>
                <th className="num">Interested</th>
                <th>Status</th>
                <th>Submitted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const dirty = (drafts[r.id] || '') !== (r.cluster_label || '');
                return (
                  <tr key={r.id}>
                    <td className="cell-idea">{r.text}{r.anonymous ? <span style={ANON_TAG}><Badge tone="gray">Anonymous</Badge></span> : null}</td>
                    <td><Badge tone="blue">{prettyCampus(r.campus)}</Badge></td>
                    <td>
                      <div className="inline-edit">
                        <input
                          className="input input-sm"
                          placeholder="Add label…"
                          value={drafts[r.id] || ''}
                          onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                        />
                        <button className="btn btn-primary btn-sm" disabled={!dirty || busyId === r.id} onClick={() => saveCluster(r.id)}>
                          <CheckIcon size={13} />
                        </button>
                      </div>
                    </td>
                    <td>{r.category ? <Badge tone="blue">{CATEGORY_LABELS[r.category] || r.category}</Badge> : <span className="muted-cell">&mdash;</span>}</td>
                    <td className="num">{countFor(r.id)}</td>
                    <td>
                      <select className="select select-sm" value={r.status || 'submitted'} onChange={(e) => changeStatus(r.id, e.target.value)}>
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{(SUGGESTION_STATUS[s] || {}).label || s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="muted-cell">{fmtDate(r.created_at)}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteSuggestion(r.id)}><TrashIcon size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
