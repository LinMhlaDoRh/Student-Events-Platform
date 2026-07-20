/**
 * Sign-in screen: email/password auth and password reset request.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, GraduationCap, Shield } from 'lucide-react';
import { supabase } from '../supabaseClient';

const GITHUB_ICON = (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const LOGO_MARK = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 1L9.5 5.5H12L9 8.5L10 12.5L7 10L4 12.5L5 8.5L2 5.5H4.5L7 1Z" fill="white" />
  </svg>
);

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!password) { setError('Password is required.'); return; }
    if (!supabase) { setError('Authentication is not configured. Please try again later.'); return; }

    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      // App.jsx routes by role after session resolves.
    } catch {
      setError('Sign-in failed. Check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Enter your email above first, then tap "Forgot password?".');
      return;
    }
    if (!supabase) {
      setError('Authentication is not configured. Please try again later.');
      return;
    }
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setNotice('If an account exists for that email, a reset link will be sent.');
    } catch {
      setNotice('If an account exists for that email, a reset link will be sent.');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left-panel">
        <div className="auth-bg-pattern" />

        <div className="auth-logo-header">
          <div className="auth-logo-icon">{LOGO_MARK}</div>
          <span className="auth-logo-text">Student Events</span>
        </div>

        <div className="auth-hero">
          <div className="auth-hero-text">
            <h1>
              Students propose.<br />
              The campus votes.<br />
              <span>SRC makes it happen.</span>
            </h1>
            <p className="auth-hero-desc">
              A shared platform for Musgrave and uMhlanga students to surface event demand and turn it into reality.
            </p>
          </div>

          <div className="auth-role-info-container">
            <div className="auth-role-info">
              <div className="auth-role-icon"><GraduationCap size={13} /></div>
              <div>
                <p className="auth-role-title">Students</p>
                <p className="auth-role-desc">Propose ideas, vote on events, and commit to attending across both campuses.</p>
              </div>
            </div>
            <div className="auth-role-info">
              <div className="auth-role-icon"><Shield size={13} /></div>
              <div>
                <p className="auth-role-title">SRC Members</p>
                <p className="auth-role-desc">Review demand signals and coordinate outcomes with school management.</p>
              </div>
            </div>
          </div>
        </div>

        <a className="auth-credit" href="https://github.com/LinMhlaDoRh" target="_blank" rel="noreferrer">
          {GITHUB_ICON} Built by LinMhlaDoRh
        </a>
      </div>

      <div className="auth-right-panel">
        <div className="auth-mobile-logo">
          <div className="auth-logo-icon">{LOGO_MARK}</div>
          <span className="auth-logo-text">Student Events</span>
        </div>

        <div className="auth-form-container">
          <div className="auth-heading">
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={14} className="auth-error-icon" />
              {error}
            </div>
          )}
          {notice && (
            <div className="auth-success">
              <CheckCircle size={14} className="auth-error-icon" />
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="signin-email">Email</label>
              <div className="auth-input-wrap">
                <Mail size={14} className="auth-input-icon" />
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="signin-password">Password</label>
                <button type="button" className="auth-forgot-password" onClick={handleForgotPassword}>
                  Forgot password?
                </button>
              </div>
              <div className="auth-input-wrap">
                <Lock size={14} className="auth-input-icon" />
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="auth-input has-toggle"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="auth-submit-btn">
              {isLoading ? <div className="auth-spinner" /> : <><ArrowRight size={15} /> Sign In</>}
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
