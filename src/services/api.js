import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS, storage } from '../utils';

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
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/send-verification', { email }),
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

// Quran services
export const quranService = {
  getSurahs: () => api.get('/quran/surahs'),
  getSurah: (number) => api.get(`/quran/surahs/${number}`),
  getSurahVerses: (number, page = 1, limit = 50) =>
    api.get(`/quran/surahs/${number}/verses?page=${page}&limit=${limit}`),
  getVerses: (page = 1, limit = 20) =>
    api.get(`/quran/verses?page=${page}&limit=${limit}`),
  searchVerses: (query) => api.get(`/quran/search/verses?q=${query}`),
  getJuz: () => api.get('/quran/juz'),
  getJuzById: (number) => api.get(`/quran/juz/${number}`),
};

// Bookmark services
export const bookmarkService = {
  getBookmarks: (page = 1, limit = 20) =>
    api.get(`/bookmarks?page=${page}&limit=${limit}`),
  createBookmark: (verseId, note) =>
    api.post('/bookmarks', { verseId, note }),
  deleteBookmark: (id) => api.delete(`/bookmarks/${id}`),
  updateNote: (id, note) =>
    api.patch(`/bookmarks/${id}/note`, { note }),
  getProgress: () => api.get('/bookmarks/progress'),
  updateProgress: (verseId, surahNumber, pageNumber) =>
    api.post('/bookmarks/progress', { verseId, surahNumber, pageNumber }),
  getBookmarkedVerseIds: () => api.get('/bookmarks/verse-ids'),
};

export default api;
