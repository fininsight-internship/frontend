import api from './api';
import type {
  AvailablePosition,
  EvaluateAxesResponse,
  EvaluationAxis,
  QuestionsResponse,
  AnswerFeedback,
  FollowUpQuestion,
  InterviewQuestion,
  MockContextResponse,
  InterviewSession,
} from '../types';

export const interviewService = {
  /** 지원 가능한 포지션 목록 (서비스 내 분석 완료된 기업-직무) */
  getPositions: async (): Promise<AvailablePosition[]> => {
    const { data } = await api.get('/interview/positions');
    return data;
  },

  /** 평가축 추론 — JD + 기업분석 + 자소서 RAG 기반 */
  evaluateAxes: async (company: string, jobRole: string): Promise<EvaluateAxesResponse> => {
    const { data } = await api.post('/interview/evaluate-axes', {
      company,
      job_role: jobRole,
    });
    return data;
  },

  /** 면접 질문 생성 — 평가축 기반 (정적/동적) 및 면접 유형 */
  getQuestions: async (
    company: string, 
    jobRole: string,
    interviewType: string = "전체",
    axisType: string = "static"
  ): Promise<QuestionsResponse> => {
    const { data } = await api.post('/interview/questions', {
      company,
      job_role: jobRole,
      interview_type: interviewType,
      axis_type: axisType
    }, {
      timeout: 90000 // 90 seconds specific timeout for heavy multi-stage LLM generation
    });
    return data;
  },

  /** 꼬리질문에 대한 피드백 */
  getFollowUpFeedback: async (
    company: string,
    jobRole: string,
    originalQuestion: string,
    followUpQuestion: string,
    followUpIntent: string,
    userAnswer: string
  ): Promise<{ feedback: string }> => {
    const { data } = await api.post('/interview/follow-up/feedback', {
      company,
      job_role: jobRole,
      original_question: originalQuestion,
      follow_up_question: followUpQuestion,
      follow_up_intent: followUpIntent,
      user_answer: userAnswer
    });
    return data;
  },

  /** 답변 피드백 + 감점 리스크 분석 */
  getFeedback: async (
    company: string,
    jobRole: string,
    question: string,
    userAnswer: string,
    featureWeights?: Record<string, number>
  ): Promise<AnswerFeedback> => {
    const { data } = await api.post('/interview/feedback', {
      company,
      job_role: jobRole,
      question,
      user_answer: userAnswer,
      feature_weights: featureWeights,
    });
    return data;
  },

  /** 압박 꼬리질문 생성 */
  getFollowUp: async (
    company: string,
    jobRole: string,
    question: string,
    userAnswer: string,
    resumeExcerpt?: string
  ): Promise<{ follow_up_questions: FollowUpQuestion[] }> => {
    const { data } = await api.post('/interview/follow-up', {
      company,
      job_role: jobRole,
      question,
      user_answer: userAnswer,
      resume_excerpt: resumeExcerpt,
    });
    return data;
  },

  /** 세션 저장 */
  saveSession: async (
    company: string,
    jobRole: string,
    answers: InterviewQuestion[],
    sessionId?: string,
    axesUsed?: EvaluationAxis[]
  ): Promise<{ message: string; session_id: string }> => {
    const { data } = await api.post('/interview/sessions', {
      session_id: sessionId,
      company,
      job_role: jobRole,
      axes_used: axesUsed,
      answers: answers.map((q) => ({
        id: q.id,
        question: q.question,
        category: q.category,
        tips: q.tips,
        evaluation_axis: q.evaluation_axis,
        axis_name: q.axis_name,
        userAnswer: q.userAnswer || '',
        feedback: q.feedback ? JSON.stringify(q.feedback) : undefined,
        followUps: q.followUps
      })),
    });
    return data;
  },

  /** 저장된 세션 목록 가져오기 */
  getSessions: async (): Promise<InterviewSession[]> => {
    const { data } = await api.get('/interview/sessions');
    return data;
  },

  // 하위 호환
  getMockContext: async (): Promise<MockContextResponse[]> => {
    const { data } = await api.get('/interview/mock-context');
    return data;
  },
};
