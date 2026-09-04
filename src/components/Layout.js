import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));

  return (
    <div className={`app-container${isAuth ? ' app-auth' : ''}`}>
      <Navbar />
      <main className="main-content">
        <div className="container">{children}</div>
      </main>
      {!isAuth && (
        <footer className="footer">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} Mushaf — Digital Quran with Urdu Translation</p>
            <p className="footer-credit">Developed by Saad Amir</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
