/**
 * Sign-up screen: account creation with campus selection and password strength.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, MapPin, AlertCircle, ArrowRight, GraduationCap, Shield } from 'lucide-react';
import { supabase } from '../supabaseClient';

const CAMPUSES = ['Musgrave', 'uMhlanga'];

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

function getPasswordStrength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (s <= 1) return { score: s, label: 'Weak', color: 'red' };
  if (s <= 2) return { score: s, label: 'Fair', color: 'orange' };
  if (s <= 3) return { score: s, label: 'Good', color: 'yellow' };
  return { score: s, label: 'Strong', color: 'green' };
}

export default function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [campus, setCampus] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const strength = password ? getPasswordStrength(password) : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (password.length < 12) { setError('Password must be at least 12 characters.'); return; }
    if (!campus) { setError('Please select your campus.'); return; }
    if (!supabase) { setError('Authentication is not configured. Please try again later.'); return; }

    setIsLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            campus: campus.toLowerCase(),
          },
        },
      });
      if (signUpError) throw signUpError;

      // New accounts are always students. Admins are promoted in the database only.
      if (data.session) {
        navigate('/dashboard');
      } else {
        setNotice('Account created. Check your email to verify it before signing in.');
      }
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left-panel">
        <div className="auth-bg-pattern" />
        <div className="auth-bg-fade" />

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
              A shared platform for Musgrave and uMhlanga students to propose, vote on, and commit to events together.
            </p>
          </div>

          <div className="auth-role-info-container">
            <div className="auth-role-info">
              <div className="auth-role-icon"><GraduationCap size={13} /></div>
              <div>
                <p className="auth-role-title">Students</p>
                <p className="auth-role-desc">Submit event ideas and vote across both campuses.</p>
              </div>
            </div>
            <div className="auth-role-info">
              <div className="auth-role-icon"><Shield size={13} /></div>
              <div>
                <p className="auth-role-title">SRC Members</p>
                <p className="auth-role-desc">Review demand signals and coordinate with management.</p>
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
            <h2>Create account</h2>
            <p>Join the student community</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={14} className="auth-error-icon" />
              {error}
            </div>
          )}
          {notice && <div className="auth-success">{notice}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-name">Full name</label>
              <div className="auth-input-wrap">
                <User size={14} className="auth-input-icon" />
                <input
                  id="signup-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-email">Email</label>
              <div className="auth-input-wrap">
                <Mail size={14} className="auth-input-icon" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="auth-input"
                />
              </div>
            </div>

            <div className={`auth-field${password && strength ? ' has-strength' : ''}`}>
              <label className="auth-label" htmlFor="signup-password">Password</label>
              <div className="auth-input-wrap">
                <Lock size={14} className="auth-input-icon" />
                <input
                  id="signup-password"
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
                {password && strength && (
                  <div className="auth-password-strength" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`auth-strength-bar ${i <= strength.score ? strength.color : ''}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-campus">Campus</label>
              <div className="auth-input-wrap">
                <MapPin size={14} className="auth-input-icon" />
                <select
                  id="signup-campus"
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="auth-input auth-input-select"
                >
                  <option value="">Select your campus</option>
                  {CAMPUSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="auth-submit-btn">
              {isLoading ? <div className="auth-spinner" /> : <>Create account <ArrowRight size={14} /></>}
            </button>
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
