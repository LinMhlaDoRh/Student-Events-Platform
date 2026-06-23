/**
 * Root component: Supabase session handling, role-based routing, and admin route guards.
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import Suggestions from './pages/Suggestions';
import Voting from './pages/Voting';
import Events from './pages/Events';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminSuggestions from './pages/AdminSuggestions';
import AdminEvents from './pages/AdminEvents';
import AdminFeedback from './pages/AdminFeedback';
import AdminStudents from './pages/AdminStudents';
import AdminSettings from './pages/AdminSettings';
import ResetPassword from './pages/ResetPassword';
import { supabase } from './supabaseClient';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './styles.css';
import './bolt-auth.css';
import './theme.css';

const naStyles = {
  container: { maxWidth: 520, margin: '80px auto', padding: '0 20px', textAlign: 'center' },
  heading: { marginBottom: 8 },
  link: { display: 'inline-block', marginTop: 16 },
};

// Admin route guard. Role is read from the trusted public.users table
// (loaded in App), never from client-writable user_metadata.
const AdminRoute = ({ session, role, children }) => {
  if (!session) return <Navigate to="/signin" replace />;

  // Role still resolving — render nothing to avoid a wrong "not authorised" flash.
  if (role === null) return null;

  if (role !== 'admin') {
    return (
      <div className="dashboard-container" style={naStyles.container}>
        <h2 style={naStyles.heading}>Not Authorised</h2>
        <p>You do not have permission to view the Admin Dashboard. Only SRC members can access this page.</p>
        <Link to="/dashboard" className="submit-btn" style={naStyles.link}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return children;
};

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadRole = async (sess) => {
      if (!sess?.user) {
        if (active) setRole(null);
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', sess.user.id)
        .single();
      if (!active) return;
      setRole(error ? 'student' : (data?.role || 'student'));
    };

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!active) return;
        setSession(session);
        await loadRole(session);
      })
      .catch((err) => {
        console.error('getSession failed:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadRole(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Wait for the session check AND the role lookup before rendering any route.
  // This stops a logged-in admin from briefly seeing the student dashboard
  // while their role is still loading after sign-in.
  if (loading || (session && role === null)) {
    return null; // Or a loading spinner
  }

  const homePath = role === 'admin' ? '/admin' : '/dashboard';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={!session ? <SignUp /> : <Navigate to={homePath} replace />} />
        <Route path="/signin" element={!session ? <SignIn /> : <Navigate to={homePath} replace />} />
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            !session ? (
              <Navigate to="/signin" replace />
            ) : role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : (
              <Dashboard />
            )
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute session={session} role={role}>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/suggestions"
          element={session ? <Suggestions /> : <Navigate to="/signin" replace />}
        />
        <Route
          path="/vote"
          element={session ? <Voting /> : <Navigate to="/signin" replace />}
        />
        <Route
          path="/events"
          element={session ? <Events /> : <Navigate to="/signin" replace />}
        />
        <Route
          path="/profile"
          element={session ? <Profile /> : <Navigate to="/signin" replace />}
        />
        <Route
          path="/admin/suggestions"
          element={
            <AdminRoute session={session} role={role}>
              <AdminSuggestions />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <AdminRoute session={session} role={role}>
              <AdminEvents />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/feedback"
          element={
            <AdminRoute session={session} role={role}>
              <AdminFeedback />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <AdminRoute session={session} role={role}>
              <AdminStudents />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute session={session} role={role}>
              <AdminSettings />
            </AdminRoute>
          }
        />
      </Routes>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}

export default App;
