import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/signin');
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  };

  if (loading) {
    return <div className="dashboard-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <button onClick={handleLogout} className="logout-btn">Sign out</button>
      </div>
      <div>
        <h3>Welcome, {user?.user_metadata?.full_name || user?.email}!</h3>
        <p>You have successfully logged in.</p>
        <p>Role: {user?.user_metadata?.role || 'student'}</p>
        <p>Campus: {user?.user_metadata?.campus || 'Not set'}</p>
      </div>
    </div>
  );
}
