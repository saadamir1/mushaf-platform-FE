// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  REMEMBERED_EMAIL: 'rememberedEmail',
  THEME: 'theme',
  LAST_PAGE: 'mushaf_last_page',
  READING_STREAK: 'mushaf_reading_streak',
  DAILY_GOAL: 'mushaf_daily_goal',
  NIGHT_PAGE: 'mushaf_night_page',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PAGE: '/page/:pageNumber',
  TOPIC_SEARCH: '/topic-search',
  INSIGHTS: '/insights',
  BOOKMARKS: '/bookmarks',
  PROFILE: '/profile',
  ADMIN: '/admin',
  NOT_FOUND: '/404',
};

export const UI = {
  ITEMS_PER_PAGE: 20,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  PAGE_TRANSITION_DURATION: 300,
  MAX_PASSWORD_LENGTH: 32,
  MIN_PASSWORD_LENGTH: 8,
};

export const QURAN = {
  TOTAL_SURAHS: 114,
  TOTAL_VERSES: 6236,
  TOTAL_JUZ: 30,
  TOTAL_PAGES: 1027,
};

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Please login to continue.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  BOOKMARK_ADDED: 'Bookmark added successfully.',
  BOOKMARK_REMOVED: 'Bookmark removed successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
};

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Match BE PublicRegisterDto: upper + lower + digit (no special char required)
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  MAX_INPUT_LENGTH: 100,
  MAX_NOTE_LENGTH: 500,
};

export const ARIA_LABELS = {
  SEARCH: 'Search Surahs',
  BOOKMARK: 'Bookmark Page',
  PREVIOUS_PAGE: 'Previous Page',
  NEXT_PAGE: 'Next Page',
  ZOOM_IN: 'Zoom In',
  ZOOM_OUT: 'Zoom Out',
  ROTATE: 'Rotate Page',
  THEME_SWITCH: 'Toggle Theme',
};
