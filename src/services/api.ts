import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds (LLM generation can take over 30s)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor – attach current logged-in user's ID for DB tracking
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          config.headers['X-User-Id'] = String(user.id);
        }
      } catch (e) {
        console.error('Failed to parse user in api request interceptor', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
