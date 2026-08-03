import { describe, expect, it } from 'vitest';
import { firstFieldError, isApiError, normalizeError } from '@/api/errors';
import { makeHttpError } from '@/tests/fixtures';

describe('normalizeError', () => {
    it('maps a 422 into per-field messages', () => {
        const error = normalizeError(
            makeHttpError(422, {
                message: 'The given data was invalid.',
                errors: { title: ['Поле обязательно.'], status: ['Недопустимое значение.'] },
            }),
        );

        expect(error.status).toBe(422);
        expect(error.isValidation).toBe(true);
        expect(error.errors.title).toEqual(['Поле обязательно.']);
        expect(firstFieldError(error, 'status')).toBe('Недопустимое значение.');
    });

    it('maps the login bad-credentials shape onto the email field', () => {
        const error = normalizeError(
            makeHttpError(422, { errors: { email: ['Email or password is incorrect.'] } }),
        );

        expect(firstFieldError(error, 'email')).toBe('Email or password is incorrect.');
    });

    it.each([
        [401, 'Не авторизован.', 'isUnauthenticated'],
        [403, 'Действие запрещено.', 'isForbidden'],
        [404, 'Запрашиваемый ресурс не найден.', 'isNotFound'],
        [429, 'Слишком много запросов. Попробуйте позже.', 'isThrottled'],
    ] as const)('keeps the backend message and flags for %i', (status, message, flag) => {
        const error = normalizeError(makeHttpError(status, { message }));

        expect(error.message).toBe(message);
        expect(error[flag]).toBe(true);
    });

    it('falls back to a default message when the body has none', () => {
        expect(normalizeError(makeHttpError(403)).message).toBe('Действие запрещено.');
    });

    it('tells a disabled account apart from a denied action', () => {
        const disabled = normalizeError(makeHttpError(403, { message: 'Аккаунт недоступен: Заблокирован.' }));
        const denied = normalizeError(makeHttpError(403, { message: 'Действие запрещено.' }));

        expect(disabled.isAccountDisabled).toBe(true);
        expect(denied.isAccountDisabled).toBe(false);
    });

    it('parses Retry-After into seconds', () => {
        expect(normalizeError(makeHttpError(429, {}, { 'retry-after': '42' })).retryAfter).toBe(42);
        expect(normalizeError(makeHttpError(429, {})).retryAfter).toBeNull();
    });

    it('reports a missing response as a network failure', () => {
        const error = normalizeError(new Error('Network Error'));

        expect(error.status).toBe(0);
        expect(error.isNetwork).toBe(true);
        expect(error.message).toBe('Сервер недоступен. Проверьте подключение.');
    });

    it('survives a garbage payload', () => {
        const error = normalizeError(makeHttpError(500, 'not json at all'));

        expect(error.message).toBe('Внутренняя ошибка сервера. Попробуйте позже.');
        expect(error.errors).toEqual({});
    });

    it('ignores non-array entries in the errors bag', () => {
        const error = normalizeError(makeHttpError(422, { errors: { email: 'single string', bad: 42 } }));

        expect(error.errors.email).toEqual(['single string']);
        expect(error.errors.bad).toBeUndefined();
    });
});

describe('isApiError', () => {
    it('accepts a normalized error and rejects anything else', () => {
        expect(isApiError(normalizeError(makeHttpError(404)))).toBe(true);
        expect(isApiError(new Error('boom'))).toBe(false);
        expect(isApiError(null)).toBe(false);
    });
});
