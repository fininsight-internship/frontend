import api from './api';
import type { AuthTokens, User } from '../types';

export const authService = {
  login: async (email: string, password: string): Promise<AuthTokens & { user: User }> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
