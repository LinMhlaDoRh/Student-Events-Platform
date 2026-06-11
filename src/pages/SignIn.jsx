import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      if (data.user) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2 className="auth-title">Welcome back</h2>
      <p className="auth-subtitle">Sign in to your account</p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSignIn}>
        <div className="form-group">
          <label className="form-label">EMAIL</label>
          <div className="input-wrapper">
            <Mail size={18} className="input-icon" />
            <input 
              type="email" 
              className="form-input" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>PASSWORD</label>
            <Link to="#" className="auth-link" style={{ fontSize: '0.8rem' }}>Forgot password?</Link>
          </div>
          <div className="input-wrapper">
            <Lock size={18} className="input-icon" />
            <input 
              type={showPassword ? "text" : "password"} 
              className="form-input" 
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              className="input-action"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'} <ArrowRight size={16} />
        </button>

        <div className="auth-footer">
          No account yet? <Link to="/signup" className="auth-link">Create one</Link>
        </div>
      </form>
    </div>
  );
}
