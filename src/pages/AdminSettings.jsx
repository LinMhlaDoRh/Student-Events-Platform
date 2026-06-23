import React from 'react';
import { useProfile } from '../lib/useProfile';
import AdminLayout from '../components/AdminLayout';
import { Loader, Badge } from '../components/ui';
import { prettyCampus, initials } from '../lib/format';
import { InfoIcon, MapPinIcon } from '../components/icons';

/*
  Settings.
  FLAG: the current system has no settings/config table, so there are no
  persisted, editable platform settings to expose. We show the signed-in admin
  account and read-only platform facts rather than fabricating toggles that
  wouldn't save anywhere.
*/
export default function AdminSettings() {
  const { loading, profile } = useProfile();

  if (loading) {
    return <AdminLayout profile={profile}><Loader full /></AdminLayout>;
  }

  return (
    <AdminLayout profile={profile}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Your admin account and platform information.</p>
        </div>
      </div>

      <div className="card card-pad" style={identityCard}>
        <span className="avatar" style={bigAvatar}>{initials(profile?.full_name, profile?.email)}</span>
        <div>
          <h2 style={nameText}>{profile?.full_name || 'Administrator'}</h2>
          <p className="page-sub" style={emailText}>{profile?.email}</p>
          <div style={chipRow}>
            <Badge tone="green">Admin</Badge>
            {profile?.campus ? <Badge tone="blue"><MapPinIcon size={12} /> {prettyCampus(profile.campus)}</Badge> : null}
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2 className="section-title">Platform</h2>
      </div>
      <div className="grid grid-2">
        <div className="card card-pad">
          <h3 className="section-title nomargin">Campuses</h3>
          <div style={chipRow}>
            <Badge tone="blue">Musgrave</Badge>
            <Badge tone="blue">uMhlanga</Badge>
          </div>
        </div>
        <div className="card card-pad">
          <h3 className="section-title nomargin">Platform</h3>
          <p className="page-sub" style={emailText}>Richfield Student Events Platform</p>
        </div>
      </div>

      <div className="notice notice-blue" style={noticeTop}>
        <InfoIcon size={16} />
        <span>Campuses and platform details are managed in code to keep the demo stable. Editable, database-backed settings are a planned enhancement.</span>
      </div>
    </AdminLayout>
  );
}

const identityCard = { display: 'flex', alignItems: 'center', gap: 18 };
const bigAvatar = { width: 60, height: 60, fontSize: 20, borderRadius: 16 };
const nameText = { fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' };
const emailText = { margin: '4px 0 0' };
const chipRow = { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' };
const noticeTop = { marginTop: 18 };
