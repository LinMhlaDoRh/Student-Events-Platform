/**
 * Reusable card components shared across pages.
 */

import React from 'react';
import { prettyScope, fmtDateTime, CATEGORY_LABELS, titleize } from '../lib/format';
import { CalendarIcon, UsersIcon, HeartIcon, CheckIcon } from './icons';

// Style objects are hoisted so JSX receives a single-brace reference; see ui.jsx for context.
const descStyle = {
  fontSize: 13, color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.5,
  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
};
const labelBadge = { marginBottom: 12, alignSelf: 'flex-start' };

/*
  A poll card maps to one clustered suggestion (an idea the SRC has grouped).
  The only real demand signal in the system is "Interested" — there is no
  "I'll attend" at the poll stage (attendance happens later on confirmed
  events), so we surface the real interested count + toggle only.
*/
export function PollCard({ idea, label, description, campus, interested, similar, active, busy, onToggle }) {
  return (
    <div className="card card-hover poll-card">
      <div className="poll-head">
        <h3 className="poll-title">{idea}</h3>
        {campus ? <span className="badge badge-blue">{campus}</span> : null}
      </div>
      {label ? <span className="badge badge-gray" style={labelBadge}>{label}</span> : null}
      <p className="poll-desc">{description}</p>
      <div className="poll-stats">
        <div className={`poll-stat ${active ? 'is-on' : ''}`}>
          <div className="n">{interested}</div>
          <div className="l">Interested</div>
        </div>
        {typeof similar === 'number' ? (
          <div className="poll-stat">
            <div className="n">{similar}</div>
            <div className="l">Similar ideas</div>
          </div>
        ) : null}
      </div>
      <div className="poll-actions">
        <button
          className={`btn btn-block ${active ? 'btn-secondary' : 'btn-primary'}`}
          disabled={busy}
          onClick={onToggle}
        >
          {active ? <><CheckIcon size={15} /> Interested</> : <><HeartIcon size={15} /> I&apos;m Interested</>}
        </button>
      </div>
    </div>
  );
}

export function EventRow({ event, goingCount, right, showDescription = true }) {
  return (
    <div className="card event-row card-hover">
      <div className="event-main">
        <p className="event-title">{event.title}</p>
        <div className="event-meta">
          <span className="badge badge-blue">{prettyScope(event.campus_scope)}</span>
          <span className="badge badge-gray">{CATEGORY_LABELS[event.category] || titleize(event.category)}</span>
          <span className="attend-count"><CalendarIcon size={13} /> {fmtDateTime(event.event_date)}</span>
        </div>
        {showDescription && event.description ? <p style={descStyle}>{event.description}</p> : null}
      </div>
      <div className="event-right">
        <span className="attend-count"><UsersIcon size={14} /> {goingCount} going</span>
        {right || null}
      </div>
    </div>
  );
}
