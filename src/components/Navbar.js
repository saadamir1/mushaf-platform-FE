import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <img
              src="/logo.png"
              alt="Mushaf Platform"
              className="nav-logo"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="brand-text">Mushaf</span>
          </Link>
          <button
            className={`hamburger ${mobileMenuOpen ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className={`navbar-menu ${mobileMenuOpen ? "active" : ""}`}>
          {user ? (
            <>
              <div className="nav-links">
                <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
                  📖 Quran
                </Link>
                <Link to="/search" className={`nav-link ${isActive("/search") ? "active" : ""}`}>
                  🔍 Search
                </Link>
                <Link to="/bookmarks" className={`nav-link ${isActive("/bookmarks") ? "active" : ""}`}>
                  🔖 Bookmarks
                </Link>
              </div>

              <div className="navbar-actions">
                <button
                  onClick={toggleTheme}
                  className="theme-toggle btn-icon"
                  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? '☀️' : '🌙'}
                </button>

                <div className="user-dropdown" ref={userMenuRef}>
                  <button
                    className="user-toggle"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="user-avatar">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                    <span className="user-name-nav">{user.firstName}</span>
                    <span className={`dropdown-arrow ${userMenuOpen ? "open" : ""}`}>▼</span>
                  </button>

                  {userMenuOpen && (
                    <div className="dropdown-menu">
                      <div className="dropdown-header">
                        <div className="dropdown-name">{user.firstName} {user.lastName}</div>
                        <div className="dropdown-email">{user.email}</div>
                        <span className="dropdown-role">{user.role}</span>
                      </div>
                      <div className="dropdown-divider"></div>
                      <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <span>👤</span> My Profile
                      </Link>
                      <button onClick={handleLogout} className="dropdown-item logout">
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="nav-links guest-links">
              <Link to="/login" className={`nav-link ${isActive("/login") ? "active" : ""}`}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
