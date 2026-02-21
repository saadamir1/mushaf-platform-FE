import React from 'react';

const SkeletonLoader = ({ count = 6, type = 'surah' }) => {
  if (type === 'surah') {
    return (
      <div className="surah-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="surah-card skeleton">
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="loader-container">
      <div className="loader"></div>
    </div>
  );
};

export default SkeletonLoader;
