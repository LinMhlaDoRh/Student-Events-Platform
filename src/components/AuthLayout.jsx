import React from 'react';
import { Star, GraduationCap, Shield } from 'lucide-react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="app-container">
      <div className="hero-section">
        <div className="hero-header">
          <div className="logo-icon">
            <Star color="white" size={16} fill="white" />
          </div>
          <span>Campus Events</span>
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">
            Students propose.<br/>
            The campus votes.<br/>
            <span>SRC makes it happen.</span>
          </h1>
          <p className="hero-description">
            A shared platform for Musgrave and Umhlanga students to surface event demand and turn it into reality.
          </p>
          
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">
                <GraduationCap size={16} />
              </div>
              <span>Students submit event ideas and vote across both campuses</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Shield size={16} />
              </div>
              <span>SRC reviews demand signals and communicates with management</span>
            </div>
          </div>
        </div>

        <div className="hero-footer">
          Built by LinMhlaDoRh
        </div>
      </div>

      <div className="auth-section">
        <Outlet />
      </div>
    </div>
  );
}
