import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, MapPin, AlertCircle, ArrowRight, GraduationCap, Shield } from 'lucide-react';
import { supabase } from '../supabaseClient';

function getPasswordStrength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (s <= 1) return { score: s, label: "Weak", color: "red" };
  if (s <= 2) return { score: s, label: "Fair", color: "orange" };
  if (s <= 3) return { score: s, label: "Good", color: "yellow" };
  return { score: s, label: "Strong", color: "green" };
}

const CAMPUSES = ["Musgrave", "uMhlanga"];

export default function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [campus, setCampus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const strength = password ? getPasswordStrength(password) : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!email.trim()) { setError("Email address is required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!campus) { setError("Please select your campus."); return; }
    if (!supabase) { setError("Authentication is not configured. Please try again later."); return; }

    setIsLoading(true);
    try {
      const profilePayload = {
        full_name: fullName.trim(),
        campus: campus.toLowerCase(),
      };

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: { data: profilePayload },
      });

      if (signUpError) throw signUpError;
      
      // New accounts are always students. The SRC admin is promoted
      // manually in the database, never via self sign-up.
      if (data.session) {
        navigate('/dashboard');
      } else {
        setError("Account created! Please check your email to verify.");
      }
    } catch (err) {
      setError(err.message || "Sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bolt-auth-page">
      {/* Left panel */}
      <div className="bolt-left-panel">
        <div className="bolt-bg-pattern" />
        <div className="bolt-bg-fade" />
        
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
              A shared platform for Musgrave and Umhlanga students to propose, vote on, and commit to events together.
            </p>
          </div>

          <div className="bolt-role-info-container" style={{ gap: '0.75rem', marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.5' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.125rem' }}>
                <GraduationCap size={11} />
              </div>
              <span style={{ paddingTop: '0.125rem' }}>Students submit event ideas and vote across both campuses</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.125rem' }}>
                <Shield size={11} />
              </div>
              <span style={{ paddingTop: '0.125rem' }}>SRC reviews demand signals and communicates with management</span>
            </div>
          </div>
        </div>

        <a className="bolt-credit" href="https://github.com/LinMhlaDoRh" target="_blank" rel="noreferrer"><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.950-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .271.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg> Built by LinMhlaDoRh</a>
      </div>

      {/* Right form panel */}
      <div className="bolt-right-panel" style={{ padding: '2.5rem 1.5rem' }}>
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
            <h2>Create account</h2>
            <p>Richfield Student Community</p>
          </div>

          {error && (
            <div className="bolt-error">
              <AlertCircle size={14} className="bolt-error-icon" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bolt-form">
            <div className="bolt-field">
              <label className="bolt-label">Full name</label>
              <div className="bolt-input-wrap">
                <User size={14} className="bolt-input-icon" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  className="bolt-input"
                />
              </div>
            </div>

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
              <label className="bolt-label">Password</label>
              <div className="bolt-input-wrap" style={{ marginBottom: password && strength ? '1.5rem' : '0' }}>
                <Lock size={14} className="bolt-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
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
                {password && strength && (
                  <div className="bolt-password-strength">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`bolt-strength-bar ${i <= strength.score ? strength.color : ""}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bolt-field">
              <label className="bolt-label">Campus</label>
              <div className="bolt-input-wrap">
                <MapPin size={14} className="bolt-input-icon" />
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="bolt-input bolt-input-select"
                >
                  <option value="">Select your campus</option>
                  {CAMPUSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bolt-submit-btn"
              style={{ marginTop: '0.5rem' }}
            >
              {isLoading ? (
                <div className="bolt-spinner" />
              ) : (
                <>Create account <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          <p className="bolt-auth-link">
            Already have an account?{" "}
            <Link to="/signin">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
