// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  REMEMBERED_EMAIL: 'rememberedEmail',
  THEME: 'theme',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SURAH: '/surah/:number',
  SEARCH: '/search',
  BOOKMARKS: '/bookmarks',
  PROFILE: '/profile',
  NOT_FOUND: '/404',
};

// UI Constants
export const UI = {
  ITEMS_PER_PAGE: 20,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
};

// Quran Constants
export const QURAN = {
  TOTAL_SURAHS: 114,
  TOTAL_VERSES: 6236,
  TOTAL_JUZ: 30,
  TOTAL_PAGES: 604,
};

// User Roles
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Please login to continue.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  BOOKMARK_ADDED: 'Bookmark added successfully.',
  BOOKMARK_REMOVED: 'Bookmark removed successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
};
