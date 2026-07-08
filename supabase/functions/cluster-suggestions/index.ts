// Supabase Edge Function: cluster-suggestions
// -------------------------------------------------
// Triggered by the SRC admin "Analyse Suggestions" button. Sends every
// suggestion to Google Gemini Flash in ONE batched call, which:
//   1. groups similar/duplicate ideas under a shared cluster_label
//   2. assigns a category (sports | social | academic | cultural | other)
// ...then writes both back to the suggestions table.
//
// Secrets required (Dashboard -> Edge Functions -> Secrets, or `supabase secrets set`):
//   GEMINI_API_KEY   - your Google AI Studio key
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected
// automatically by Supabase; you do NOT set those yourself.

import { createClient } from 'npm:@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const CATEGORIES = ['sports', 'social', 'academic', 'cultural', 'other']
const MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash'
const MAX_SUGGESTIONS = 300

// Built from parts on purpose (kept as a single runtime URL).
const GEMINI_BASE = 'https' + '://generativelanguage.googleapis.com/v1beta/models/'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!GEMINI_API_KEY) {
      return json({ error: 'GEMINI_API_KEY is not set on this function.' }, 500)
    }

    // --- Verify the caller is an authenticated admin ------------------------
    const authHeader = req.headers.get('Authorization') || ''
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) return json({ error: 'Not authenticated.' }, 401)

    const { data: profile } = await userClient
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single()
    if (!profile || profile.role !== 'admin') return json({ error: 'Admins only.' }, 403)

    // --- Read suggestions as the admin. Their RLS access already permits
    // reading and updating every suggestion (the admin UI does the same). ---
    const { data: suggestions, error: sErr } = await userClient
      .from('suggestions')
      .select('id, text, campus')
      .order('created_at', { ascending: true })
      .limit(MAX_SUGGESTIONS)
    if (sErr) throw sErr
    if (!suggestions || suggestions.length === 0) {
      return json({ updated: 0, total: 0, message: 'No suggestions to analyse yet.' })
    }

    // --- One batched Gemini call -------------------------------------------
    const analysis = await analyse(suggestions)
    const byId = new Map(analysis.map((a) => [String(a.id), a]))

    let updated = 0
    for (const s of suggestions) {
      const a = byId.get(String(s.id))
      if (!a) continue
      const catRaw = (a.category || '').toString().toLowerCase().trim()
      const category = CATEGORIES.includes(catRaw) ? catRaw : 'other'
      const cluster_label = (a.cluster_label || '').toString().trim().slice(0, 60) || null
      const { error: uErr } = await userClient
        .from('suggestions')
        .update({ cluster_label, category })
        .eq('id', s.id)
      if (!uErr) updated++
    }

    return json({ updated, total: suggestions.length })
  } catch (e) {
    const msg = String((e as Error)?.message || e)
    console.error('cluster-suggestions failed:', msg)
    return json({ error: msg }, 500)
  }
})

async function analyse(
  suggestions: Array<{ id: unknown; text: string; campus: string }>,
): Promise<Array<{ id: unknown; cluster_label: string; category: string }>> {
  const list = suggestions.map((s) => ({ id: s.id, text: s.text, campus: s.campus }))

  const prompt = [
    'You organise student event suggestions for a university events platform with two campuses (Musgrave and uMhlanga).',
    'For the suggestions below:',
    '1. Group similar or duplicate ideas under ONE short shared cluster_label in Title Case (max 4 words).',
    '   Ideas about the same activity must share the EXACT same cluster_label, even across campuses (e.g. braai, cookout, outdoor fire -> Braai).',
    '2. Assign a category from EXACTLY this set: ' + CATEGORIES.join(', ') + '.',
    'Return ONLY valid JSON: an array where each element is {"id": <id>, "cluster_label": "...", "category": "..."}.',
    'Include every suggestion id exactly once. Do not add commentary.',
    '',
    'Suggestions:',
    JSON.stringify(list),
  ].join('\n')

  const endpoint = GEMINI_BASE + MODEL + ':generateContent?key=' + GEMINI_API_KEY
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('Gemini API error', res.status, body)
    throw new Error('Gemini API error ' + res.status + ' (model: ' + MODEL + '). ' + body.slice(0, 300))
  }
  const data = await res.json()
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  let parsed: unknown
  try {
    parsed = JSON.parse(txt)
  } catch {
    const m = txt.match(/\[[\s\S]*\]/)
    parsed = m ? JSON.parse(m[0]) : []
  }
  return Array.isArray(parsed) ? parsed : []
}
