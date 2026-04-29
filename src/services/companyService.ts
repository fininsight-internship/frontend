import api from './api';
import type { CompanyReport } from '../types';

export const companyService = {
  getReport: async (company: string): Promise<CompanyReport> => {
    const { data } = await api.post('/company/report', { company });
    return data;
  },
};
