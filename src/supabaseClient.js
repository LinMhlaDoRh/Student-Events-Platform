/**
 * Supabase client singleton. Only the public project URL and anon key belong in
 * the browser. Authorization is enforced by RLS and narrow database functions.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: { 'X-Client-Info': 'student-events-web/1.0' },
      },
    })
  : null
