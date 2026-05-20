import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // LLM 생성 속도를 감안한 60초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// [유지할 핵심 인터셉터] 모든 API 요청에 로그인된 유저 ID와 이메일을 헤더에 자동 추가
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user) {
          if (user.id) {
            config.headers['X-User-Id'] = String(user.id);
          }
          if (user.email) {
            config.headers['X-User-Email'] = String(user.email);
          }
        }
      } catch (e) {
        console.error('Failed to parse user in api request interceptor', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
