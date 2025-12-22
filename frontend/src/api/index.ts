import { apiClient } from './client';
import type { TokenResponse, Card, ScheduleAmount, Answer } from '../types';

export const authApi = {
  login: async (username: string, password: string): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.post<TokenResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
};

export const studyApi = {
  getNextCard: async (): Promise<Card | null> => {
    const response = await apiClient.get<Card | null>('/study/next');
    return response.data;
  },

  answerCard: async (answer: Answer): Promise<void> => {
    await apiClient.post('/study/answer', answer);
  },

  getStats: async (): Promise<ScheduleAmount> => {
    const response = await apiClient.get<ScheduleAmount>('/study/stats');
    return response.data;
  },

  deleteCard: async (cardId: string): Promise<void> => {
    await apiClient.delete(`/study/cards/${cardId}`);
  },

  increaseLimit: async (limitType: 'NEW' | 'DUE', amount: number): Promise<void> => {
    await apiClient.post('/study/limits/increase', { limit_type: limitType, amount });
  },
};

export const cardsApi = {
  createCards: async (word: string): Promise<Set<string>> => {
    const response = await apiClient.post<string[]>(`/cards/create?word=${encodeURIComponent(word)}`);
    return new Set(response.data);
  },
};

