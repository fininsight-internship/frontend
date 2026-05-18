// import axios from 'axios';
// import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '../constants';

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 30000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Request interceptor – attach access token
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error),
// );

// // Response interceptor – handle 401
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
//       localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
//       localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   },
// );

// export default api;


import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;