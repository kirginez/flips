export interface Card {
  id: string;
  word: string;
  translation: string;
  definition: string | null;
  meta: string | null;
  pronunciation: string | null;
  example: string | null;
  example_translation: string | null;
  created_at: string;
}

export interface User {
  username: string;
  bonus: number;
  punishment: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ScheduleAmount {
  new: number;
  cram: number;
  due: number;
}

export interface Answer {
  card_id: string;
  answer: boolean;
}

export interface AuthStorage {
  token: string;
  username: string;
}

export const StudyStage = {
  SHOWING_DEFINITION: 'showing_definition',
  SHOWING_TRANSLATION: 'showing_translation',
  CHECKING_ANSWER: 'checking_answer',
  SHOWING_RESULT_CORRECT: 'showing_result_correct',
  SHOWING_RESULT_INCORRECT: 'showing_result_incorrect',
  RETYPE_WORD: 'retype_word',
} as const;

export type StudyStage = typeof StudyStage[keyof typeof StudyStage];

export interface CharComparison {
  char: string;
  isCorrect: boolean;
}

export interface StatsOverview {
  total: number;
  new: number;
  cram: number;
  due: number;
}

export interface HardestCard {
  card: Card;
  ease: number;
}

export interface DueChartData {
  date: string;
  count: number;
}

export interface ActivityData {
  date: string;
  count: number;
}

export interface TodayStats {
  count: number;
  time_spent: string | null;
}

