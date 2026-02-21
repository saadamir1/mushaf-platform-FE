import React from 'react';

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  onClear,
  className = '' 
}) => {
  return (
    <div className={`search-container ${className}`}>
      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {value && (
          <button 
            className="search-clear" 
            onClick={onClear}
            type="button"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
