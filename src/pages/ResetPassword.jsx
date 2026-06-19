import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

const SUCCESS_TEXT = { color: '#4ade80', fontWeight: 600, marginBottom: '0.75rem' };
const INVALID_TEXT = { marginBottom: '1rem' };

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }

    // The email link drops the user here with a recovery session in the URL.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) setReady(true);
      })
      .catch((err) => {
        console.error('getSession failed:', err);
      })
      .finally(() => {
        setChecking(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (!supabase) { setError("Authentication is not configured. Please try again later."); return; }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      // Sign out so they log in fresh with the new password.
      await supabase.auth.signOut();
      setTimeout(() => navigate('/signin'), 2500);
    } catch (err) {
      setError(err.message || "Could not update password. Please try again.");
    } finally {
      setIsLoading(false);
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

        <div className="bolt-hero-text">
          <h1>
            Almost there.<br />
            <span>Set your new password.</span>
          </h1>
          <p className="bolt-hero-desc">
            Choose a strong password you haven't used before, and you'll be back in your account in seconds.
          </p>
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
            <h2>Set a new password</h2>
            <p>Choose a new password for your account</p>
          </div>

          {error && (
            <div className="bolt-error">
              <AlertCircle size={14} className="bolt-error-icon" />
              {error}
            </div>
          )}

          {checking ? (
            <div className="bolt-spinner" />
          ) : done ? (
            <div>
              <p style={SUCCESS_TEXT}>
                Password updated. Taking you to sign in...
              </p>
              <p className="bolt-auth-link">
                <Link to="/signin">Go to sign in now</Link>
              </p>
            </div>
          ) : !ready ? (
            <div>
              <p className="bolt-hero-desc" style={INVALID_TEXT}>
                This reset link is invalid or has expired. Request a new one from the sign-in page.
              </p>
              <p className="bolt-auth-link">
                <Link to="/signin">Back to sign in</Link>
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="bolt-form">
                <div className="bolt-field">
                  <label className="bolt-label">New password</label>
                  <div className="bolt-input-wrap">
                    <Lock size={14} className="bolt-input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      className="bolt-input"
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

                <div className="bolt-field">
                  <label className="bolt-label">Confirm password</label>
                  <div className="bolt-input-wrap">
                    <Lock size={14} className="bolt-input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className="bolt-input"
                    />
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
                    <>Update password <ArrowRight size={14} /></>
                  )}
                </button>
              </form>

              <p className="bolt-auth-link">
                Remembered it?{" "}
                <Link to="/signin">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
