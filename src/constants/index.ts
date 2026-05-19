export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const ROUTES = {
  HOME: '/',
  LANDING: '/landing',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ANALYSIS: '/analysis',
  ANALYSIS_CHAT: '/analysis/chat',
  ANALYSIS_REPORT: '/analysis/report',
  RESUME: '/resume',
  INTERVIEW: '/interview',
  INTERVIEW_DETAIL: '/interview/:id',
} as const;
