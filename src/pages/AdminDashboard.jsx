import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Admin Dashboard (SRC)</h2>
        <button onClick={handleLogout} className="logout-btn">Sign out</button>
      </div>
      <div>
        <h3>Welcome, Admin!</h3>
        <p>This page is strictly restricted to SRC Members.</p>
        <p>From here, you will eventually be able to view raw suggestions, trigger AI clustering, and manage confirmed events.</p>
      </div>
    </div>
  );
}
