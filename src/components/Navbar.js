import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* ── Brand ── */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <span className="brand-text">My App</span>
          </Link>
        </div>

        {/* ── Hamburger (mobile only) ── */}
        <button
          className={`hamburger ${mobileMenuOpen ? "active" : ""}`}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        {/* ── Nav Menu ── */}
        <div className={`navbar-menu ${mobileMenuOpen ? "active" : ""}`}>

          {user ? (
            <>
              {/* Right-side actions */}
              <div className="navbar-actions">
                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="theme-toggle"
                  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  aria-label="Toggle theme"
                >
                  {isDark ? "☀️" : "🌙"}
                </button>

                {/* User dropdown */}
                <div className="user-dropdown" ref={userMenuRef}>
                  <button
                    className="user-toggle"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="user-avatar">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt="Profile"
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <>
                          {user.firstName?.charAt(0)}
                          {user.lastName?.charAt(0)}
                        </>
                      )}
                    </div>
                    <span className="user-name-nav">{user.firstName}</span>
                    <span className={`dropdown-arrow ${userMenuOpen ? "open" : ""}`}>▼</span>
                  </button>

                  {userMenuOpen && (
                    <div className="dropdown-menu" role="menu">
                      <div className="dropdown-header">
                        <div className="dropdown-name">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="dropdown-email">{user.email}</div>
                        <span className="dropdown-role">{user.role}</span>
                      </div>

                      <div className="dropdown-divider" />

                      <Link
                        to="/profile"
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <span>👤</span>
                        My Profile
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="dropdown-item"
                          role="menuitem"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setMobileMenuOpen(false);
                          }}
                        >
                          <span>⚙️</span>
                          Admin Panel
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="dropdown-item logout"
                        role="menuitem"
                      >
                        <span>🚪</span>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Guest links */
            <div className="nav-links guest-links">
              <Link
                to="/login"
                className={`nav-link ${isActive("/login") ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
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
