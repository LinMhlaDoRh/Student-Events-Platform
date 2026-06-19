import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { initials } from '../lib/format';
import {
  LayoutIcon, LightbulbIcon, CalendarIcon, MessageIcon, UsersIcon,
  SettingsIcon, LogOutIcon, MenuIcon, LogoMark,
} from './icons';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutIcon, end: true },
  { to: '/admin/suggestions', label: 'Suggestions', icon: LightbulbIcon },
  { to: '/admin/events', label: 'Polls & Events', icon: CalendarIcon },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageIcon },
  { to: '/admin/students', label: 'Students', icon: UsersIcon },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

const btnReset = { width: '100%', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', textAlign: 'left' };

export default function AdminLayout({ profile, children }) {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/signin');
  }

  return (
    <div className={`app-shell admin ${navOpen ? 'nav-open' : ''}`}>
      <header className="app-topbar">
        <button className="menu-btn" onClick={() => setNavOpen((v) => !v)} aria-label="Toggle menu">
          <MenuIcon size={18} />
        </button>
        <div className="brand">
          <span className="brand-logo"><LogoMark /></span>
          <div>
            <div className="brand-name">Richfield Events</div>
            <div className="brand-sub">Admin Console</div>
          </div>
        </div>
        <div className="topbar-right" style={pushRight}>
          <span className="badge badge-blue">Administrator</span>
          <span className="avatar" title={profile?.full_name || profile?.email}>
            {initials(profile?.full_name, profile?.email)}
          </span>
        </div>
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          <nav>
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
                onClick={() => setNavOpen(false)}
              >
                <n.icon size={18} /> {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="admin-account">
            <span className="avatar">{initials(profile?.full_name, profile?.email)}</span>
            <div style={grow}>
              <div className="nm">{profile?.full_name || 'Admin'}</div>
              <div className="rl">{profile?.email}</div>
            </div>
          </div>
          <button className="side-link" onClick={signOut} style={btnReset}>
            <LogOutIcon size={18} /> Sign out
          </button>
        </aside>

        <div className="scrim" onClick={() => setNavOpen(false)} />
        <main className="app-main">
          <div className="page-pad">{children}</div>
        </main>
      </div>
    </div>
  );
}

const pushRight = { marginLeft: 'auto' };
const grow = { minWidth: 0, flex: 1 };
