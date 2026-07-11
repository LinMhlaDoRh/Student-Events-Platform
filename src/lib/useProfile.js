/**
 * Loads the signed-in user's session and profile from the public.users table.
 *
 * Role and campus are read from the trusted server-side row. If the row is
 * absent (e.g. during the brief window after signup), auth user_metadata
 * provides a fallback for name and campus only — role always defaults to
 * 'student' when no database record exists.
 *
 * Returns { loading, session, profile }.
 */

import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useProfile() {
  const [loading, setLoading] = useState(() => !!supabase);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const loadProfile = async (sess) => {
      if (!sess?.user) {
        if (active) { setProfile(null); }
        return;
      }
      const meta = sess.user.user_metadata || {};
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, campus, role, created_at')
        .eq('id', sess.user.id)
        .single();
      if (!active) return;
      if (error || !data) {
        setProfile({
          id: sess.user.id,
          email: sess.user.email,
          full_name: meta.full_name || meta.name || '',
          campus: (meta.campus || '').toLowerCase() || null,
          role: 'student',
          created_at: sess.user.created_at || null,
        });
      } else {
        setProfile({
          ...data,
          full_name: data.full_name || meta.full_name || meta.name || '',
          email: data.email || sess.user.email,
          role: data.role || 'student',
        });
      }
    };

    supabase.auth
      .getSession()
      .then(async ({ data: { session: s } }) => {
        if (!active) return;
        setSession(s);
        await loadProfile(s);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, next) => {
      setSession(next);
      loadProfile(next);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { loading, session, profile };
}

/*
  isEventPast(ev)
  An event is "past" when its status is explicitly 'past', OR when it is not
  cancelled and its event_date is before now.
*/
export function isEventPast(ev) {
  if (!ev) return false;
  if (ev.status === 'past') return true;
  if (ev.status === 'cancelled') return false;
  if (!ev.event_date) return false;
  return new Date(ev.event_date).getTime() < Date.now();
}
