import { i18n } from '@/i18n';
import type { ApiError } from '@/types/api';

/**
 * Тексты по умолчанию отражают обработчики, зарегистрированные в
 * bootstrap/app.php, чтобы UI говорил то же самое, что и API, даже когда
 * тело ответа отсутствует. Когда тело есть, побеждает оно (см. normalizeError),
 * а бэкенд отвечает только по-русски — это известное ограничение.
 *
 * Здесь `i18n.global.t`, а не `useI18n()`: normalizeError вызывается из
 * интерцептора axios, где нет инстанса компонента.
 */
const DEFAULT_MESSAGE_KEYS: Record<number, string> = {
    401: 'errors.unauthenticated',
    403: 'errors.forbidden',
    404: 'errors.notFound',
    422: 'errors.validation',
    429: 'errors.throttled',
    500: 'errors.server',
};

/**
 * ВНИМАНИЕ: строка привязана к бэкенду, это не UI-копирайт — переводить её нельзя.
 *
 * EnsureUserIsActive (app/Http/Middleware/EnsureUserIsActive.php) и AuthService
 * возвращают 403 с этим префиксом на любом защищённом маршруте. Его нужно
 * отличать от обычного отказа авторизации, так как он означает, что сессия
 * мертва, а не что запрещено конкретное действие. PHP отдаёт этот текст
 * по-русски независимо от языка интерфейса; если вынести его в файл локали,
 * то при английской локали startsWith() перестанет срабатывать и сессия
 * заблокированного пользователя молча продолжит жить.
 */
const ACCOUNT_DISABLED_PREFIX = 'Аккаунт недоступен';

function readRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function extractFieldErrors(payload: Record<string, unknown> | null): Record<string, string[]> {
    const raw = readRecord(payload?.errors);

    if (!raw) {
        return {};
    }

    const errors: Record<string, string[]> = {};

    for (const [field, messages] of Object.entries(raw)) {
        if (Array.isArray(messages)) {
            errors[field] = messages.filter((message): message is string => typeof message === 'string');
        } else if (typeof messages === 'string') {
            errors[field] = [messages];
        }
    }

    return errors;
}

function extractRetryAfter(headers: Record<string, unknown> | null): number | null {
    const raw = headers?.['retry-after'] ?? headers?.['Retry-After'];
    const seconds = Number(raw);

    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

/**
 * Превращает всё, что выбрасывает HTTP-слой, в предсказуемую форму. Читает
 * ошибку структурно, а не через `axios.isAxiosError`, чтобы тесты могли
 * передавать обычные объекты и никакой другой модуль не знал о существовании axios.
 */
export function normalizeError(error: unknown): ApiError {
    const response = readRecord(readRecord(error)?.response);

    if (!response) {
        return {
            status: 0,
            message: i18n.global.t('errors.network'),
            errors: {},
            isValidation: false,
            isUnauthenticated: false,
            isForbidden: false,
            isNotFound: false,
            isThrottled: false,
            isNetwork: true,
            isAccountDisabled: false,
            retryAfter: null,
        };
    }

    const status = typeof response.status === 'number' ? response.status : 0;
    const payload = readRecord(response.data);
    const message =
        typeof payload?.message === 'string' && payload.message.trim() !== ''
            ? payload.message
            : i18n.global.t(DEFAULT_MESSAGE_KEYS[status] ?? 'errors.unknown');

    return {
        status,
        message,
        errors: extractFieldErrors(payload),
        isValidation: status === 422,
        isUnauthenticated: status === 401,
        isForbidden: status === 403,
        isNotFound: status === 404,
        isThrottled: status === 429,
        isNetwork: false,
        isAccountDisabled: status === 403 && message.startsWith(ACCOUNT_DISABLED_PREFIX),
        retryAfter: extractRetryAfter(readRecord(response.headers)),
    };
}

/** Сужает неизвестное значение из catch до нашей нормализованной ошибки. */
export function isApiError(value: unknown): value is ApiError {
    const candidate = readRecord(value);

    return (
        candidate !== null &&
        typeof candidate.status === 'number' &&
        typeof candidate.message === 'string' &&
        typeof candidate.errors === 'object'
    );
}

/** Первое сообщение для поля, если сервер его вернул. */
export function firstFieldError(error: ApiError | null, field: string): string | null {
    return error?.errors[field]?.[0] ?? null;
}
