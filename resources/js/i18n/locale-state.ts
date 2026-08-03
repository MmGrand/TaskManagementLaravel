import { computed, ref } from 'vue';

export const LOCALE_CODES = ['ru', 'en'] as const;
export type LocaleCode = (typeof LOCALE_CODES)[number];

export const DEFAULT_LOCALE: LocaleCode = 'ru';

/**
 * Активная локаль как реактивный источник для кода вне компонентов.
 *
 * Пишут сюда только setLocale/setLocaleSync из @/i18n — иначе значение
 * разъедется с i18n.global.locale. Модуль намеренно не импортирует ничего,
 * кроме vue: его тянет utils/format.ts, а тот — половина компонентов.
 */
export const activeLocale = ref<LocaleCode>(DEFAULT_LOCALE);

/** BCP-47 теги для Intl. `en-GB` даёт `15/07/2026`, а не американское `07/15/2026`. */
const INTL_TAGS: Record<LocaleCode, string> = {
    ru: 'ru-RU',
    en: 'en-GB',
};

export const intlLocale = computed(() => INTL_TAGS[activeLocale.value]);

export function isLocaleCode(value: unknown): value is LocaleCode {
    return typeof value === 'string' && (LOCALE_CODES as readonly string[]).includes(value);
}
