import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds (LLM generation can take over 30s)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
