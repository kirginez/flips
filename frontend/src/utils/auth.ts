import type { AuthStorage } from '../types';

const AUTH_STORAGE_KEY = 'flips_auth';

export const saveAuthData = (data: AuthStorage): void => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
};

export const getAuthData = (): AuthStorage | null => {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
};

export const clearAuthData = (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const isAuthenticated = (): boolean => {
    const authData = getAuthData();
    return !!authData?.token;
};

