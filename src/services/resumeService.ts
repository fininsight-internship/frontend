import api from './api';
import type { ResumeItem, ResumeGenerateRequest } from '../types';

export const resumeService = {
  generate: async (req: ResumeGenerateRequest): Promise<ResumeItem> => {
    const { data } = await api.post('/resume/generate', req);
    return data;
  },

  list: async (): Promise<ResumeItem[]> => {
    const { data } = await api.get('/resume/list');
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/resume/${id}`);
  },
};
