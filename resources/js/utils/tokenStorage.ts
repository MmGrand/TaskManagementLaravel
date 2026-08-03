import type { User } from '@/types/models';

const TOKEN_KEY = 'tm.token';
const USER_KEY = 'tm.user';

/**
 * localStorage выбрасывает исключение в приватном режиме Safari и отсутствует
 * в небраузерных окружениях, поэтому каждый доступ защищён, а сбой
 * деградирует до "сессии нет", а не роняет приложение.
 */
function read(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function write(key: string, value: string | null): void {
    try {
        if (value === null) {
            window.localStorage.removeItem(key);
        } else {
            window.localStorage.setItem(key, value);
        }
    } catch {
        // Сессия, которую не удалось сохранить, всё равно работает в рамках текущей загрузки страницы.
    }
}

export function readToken(): string | null {
    return read(TOKEN_KEY);
}

export function writeToken(token: string | null): void {
    write(TOKEN_KEY, token);
}

export function readUser(): User | null {
    const raw = read(USER_KEY);

    if (raw === null) {
        return null;
    }

    try {
        const parsed: unknown = JSON.parse(raw);

        return typeof parsed === 'object' && parsed !== null && 'id' in parsed ? (parsed as User) : null;
    } catch {
        return null;
    }
}

export function writeUser(user: User | null): void {
    write(USER_KEY, user === null ? null : JSON.stringify(user));
}

export function clearSession(): void {
    writeToken(null);
    writeUser(null);
}
