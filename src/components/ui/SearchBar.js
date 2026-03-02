import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

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
        <span className="search-icon"><FiSearch size={20} /></span>
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
            <FiX size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
