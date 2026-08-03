import axios from 'axios';
import { normalizeError } from '@/api/errors';
import type { ApiError } from '@/types/api';
import { readToken } from '@/utils/tokenStorage';

/**
 * Персональные токены Sanctum: каждый защищённый запрос несёт bearer-заголовок.
 * `Accept: application/json` обязателен — без него Laravel редиректит гостей
 * вместо того чтобы вернуть JSON-контракт ошибки.
 */
export const http = axios.create({
    baseURL: '/api',
    headers: {
        Accept: 'application/json',
    },
});

http.interceptors.request.use((config) => {
    const token = readToken();

    if (token !== null) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
});

type SessionEndedHandler = (error: ApiError) => void;

let onSessionEnded: SessionEndedHandler | null = null;

/**
 * Позволяет auth-стору реагировать на завершённую сессию без импорта pinia в
 * http.ts (это создало бы цикл: store -> api -> store).
 */
export function setSessionEndedHandler(handler: SessionEndedHandler | null): void {
    onSessionEnded = handler;
}

http.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        const apiError = normalizeError(error);

        if (apiError.isUnauthenticated || apiError.isAccountDisabled) {
            onSessionEnded?.(apiError);
        }

        return Promise.reject(apiError);
    },
);
