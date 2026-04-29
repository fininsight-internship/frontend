import api from './api';
import type { JDAnalysis } from '../types';

export const jdService = {
  analyze: async (jdText: string): Promise<JDAnalysis> => {
    const { data } = await api.post('/jd/analyze', { jd_text: jdText });
    return data;
  },
};
