import { DEFAULT_LOCALE, isLocaleCode, type LocaleCode } from '@/i18n/locale-state';

export interface LocaleDescriptor {
    code: LocaleCode;
    /** Подпись — всегда на своём языке, чтобы её узнали при любой текущей локали. */
    nativeName: string;
    /** Короткая подпись для компактного переключателя в шапке. */
    shortName: string;
}

export const SUPPORTED_LOCALES: readonly LocaleDescriptor[] = [
    { code: 'ru', nativeName: 'Русский', shortName: 'RU' },
    { code: 'en', nativeName: 'English', shortName: 'EN' },
];

const LOCALE_KEY = 'tm.locale';

/**
 * Ключ живёт здесь, а не в utils/tokenStorage.ts, потому что clearSession()
 * не должен сбрасывать язык при выходе из аккаунта.
 *
 * localStorage выбрасывает исключение в приватном режиме Safari и отсутствует
 * в небраузерных окружениях, поэтому каждый доступ защищён.
 */
export function readStoredLocale(): LocaleCode | null {
    try {
        const raw = window.localStorage.getItem(LOCALE_KEY);

        return isLocaleCode(raw) ? raw : null;
    } catch {
        return null;
    }
}

export function writeStoredLocale(locale: LocaleCode): void {
    try {
        window.localStorage.setItem(LOCALE_KEY, locale);
    } catch {
        // Невыбранный язык всё равно работает в рамках текущей загрузки страницы.
    }
}

/** Сохранённый выбор -> язык браузера -> русский. */
export function detectLocale(): LocaleCode {
    const stored = readStoredLocale();

    if (stored !== null) {
        return stored;
    }

    const preferred = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language]);

    for (const tag of preferred) {
        const base = tag.split('-')[0];

        if (isLocaleCode(base)) {
            return base;
        }
    }

    return DEFAULT_LOCALE;
}
