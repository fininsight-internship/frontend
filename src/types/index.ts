// ────────────────────────────────────────────
// Auth
// ────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ────────────────────────────────────────────
// Company Analysis
// ────────────────────────────────────────────
export interface CompanyReport {
  company: string;
  summary: string;
  industry: string;
  newsItems: NewsItem[];
  generatedAt: string;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

// ────────────────────────────────────────────
// JD Analysis
// ────────────────────────────────────────────
export interface JDAnalysis {
  jobTitle: string;
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  fitScore: number;
  summary: string;
}

// ────────────────────────────────────────────
// Resume (자기소개서)
// ────────────────────────────────────────────
export interface ResumeItem {
  id: string;
  company: string;
  jobTitle: string;
  content: string;
  createdAt: string;
}

export interface ResumeGenerateRequest {
  company: string;
  jobTitle: string;
  jdText: string;
  userBackground: string;
}

// ────────────────────────────────────────────
// Interview
// ────────────────────────────────────────────
export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'behavioral' | 'technical' | 'situational';
  tips: string;
}

export interface InterviewSession {
  id: string;
  company: string;
  questions: InterviewQuestion[];
  createdAt: string;
}

// ────────────────────────────────────────────
// API Common
// ────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
