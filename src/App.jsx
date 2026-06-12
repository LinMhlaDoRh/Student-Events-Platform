import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import { supabase } from './supabaseClient';
import './styles.css';
import './bolt-auth.css';

// Admin Route Guard
const AdminRoute = ({ session, children }) => {
  if (!session) return <Navigate to="/signin" />;
  
  const role = session.user?.user_metadata?.role;
  
  if (role !== 'admin') {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ color: 'var(--error-color)' }}>Not Authorised</h2>
        <p>You do not have permission to view the Admin Dashboard. Only SRC members can access this page.</p>
        <Link to="/dashboard" className="submit-btn" style={{ maxWidth: '200px', margin: '2rem auto' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }
  
  return children;
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={!session ? <SignUp /> : <Navigate to="/dashboard" />} />
        <Route path="/signin" element={!session ? <SignIn /> : <Navigate to="/dashboard" />} />
        <Route path="/" element={<Navigate to="/signup" />} />
        
        {/* Student Dashboard */}
        <Route 
          path="/dashboard" 
          element={session ? <Dashboard /> : <Navigate to="/signin" />} 
        />
        
        {/* Admin Dashboard */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute session={session}>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
