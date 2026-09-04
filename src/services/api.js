import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS, storage } from '../utils';
import { fetchWithCache, CACHE_KEYS, getCachedPage } from '../utils/quranCache';
import { STATIC_SURAHS, STATIC_JUZ, getStaticPage } from '../data';

const API_URL = API_CONFIG.BASE_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_CONFIG.TIMEOUT,
});

api.interceptors.request.use(
  (config) => {
    const token = storage.get(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) return Promise.reject(error);
      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { access_token, refresh_token } = response.data;
        storage.set(STORAGE_KEYS.ACCESS_TOKEN, access_token);
        storage.set(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email: email.toLowerCase().trim(), password }),
  register: (userData) =>
    api.post('/auth/register', { ...userData, email: userData.email.toLowerCase().trim() }),
  getProfile: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email: email.toLowerCase().trim() }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) =>
    api.post('/auth/send-verification', { email: email.toLowerCase().trim() }),
};

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

export const uploadService = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadProfilePicture: (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/profile-picture/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  /** Admin: mushaf page upload → Cloudinary + auto Surah/Juz remap */
  uploadMushafPage: (file, pageNumber) => {
    const formData = new FormData();
    formData.append('file', file);
    if (pageNumber != null && pageNumber !== '') formData.append('pageNumber', String(pageNumber));
    return api.post('/upload/mushaf-page', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remapPages: () => api.post('/quran/pages/remap'),
};

const withErrorHandling = (apiCall) => async (...args) => {
  try {
    return await apiCall(...args);
  } catch (error) {
    if (!error.response) {
      const networkError = new Error('Network error. Please check your connection.');
      networkError.code = 'NETWORK_ERROR';
      throw networkError;
    }
    if (error.response.status >= 500) {
      const serverError = new Error('Server error. Please try again later.');
      serverError.code = 'SERVER_ERROR';
      throw serverError;
    }
    throw error;
  }
};

export const quranService = {
  getSurahs: withErrorHandling(async () => {
    try {
      return await fetchWithCache(CACHE_KEYS.SURAHS, () => api.get('/quran/surahs').then((r) => r.data));
    } catch {
      return STATIC_SURAHS;
    }
  }),
  getSurah: withErrorHandling((number) => api.get(`/quran/surahs/${number}`)),
  getSurahVerses: withErrorHandling((number, page = 1, limit = 50) =>
    api.get(`/quran/surahs/${number}/verses?page=${page}&limit=${limit}`)),
  getVerses: withErrorHandling((page = 1, limit = 20) =>
    api.get(`/quran/verses?page=${page}&limit=${limit}`)),
  searchVerses: withErrorHandling((query) => api.get(`/quran/search/verses?q=${encodeURIComponent(query)}`)),
  getJuz: withErrorHandling(async () => {
    try {
      return await fetchWithCache(CACHE_KEYS.JUZ, () => api.get('/quran/juz').then((r) => r.data));
    } catch {
      return STATIC_JUZ;
    }
  }),
  getJuzById: withErrorHandling((number) => api.get(`/quran/juz/${number}`)),
  getPageByNumber: withErrorHandling(async (number) => {
    const cached = getCachedPage(number);
    if (cached) return { data: cached };
    try {
      const response = await api.get(`/quran/pages/${number}`);
      localStorage.setItem(`quran_page_${number}_cache`, JSON.stringify({
        data: response.data,
        timestamp: Date.now(),
        version: 'v1',
      }));
      return response;
    } catch (error) {
      const cachedPage = localStorage.getItem(`quran_page_${number}_cache`);
      if (cachedPage) return { data: JSON.parse(cachedPage).data };
      const staticPage = getStaticPage(number);
      if (staticPage) return { data: staticPage };
      throw error;
    }
  }),
  getPageBySurah: withErrorHandling((surahNumber) => api.get(`/quran/pages/surah/${surahNumber}`)),
  getPageByJuz: withErrorHandling((juzNumber) => api.get(`/quran/pages/juz/${juzNumber}`)),
  getPageMap: withErrorHandling((pageNumber) => api.get(`/quran/pages/map/${pageNumber}`)),
  getPageRange: withErrorHandling((start, end) =>
    api.get(`/quran/pages/range?start=${start}&end=${end}`)),
  searchTopics: withErrorHandling((query) =>
    api.get(`/topics/search?q=${encodeURIComponent(query)}`)),
  getHotspots: withErrorHandling((pageNumber) =>
    api.get(`/quran/hotspots/page/${pageNumber}`)),
  getDailyFocus: withErrorHandling(() => api.get('/quran/insights/daily')),
  getPageInsights: withErrorHandling((pageNumber) =>
    api.get(`/quran/insights/page/${pageNumber}`)),
  getKhatmPlan: withErrorHandling((from = 1, days = 30) =>
    api.get(`/quran/insights/khatm?from=${from}&days=${days}`)),
  getSmartSuggest: withErrorHandling((page = 1) =>
    api.get(`/quran/insights/suggest?page=${page}`)),
};

export const bookmarkService = {
  getBookmarks: (page = 1, limit = 20) => api.get(`/bookmarks?page=${page}&limit=${limit}`),
  createBookmark: (pageNumber, note) => api.post('/bookmarks', { pageNumber, note }),
  deleteBookmark: (id) => api.delete(`/bookmarks/${id}`),
  updateNote: (id, note) => api.patch(`/bookmarks/${id}/note`, { note }),
  getProgress: () => api.get('/bookmarks/progress'),
  updateProgress: (pageNumber) => api.post('/bookmarks/progress', { pageNumber }),
  getBookmarkedPageNumbers: () => api.get('/bookmarks/page-numbers'),
};

export default api;
