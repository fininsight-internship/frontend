import api from './api';
import type { InterviewQuestion, InterviewSession } from '../types';

export const interviewService = {
  getQuestions: async (company: string, jobTitle: string): Promise<InterviewQuestion[]> => {
    const { data } = await api.post('/interview/questions', { company, job_title: jobTitle });
    return data;
  },

  getSessions: async (): Promise<InterviewSession[]> => {
    const { data } = await api.get('/interview/sessions');
    return data;
  },
};
