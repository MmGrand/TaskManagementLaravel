export const THEME_MODES = ['light', 'dark', 'system'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

export const DEFAULT_THEME: ThemeMode = 'system';

const THEME_KEY = 'tm.theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const DARK_CLASS = 'dark';

export function isThemeMode(value: unknown): value is ThemeMode {
    return THEME_MODES.includes(value as ThemeMode);
}

/**
 * Ключ живёт здесь, а не в utils/tokenStorage.ts, потому что clearSession()
 * не должен сбрасывать тему при выходе из аккаунта.
 *
 * localStorage выбрасывает исключение в приватном режиме Safari и отсутствует
 * в небраузерных окружениях, поэтому каждый доступ защищён.
 */
export function readStoredTheme(): ThemeMode | null {
    try {
        const raw = window.localStorage.getItem(THEME_KEY);

        return isThemeMode(raw) ? raw : null;
    } catch {
        return null;
    }
}

export function writeStoredTheme(mode: ThemeMode): void {
    try {
        window.localStorage.setItem(THEME_KEY, mode);
    } catch {
        // Невыбранная тема всё равно работает в рамках текущей загрузки страницы.
    }
}

/** Сохранённый выбор -> следование системе. */
export function detectTheme(): ThemeMode {
    return readStoredTheme() ?? DEFAULT_THEME;
}

/** matchMedia отсутствует в jsdom и в небраузерных окружениях. */
function darkQuery(): MediaQueryList | null {
    return typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null;
}

export function prefersDark(): boolean {
    return darkQuery()?.matches ?? false;
}

/** Подписка на смену системной темы; возвращает функцию отписки. */
export function watchSystemTheme(onChange: (dark: boolean) => void): () => void {
    const query = darkQuery();

    if (query === null) {
        return () => {};
    }

    const listener = (event: MediaQueryListEvent): void => {
        onChange(event.matches);
    };

    query.addEventListener('change', listener);

    return () => query.removeEventListener('change', listener);
}

/** Тот же класс на documentElement ставит инлайн-скрипт в app.blade.php до первого кадра. */
export function applyTheme(dark: boolean): void {
    document.documentElement.classList.toggle(DARK_CLASS, dark);
}
