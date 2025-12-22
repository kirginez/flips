import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { getAuthData, clearAuthData } from '../utils/auth';

// Создаем экземпляр axios
const createApiClient = (): AxiosInstance => {
  // Всегда используем текущий домен (фронтенд раздается с бэкенда)
  const baseURL = window.location.origin;

  const client = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor для добавления токена к запросам
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const authData = getAuthData();
      if (authData?.token && config.headers) {
        config.headers.Authorization = `Bearer ${authData.token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor для обработки ошибок авторизации
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Токен невалиден, очищаем auth данные и редиректим на логин
        clearAuthData();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// Функция для переинициализации клиента (после смены сервера)
export const reinitializeApiClient = (): AxiosInstance => {
  const newClient = createApiClient();
  Object.assign(apiClient, newClient);
  return apiClient;
};
