// ────────────────────────────────────────────
// Auth
// ────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
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
// Interview — RAG + 평가축 기반
// ────────────────────────────────────────────

/** 지원 가능 포지션 (서비스 내 분석 완료된 기업-직무) */
export interface AvailablePosition {
  id: string;
  company: string;
  job_role: string;
  description: string;
  required_skills: string[];
  company_culture: string;
  doc_ids: string[];
}

/** 평가축 (feature taxonomy 기반) */
export interface EvaluationAxis {
  key: string;
  name: string;
  description: string;
  weight: number;
}

/** 평가축 추론 결과 */
export interface EvaluateAxesResponse {
  company: string;
  job_role: string;
  evaluation_axes: EvaluationAxis[];
  sources: { id: string; label: string }[];
  note: string;
}

/** 답변 감점 리스크 */
export interface RiskPoint {
  issue: string;
  reason: string;
  axis?: string;
}

/** 답변 피드백 */
export interface AnswerFeedback {
  overall_score: number;
  strengths: string[];
  risk_points: RiskPoint[];
  improvement: string;
  follow_up_hint: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  tips: string;
  evaluation_axis?: string;
  axis_name?: string;
  axis_weight?: number;
  userAnswer?: string;
  feedback?: AnswerFeedback;
  followUps?: FollowUpQuestion[];
}

export interface QuestionsResponse {
  questions: InterviewQuestion[];
  feature_weights: Record<string, number>;
  sources: { id: string; label: string }[];
  axes_used: EvaluationAxis[];
}

export interface InterviewSession {
  id: string;
  company: string;
  job_role: string;
  answers: InterviewQuestion[];
  axes_used?: EvaluationAxis[];
  created_at: string;
  stats?: {
    total_questions: number;
    answered_questions: number;
    score: number | null;
  };
}

/** 압박 꼬리질문 */
export interface FollowUpQuestion {
  question: string;
  intent: string;
  userAnswer?: string;
  feedback?: string;
  isLoading?: boolean;
}

// 하위 호환용
export interface MockContextResponse {
  id: string;
  jd: { jobTitle: string; requiredSkills: string[]; summary: string };
  company_analysis: { company: string; summary: string; culture: string };
  resume: { content: string };
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
