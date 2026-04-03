import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS, storage } from '../utils';
import { fetchWithCache, CACHE_KEYS, getCachedPage } from '../utils/quranCache';
import { STATIC_SURAHS, STATIC_JUZ, getStaticPage } from '../data';

const API_URL = API_CONFIG.BASE_URL;

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_CONFIG.TIMEOUT,
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = storage.get(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        return Promise.reject(error);
      }

      try {
        // Try to refresh the token
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { access_token, refresh_token } = response.data;

        // Store new tokens
        storage.set(STORAGE_KEYS.ACCESS_TOKEN, access_token);
        storage.set(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Only clear tokens, don't redirect (let AuthContext handle it)
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email, password) => {
    // Normalize email to lowercase for case-insensitive login
    const normalizedEmail = email.toLowerCase().trim();
    return api.post('/auth/login', { email: normalizedEmail, password });
  },
  register: (userData) => {
    // Normalize email to lowercase for case-insensitive registration
    const normalizedUserData = {
      ...userData,
      email: userData.email.toLowerCase().trim()
    };
    return api.post('/auth/register', normalizedUserData);
  },
  getProfile: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => {
    // Normalize email to lowercase for case-insensitive password reset
    const normalizedEmail = email.toLowerCase().trim();
    return api.post('/auth/forgot-password', { email: normalizedEmail });
  },
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => {
    // Normalize email to lowercase for case-insensitive resend
    const normalizedEmail = email.toLowerCase().trim();
    return api.post('/auth/send-verification', { email: normalizedEmail });
  },
};

// User services
export const userService = {
  getAllUsers: () => api.get('/users'),
  getUserProfile: () => api.get('/users/profile'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.patch(`/users/${id}`, userData),
  updateProfile: (userData) => api.patch('/users/profile', userData),
  changePassword: (passwordData) => api.patch('/users/change-password', passwordData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  deleteAccount: () => api.delete('/users/account'),
};

// City services
export const cityService = {
  getAllCities: (page = 1, limit = 10) =>
    api.get(`/cities?page=${page}&limit=${limit}`),
  getCityById: (id) => api.get(`/cities/${id}`),
  createCity: (cityData) => api.post('/cities', cityData),
  updateCity: (id, cityData) => api.patch(`/cities/${id}`, cityData),
  deleteCity: (id) => api.delete(`/cities/${id}`),
};

// Upload services
export const uploadService = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadProfilePicture: (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/profile-picture/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadCityImage: (cityId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/city-image/${cityId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Enhanced error handling wrapper
const withErrorHandling = (apiCall) => {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (error) {
      // Handle network errors
      if (!error.response) {
        const networkError = new Error('Network error. Please check your connection.');
        networkError.code = 'NETWORK_ERROR';
        networkError.originalError = error;
        throw networkError;
      }

      // Handle server errors
      if (error.response.status >= 500) {
        const serverError = new Error('Server error. Please try again later.');
        serverError.code = 'SERVER_ERROR';
        serverError.originalError = error;
        throw serverError;
      }

      // Handle validation errors
      if (error.response.status === 400) {
        const validationError = new Error('Please check your input and try again.');
        validationError.code = 'VALIDATION_ERROR';
        validationError.originalError = error;
        throw validationError;
      }

      throw error;
    }
  };
};

// Quran services with caching and static fallback
export const quranService = {
  getSurahs: withErrorHandling(async () => {
    try {
      const surahs = await fetchWithCache(CACHE_KEYS.SURAHS, () => api.get('/quran/surahs').then(r => r.data));
      return surahs;
    } catch (error) {
      console.log('Using static Surahs data');
      return STATIC_SURAHS;
    }
  }),
  getSurah: withErrorHandling((number) => api.get(`/quran/surahs/${number}`)),
  getSurahVerses: withErrorHandling((number, page = 1, limit = 50) =>
    api.get(`/quran/surahs/${number}/verses?page=${page}&limit=${limit}`)),
  getVerses: withErrorHandling((page = 1, limit = 20) =>
    api.get(`/quran/verses?page=${page}&limit=${limit}`)),
  searchVerses: withErrorHandling((query) => api.get(`/quran/search/verses?q=${query}`)),
  getJuz: withErrorHandling(async () => {
    try {
      return await fetchWithCache(CACHE_KEYS.JUZ, () => api.get('/quran/juz').then(r => r.data));
    } catch (error) {
      console.log('Using static Juz data');
      return STATIC_JUZ;
    }
  }),
  getJuzById: withErrorHandling((number) => api.get(`/quran/juz/${number}`)),
  getPageByNumber: withErrorHandling(async (number) => {
    // Try cache first
    const cached = getCachedPage(number);
    if (cached) return { data: cached };

    // Try API
    try {
      const response = await api.get(`/quran/pages/${number}`);
      // Cache this page
      const cacheKey = `quran_page_${number}_cache`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data: response.data,
        timestamp: Date.now(),
        version: 'v1'
      }));
      return response;
    } catch (error) {
      // Try individual page cache
      const cacheKey = `quran_page_${number}_cache`;
      const cachedPage = localStorage.getItem(cacheKey);
      if (cachedPage) {
        const { data } = JSON.parse(cachedPage);
        return { data };
      }

      // Fallback to static data
      console.log(`Using static page ${number}`);
      const staticPage = getStaticPage(number);
      if (staticPage) {
        return { data: staticPage };
      }

      throw error;
    }
  }),
  getPageBySurah: withErrorHandling((surahNumber) => api.get(`/quran/pages/surah/${surahNumber}`)),
  getPageByJuz: withErrorHandling((juzNumber) => api.get(`/quran/pages/juz/${juzNumber}`)),
  searchTopics: withErrorHandling((query) => api.get(`/topics/search?q=${query}`)),
};

// Bookmark services
export const bookmarkService = {
  getBookmarks: (page = 1, limit = 20) =>
    api.get(`/bookmarks?page=${page}&limit=${limit}`),
  createBookmark: (pageNumber, note) =>
    api.post('/bookmarks', { pageNumber, note }),
  deleteBookmark: (id) => api.delete(`/bookmarks/${id}`),
  updateNote: (id, note) =>
    api.patch(`/bookmarks/${id}/note`, { note }),
  getProgress: () => api.get('/bookmarks/progress'),
  updateProgress: (pageNumber) =>
    api.post('/bookmarks/progress', { pageNumber }),
  getBookmarkedPageNumbers: () => api.get('/bookmarks/page-numbers'),
};

export default api;
