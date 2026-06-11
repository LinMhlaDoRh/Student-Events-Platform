import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, MapPin, GraduationCap, Shield, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function SignUp() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [campus, setCampus] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            campus,
            role,
          }
        }
      });

      if (signUpError) throw signUpError;
      
      // If successful, we can either wait for email confirmation or login directly
      // For testing, we'll try to insert into users table manually just in case trigger is missing
      if (data.user) {
        // We catch errors here silently because the trigger might already do this
        await supabase.from('users').insert([{
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          campus: campus,
          role: role
        }]).catch(() => {});
        
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
      <h2 className="auth-title">Create account</h2>
      <p className="auth-subtitle">Richfield Student Community</p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSignUp}>
        <div className="form-group">
          <label className="form-label">I AM A</label>
          <div className="role-toggle">
            <button 
              type="button" 
              className={`role-btn ${role === 'student' ? 'active' : ''}`}
              onClick={() => setRole('student')}
            >
              <GraduationCap size={16} /> Student
            </button>
            <button 
              type="button" 
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              <Shield size={16} /> SRC Member
            </button>
          </div>
          {role === 'admin' && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              SRC members manage events across both campuses on behalf of students.
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">FULL NAME</label>
          <div className="input-wrapper">
            <User size={18} className="input-icon" />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        </div>

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
          <label className="form-label">PASSWORD</label>
          <div className="input-wrapper">
            <Lock size={18} className="input-icon" />
            <input 
              type={showPassword ? "text" : "password"} 
              className="form-input" 
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
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

        <div className="form-group">
          <label className="form-label">CAMPUS</label>
          <div className="input-wrapper">
            <MapPin size={18} className="input-icon" />
            <select 
              className="form-input"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              required
            >
              <option value="" disabled>Select your campus</option>
              <option value="musgrave">Musgrave</option>
              <option value="umhlanga">uMhlanga</option>
            </select>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'} <ArrowRight size={16} />
        </button>

        <div className="auth-footer">
          Already have an account? <Link to="/signin" className="auth-link">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
