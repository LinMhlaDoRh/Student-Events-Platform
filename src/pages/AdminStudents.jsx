/**
 * SRC admin students: directory of registered students per campus.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useProfile } from '../lib/useProfile';
import AdminLayout from '../components/AdminLayout';
import { Loader, EmptyState, ErrorBanner, Badge } from '../components/ui';
import { prettyCampus, fmtDate, initials } from '../lib/format';
import { UsersIcon, InfoIcon } from '../components/icons';

/*
  Students roster.
  FLAG: the `users` table currently has own-profile-only RLS, so a non-elevated
  admin client typically cannot read other students' rows. We query honestly and
  render whatever the policy returns — no fabricated roster. If only the admin's
  own row comes back, we surface a clear notice rather than inventing data.
*/
export default function AdminStudents() {
  const { loading, profile } = useProfile();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) { setError('Not connected to Supabase.'); setDataLoading(false); return; }
    setDataLoading(true);
    setError('');
    const { data, error: e } = await supabase
      .from('users')
      .select('id, full_name, email, campus, role, created_at')
      .order('created_at', { ascending: false }).limit(500);
    if (e) setError(e.message);
    setRows(data || []);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return undefined;
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [loading, load]);

  const restricted = useMemo(() => rows.length <= 1, [rows]);

  if (loading || dataLoading) {
    return <AdminLayout profile={profile}><Loader full /></AdminLayout>;
  }

  return (
    <AdminLayout profile={profile}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-sub">Registered students across both campuses.</p>
        </div>
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      {restricted ? (
        <div className="notice notice-blue">
          <InfoIcon size={16} />
          <span>The student roster isn&apos;t available with the current database access rules (profiles are readable only by their owner). Enable an admin read policy on the users table to populate this list — no placeholder data is shown.</span>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState icon={<UsersIcon size={22} />} title="No students to show" sub="Once an admin read policy is in place, registered students will appear here." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Campus</th><th>Role</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="cell-name"><span className="avatar sm">{initials(u.full_name, u.email)}</span> {u.full_name || '—'}</td>
                  <td className="muted-cell">{u.email}</td>
                  <td><Badge tone="blue">{prettyCampus(u.campus)}</Badge></td>
                  <td><Badge tone={u.role === 'admin' ? 'green' : 'gray'}>{u.role || 'student'}</Badge></td>
                  <td className="muted-cell">{u.created_at ? fmtDate(u.created_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
