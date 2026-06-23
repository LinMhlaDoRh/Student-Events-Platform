import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, GraduationCap, Shield } from 'lucide-react';
import { supabase } from '../supabaseClient';

const DEMO_PASSWORD = 'demo1234';
const DEMO_STUDENT_EMAIL = 'student.demo@richfield.ac.za';
const DEMO_ADMIN_EMAIL = 'admin.demo@richfield.ac.za';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!email.trim()) { setError("Email address is required."); return; }
    if (!password) { setError("Password is required."); return; }
    if (!supabase) { setError("Authentication is not configured. Please try again later."); return; }
    
    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) throw signInError;
      // Where to send the user (admin vs. student) is decided centrally in
      // App.jsx once the session and role have resolved. Navigating here would
      // race that and briefly flash the student dashboard for admins.
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function demoLogin(kind) {
    setError("");
    setNotice("");
    if (!supabase) { setError("Authentication is not configured. Please try again later."); return; }
    const creds = kind === 'admin'
      ? { email: DEMO_ADMIN_EMAIL, password: DEMO_PASSWORD }
      : { email: DEMO_STUDENT_EMAIL, password: DEMO_PASSWORD };
    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword(creds);
      if (signInError) throw signInError;
    } catch (err) {
      setError("This demo account is not set up yet -- create it once (see supabase/demo-seed.sql), then this button works.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setNotice("");
    if (!email.trim()) { setError('Enter your email above first, then tap "Forgot password?".'); return; }
    if (!supabase) { setError("Authentication is not configured. Please try again later."); return; }
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (resetError) throw resetError;
      setNotice("Password reset link sent. Please check your email.");
    } catch (err) {
      setError(err.message || "Could not send reset email. Please try again.");
    }
  }

  return (
    <div className="bolt-auth-page">
      {/* Left panel */}
      <div className="bolt-left-panel">
        <div className="bolt-bg-pattern" />
        
        <div className="bolt-logo-header">
          <div className="bolt-logo-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L9.5 5.5H12L9 8.5L10 12.5L7 10L4 12.5L5 8.5L2 5.5H4.5L7 1Z" fill="white" />
            </svg>
          </div>
          <span className="bolt-logo-text">Richfield Events</span>
        </div>

        <div style={{ position: 'relative' }}>
          <div className="bolt-hero-text">
            <h1>
              Students propose.<br />
              The campus votes.<br />
              <span>SRC makes it happen.</span>
            </h1>
            <p className="bolt-hero-desc">
              A shared platform for Musgrave and Umhlanga students to surface event demand and turn it into reality.
            </p>
          </div>

          <div className="bolt-role-info-container">
            <div className="bolt-role-info">
              <div className="bolt-role-icon"><GraduationCap size={13} /></div>
              <div>
                <p className="bolt-role-title">Students</p>
                <p className="bolt-role-desc">Propose ideas, vote on events, and commit to attending across both campuses.</p>
              </div>
            </div>
            <div className="bolt-role-info">
              <div className="bolt-role-icon"><Shield size={13} /></div>
              <div>
                <p className="bolt-role-title">SRC Members</p>
                <p className="bolt-role-desc">Review demand signals and coordinate outcomes with school management.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bolt-credit">Built by LinMhlaDoRh</div>
      </div>

      {/* Right form panel */}
      <div className="bolt-right-panel">
        <div className="bolt-mobile-logo">
          <div className="bolt-logo-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L9.5 5.5H12L9 8.5L10 12.5L7 10L4 12.5L5 8.5L2 5.5H4.5L7 1Z" fill="white" />
            </svg>
          </div>
          <span className="bolt-logo-text">Richfield Events</span>
        </div>

        <div className="bolt-auth-form-container">
          <div className="bolt-auth-heading">
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          {error && (
            <div className="bolt-error">
              <AlertCircle size={14} className="bolt-error-icon" />
              {error}
            </div>
          )}
          {notice && (
            <div className="bolt-success">
              <CheckCircle size={14} className="bolt-error-icon" />
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bolt-form">
            <div className="bolt-field">
              <label className="bolt-label">Email</label>
              <div className="bolt-input-wrap">
                <Mail size={14} className="bolt-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="bolt-input"
                />
              </div>
            </div>

            <div className="bolt-field">
              <div className="bolt-label-row">
                <label className="bolt-label">Password</label>
                <button
                  type="button"
                  className="bolt-forgot-password"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
              <div className="bolt-input-wrap">
                <Lock size={14} className="bolt-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="bolt-input"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="bolt-password-toggle"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bolt-submit-btn"
            >
              {isLoading ? (
                <div className="bolt-spinner" />
              ) : (
                <>Sign in <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          <div className="bolt-demo">
            <div className="bolt-demo-divider"><span>or explore the demo</span></div>
            <div className="bolt-demo-row">
              <button type="button" className="bolt-demo-btn" disabled={isLoading} onClick={() => demoLogin('student')}>
                <GraduationCap size={14} /> Explore as Student
              </button>
              <button type="button" className="bolt-demo-btn" disabled={isLoading} onClick={() => demoLogin('admin')}>
                <Shield size={14} /> Explore as SRC Admin
              </button>
            </div>
            <p className="bolt-demo-note">Pre-loaded demo data, no sign-up needed</p>
          </div>

          <p className="bolt-auth-link">
            No account yet?{" "}
            <Link to="/signup">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
