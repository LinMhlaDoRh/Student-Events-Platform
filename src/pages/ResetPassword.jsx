/**
 * Password reset screen, opened from a Supabase recovery link.
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

const LOGO_MARK = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 1L9.5 5.5H12L9 8.5L10 12.5L7 10L4 12.5L5 8.5L2 5.5H4.5L7 1Z" fill="white" />
  </svg>
);

const SUCCESS_TEXT = { color: '#4ade80', fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center' };
const INVALID_TEXT = { marginBottom: '1rem', textAlign: 'center' };

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(() => !!supabase);

  useEffect(() => {
    if (!supabase) return undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setReady(true);
        setChecking(false);
      }
    });
    const timeout = setTimeout(() => setChecking(false), 2500);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 12) { setError('Password must be at least 12 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (!supabase) { setError('Authentication is not configured. Please try again later.'); return; }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate('/signin'), 2500);
    } catch {
      setError('Could not update the password. Request a new recovery link and try again.');
    } finally {
      setIsLoading(false);
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
              Almost there.<br />
              <span>Set your new password.</span>
            </h1>
            <p className="auth-hero-desc">
              Choose a strong password you have not used before.
            </p>
          </div>
        </div>

        <div className="auth-credit">Built by LinMhlaDoRh</div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-mobile-logo">
          <div className="auth-logo-icon">{LOGO_MARK}</div>
          <span className="auth-logo-text">Student Events</span>
        </div>

        <div className="auth-form-container">
          <div className="auth-heading">
            <h2>Set a new password</h2>
            <p>Choose a new password for your account</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={14} className="auth-error-icon" />
              {error}
            </div>
          )}

          {checking ? (
            <div className="auth-spinner" />
          ) : done ? (
            <div>
              <p style={SUCCESS_TEXT}>Password updated. Taking you to sign in...</p>
              <p className="auth-link">
                <Link to="/signin">Go to sign in now</Link>
              </p>
            </div>
          ) : !ready ? (
            <div>
              <p className="auth-hero-desc" style={INVALID_TEXT}>
                This reset link is invalid or has expired. Request a new one from the sign-in page.
              </p>
              <p className="auth-link">
                <Link to="/signin">Back to sign in</Link>
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="reset-password">New password</label>
                  <div className="auth-input-wrap">
                    <Lock size={14} className="auth-input-icon" />
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 12 characters"
                      autoComplete="new-password"
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

                <div className="auth-field">
                  <label className="auth-label" htmlFor="reset-confirm">Confirm password</label>
                  <div className="auth-input-wrap">
                    <Lock size={14} className="auth-input-icon" />
                    <input
                      id="reset-confirm"
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className="auth-input"
                    />
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className="auth-submit-btn">
                  {isLoading ? <div className="auth-spinner" /> : <>Update password <ArrowRight size={14} /></>}
                </button>
              </form>

              <p className="auth-link">
                Remembered it? <Link to="/signin">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
