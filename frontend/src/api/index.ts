import { apiClient } from './client';
import type {
  TokenResponse,
  Card,
  ScheduleAmount,
  Answer,
  StatsOverview,
  HardestCard,
  DueChartData,
  ActivityData,
  TodayStats,
} from '../types';

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

export const statsApi = {
  getOverview: async (): Promise<StatsOverview> => {
    const response = await apiClient.get<StatsOverview>('/stats/overview');
    return response.data;
  },

  getHardest: async (limit: number = 10): Promise<HardestCard[]> => {
    const response = await apiClient.get<HardestCard[]>(`/stats/hardest?limit=${limit}`);
    return response.data;
  },

  getDueChart: async (days: number = 30): Promise<DueChartData[]> => {
    const response = await apiClient.get<DueChartData[]>(`/stats/due-chart?days=${days}`);
    return response.data;
  },

  getActivity: async (days: number = 365): Promise<ActivityData[]> => {
    const response = await apiClient.get<ActivityData[]>(`/stats/activity?days=${days}`);
    return response.data;
  },

  getToday: async (): Promise<TodayStats> => {
    const response = await apiClient.get<TodayStats>('/stats/today');
    return response.data;
  },
};

