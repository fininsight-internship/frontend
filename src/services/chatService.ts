import axios from 'axios';
import { API_BASE_URL } from '../constants';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface NextQuestionResponse {
  success: boolean;
  data: {
    question: string;
    is_finished: boolean;
    jd_text: string;
  };
}

export const getNextQuestion = async (
  companyName: string,
  jdUrl: string | undefined,
  jdText: string | undefined,
  chatHistory: ChatMessage[]
): Promise<NextQuestionResponse> => {
  const payload = {
    company_name: companyName,
    jd_url: jdUrl,
    jd_text: jdText,
    chat_history: chatHistory,
  };

  const response = await axios.post<NextQuestionResponse>(
    `${API_BASE_URL}/api/chat/next-question`,
    payload
  );
  return response.data;
};
