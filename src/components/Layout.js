import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div className="container">{children}</div>
      </main>
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} My App - All rights reserved</p>
          <p style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>Developed by Saad Amir</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
