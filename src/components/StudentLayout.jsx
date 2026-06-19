import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { prettyCampus, initials } from '../lib/format';
import {
  HomeIcon, LightbulbIcon, VoteIcon, CalendarIcon, UserIcon,
  LogOutIcon, MapPinIcon, PlusIcon, MenuIcon, LogoMark,
} from './icons';

const NAV = [
  { to: '/dashboard', label: 'Home', icon: HomeIcon, end: true },
  { to: '/suggestions', label: 'Suggestions', icon: LightbulbIcon },
  { to: '/vote', label: 'Active Polls', icon: VoteIcon },
  { to: '/events', label: 'Events', icon: CalendarIcon },
  { to: '/profile', label: 'My Profile', icon: UserIcon },
];

export default function StudentLayout({ profile, children }) {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const campus = prettyCampus(profile?.campus);

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/signin');
  }

  return (
    <div className={`app-shell ${navOpen ? 'nav-open' : ''}`}>
      <header className="app-topbar">
        <button className="menu-btn" onClick={() => setNavOpen((v) => !v)} aria-label="Toggle menu">
          <MenuIcon size={18} />
        </button>
        <div className="brand">
          <span className="brand-logo"><LogoMark /></span>
          <div>
            <div className="brand-name">Richfield Events</div>
            <div className="brand-sub">Student Events Platform</div>
          </div>
        </div>

        <div className="topbar-right">
          <span className="campus-badge"><MapPinIcon size={13} /> {campus}</span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/suggestions')}>
            <PlusIcon size={15} /> Suggest an Event
          </button>
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
          <div className="side-section-label">Account</div>
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

const btnReset = { width: '100%', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', textAlign: 'left' };
