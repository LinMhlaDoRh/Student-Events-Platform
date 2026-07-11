import { supabase } from '../supabaseClient';

function requireClient() {
  if (!supabase) throw new Error('The service is not configured.');
  return supabase;
}

function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

export async function getMySuggestions(userId) {
  if (!userId) return [];
  const client = requireClient();
  const round = unwrap(await client.from('suggestion_rounds').select('id').eq('active', true).maybeSingle());
  let query = client.from('suggestions').select('id,text,campus,cluster_label,status,category,anonymous,round_id,created_at,archived_at').eq('submitted_by', userId).is('archived_at', null).order('created_at', { ascending: false });
  if (round?.id) query = query.eq('round_id', round.id);
  return unwrap(await query);
}

export async function getCommunitySuggestions() {
  return unwrap(await requireClient().rpc('get_community_suggestions')) || [];
}

export async function submitSuggestion(text, anonymous) {
  return unwrap(await requireClient().rpc('submit_suggestion', { p_text: text, p_anonymous: !!anonymous }));
}

export async function withdrawSuggestion(id) {
  unwrap(await requireClient().rpc('withdraw_suggestion', { p_suggestion_id: id }));
}

export async function getActivePolls() {
  return unwrap(await requireClient().rpc('get_active_polls')) || [];
}

export async function toggleInterest(id) {
  return unwrap(await requireClient().rpc('toggle_interest', { p_suggestion_id: id }));
}

export async function getVisibleEvents() {
  return unwrap(await requireClient().rpc('get_visible_events')) || [];
}

export async function toggleEventAttendance(id) {
  return unwrap(await requireClient().rpc('toggle_event_attendance', { p_event_id: id }));
}

export async function submitEventFeedback({ eventId, rating, comment, didAttend }) {
  return unwrap(await requireClient().rpc('submit_event_feedback', {
    p_event_id: eventId,
    p_rating: rating,
    p_comment: comment || null,
    p_did_attend: didAttend,
  }));
}

export async function getAdminSuggestions() {
  return unwrap(await requireClient().rpc('admin_list_suggestions')) || [];
}

export async function updateAdminSuggestion({ id, clusterLabel = null, status = null, category = null, reason = null }) {
  unwrap(await requireClient().rpc('admin_update_suggestion', {
    p_id: id,
    p_cluster_label: clusterLabel,
    p_status: status,
    p_category: category,
    p_reason: reason,
  }));
}

export async function getOwnFeedback(userId) {
  if (!userId) return [];
  return unwrap(await requireClient().from('feedback').select('id,event_id,rating,comment,did_attend,created_at').eq('user_id', userId));
}

export function publicError(error, fallback = 'Something went wrong. Please try again.') {
  const message = String(error?.message || '');
  if (/too many requests/i.test(message)) return 'Too many requests. Please wait and try again.';
  if (/already submitted/i.test(message)) return 'You have already submitted an idea in this round.';
  if (/not open|not active|currently closed/i.test(message)) return message;
  if (/not authenticated|authentication required|jwt/i.test(message)) return 'Your session expired. Please sign in again.';
  return fallback;
}
