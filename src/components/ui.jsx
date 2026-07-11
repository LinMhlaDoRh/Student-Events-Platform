/**
 * Reusable UI primitives (loader, cards, badges, charts, modal, toasts, etc.).
 */

import React, { useEffect } from 'react';
import { XIcon } from './icons';

/*
  Shared UI primitives. IMPORTANT: never use inline `style= ... ` double
  braces in this codebase — the build pipeline mangles them. Use CSS classes
  (see theme.css) or module-level style constants referenced with single braces.
*/

const ST = {
  loaderInline: { display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 14, padding: 24 },
  donutCenter: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' },
  donutNum: { fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' },
  donutLbl: { fontSize: 11.5, color: 'var(--muted)' },
};

/* ---- Spinner / full-screen loader ---- */
export function Loader({ full = false, label }) {
  if (full) {
    return (
      <div className="center-screen">
        <span className="spinner lg" />
      </div>
    );
  }
  return (
    <div style={ST.loaderInline}>
      <span className="spinner" /> {label || 'Loading…'}
    </div>
  );
}

/* ---- Error banner ---- */
export function ErrorBanner({ children }) {
  if (!children) return null;
  return <div className="error-banner">{children}</div>;
}

/* ---- Badge ---- */
export function Badge({ children, tone = 'gray', className = '' }) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>;
}

/* ---- Empty state ---- */
export function EmptyState({ icon, title, sub, action, small = false }) {
  return (
    <div className={`empty ${small ? 'sm' : ''}`}>
      {icon ? <div className="empty-ico">{icon}</div> : null}
      <h3 className="empty-title">{title}</h3>
      {sub ? <p className="empty-sub">{sub}</p> : null}
      {action || null}
    </div>
  );
}

/* ---- Stat card ---- */
export function StatCard({ icon, value, label, delta }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-ico">{icon}</span>
        {delta ? <span className="stat-delta">{delta}</span> : null}
      </div>
      <div className="stat-num">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ---- Modal ---- */
export function Modal({ open, onClose, title, sub, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h3 className="modal-title">{title}</h3>
            {sub ? <p className="modal-sub">{sub}</p> : null}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><XIcon size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ---- Toggle switch ---- */
export function Switch({ checked, onChange, label }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track"><span className="knob" /></span>
      {label ? <span className="switch-label">{label}</span> : null}
    </label>
  );
}

/* ---- Star rating ---- */
export function StarRating({ value = 0, onChange, display = false }) {
  return (
    <div className={`stars ${display ? 'display' : ''}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star ${n <= Math.round(value) ? 'on' : ''}`}
          disabled={display}
          onClick={display ? undefined : () => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ---- Toast ---- */
export function Toast({ show, children }) {
  if (!show) return null;
  return <div className="toast">{children}</div>;
}

/* ---- Donut chart (multi-segment, pure SVG) ---- */
export function Donut({ segments, size = 132, thickness = 18, center }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const plottedSegments = segments.reduce((acc, seg, index) => {
    const prevOffset = acc.length ? acc[acc.length - 1].nextOffset : 0;
    const len = (seg.value / total) * circ;
    acc.push({ ...seg, index, len, offset: prevOffset, nextOffset: prevOffset + len });
    return acc;
  }, []);
  const wrap = { position: 'relative', width: size, height: size, flex: 'none' };
  return (
    <div style={wrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f6" strokeWidth={thickness} />
        {plottedSegments.map((seg) => (
          <circle
            key={seg.index}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${seg.len} ${circ - seg.len}`}
            strokeDashoffset={-seg.offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
      </svg>
      {center != null ? (
        <div style={ST.donutCenter}>
          <div>
            <div style={ST.donutNum}>{center.value}</div>
            <div style={ST.donutLbl}>{center.label}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
