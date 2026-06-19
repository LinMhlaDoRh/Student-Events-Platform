/* Shared formatting + small helpers used across the platform. */

/* Campus is stored lowercase in Supabase ('musgrave' | 'umhlanga'). */
export function prettyCampus(raw) {
  const c = (raw || '').toLowerCase();
  if (c === 'musgrave') return 'Musgrave';
  if (c === 'umhlanga') return 'uMhlanga';
  return raw || 'Richfield';
}

/* Event campus_scope ('both' | 'musgrave' | 'umhlanga'). */
export function prettyScope(s) {
  if (s === 'both') return 'Both Campuses';
  if (s === 'musgrave') return 'Musgrave';
  if (s === 'umhlanga') return 'uMhlanga';
  return s || '—';
}

export function fmtDate(d) {
  if (!d) return 'Date TBA';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return 'Date TBA';
  return dt.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(d) {
  if (!d) return 'Date TBA';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return 'Date TBA';
  return dt.toLocaleString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function fmtShortDay(d) {
  if (!d) return 'TBA';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return 'TBA';
  return dt.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function initials(name, email) {
  const src = (name || '').trim() || (email || '').split('@')[0] || '?';
  const parts = src.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function firstName(name, email) {
  const raw = (name || '').trim() || (email || 'there');
  return raw.split('@')[0].split(/[\s._-]+/)[0];
}

/* Title-case a category / status token for display. */
export function titleize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const CATEGORY_LABELS = {
  sports: 'Sports',
  social: 'Social',
  academic: 'Academic',
  cultural: 'Cultural',
  other: 'Other',
};

export const SUGGESTION_STATUS = {
  submitted: { label: 'Submitted', cls: 'badge-gray' },
  review: { label: 'Under Review', cls: 'badge-blue' },
  considering: { label: 'Considering', cls: 'badge-amber' },
  approved: { label: 'Approved', cls: 'badge-green' },
  rejected: { label: 'Rejected', cls: 'badge-red' },
};
