import { createI18n } from 'vue-i18n';
import { activeLocale, DEFAULT_LOCALE, type LocaleCode } from '@/i18n/locale-state';
import { detectLocale, writeStoredLocale } from '@/i18n/locales';
import ru, { type MessageSchema } from '@/i18n/messages/ru';

declare module 'vue-i18n' {
    /** Делает ключи проверяемыми в t() и в $t() внутри шаблонов под vue-tsc. */
    export interface DefineLocaleMessage extends MessageSchema {}
}

/**
 * Русская 3-формная плюрализация (CLDR: one | few | many).
 *
 * Кламп по `choicesLength` обязателен: он позволяет сообщению нести меньше
 * трёх форм, не полагаясь на внутренности @intlify/core-base. Растиражированные
 * версии этого правила рассчитаны на 4-формное `zero | one | few | many` и
 * промахиваются на единицу по сообщениям с тремя формами.
 */
export function ruPluralRule(choice: number, choicesLength: number): number {
    if (choicesLength <= 1) {
        return 0;
    }

    const n = Math.abs(choice);
    const mod10 = n % 10;
    const mod100 = n % 100;

    let index: number;

    if (mod10 === 1 && mod100 !== 11) {
        index = 0; // 1, 21, 31 — «секунда»
    } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        index = 1; // 2–4, 22–24 — «секунды»
    } else {
        index = 2; // 0, 5–20, 25 — «секунд»
    }

    return Math.min(index, choicesLength - 1);
}

/**
 * Опции передаются литералом прямо в вызов: при выносе в переменную TS
 * перестаёт сужать тип и `i18n.global` вырождается в `Composer | VueI18n`.
 */
export const i18n = createI18n({
    legacy: false,
    locale: DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    // Утверждение типа, а не полный объект: без него createI18n сузил бы
    // Locales до 'ru' по ключам messages, и setLocale('en') не скомпилировался бы.
    // Сообщения `en` подгружаются лениже, их наличие проверяется availableLocales.
    messages: { ru } as Record<LocaleCode, MessageSchema>,
    pluralRules: { ru: ruPluralRule },
});

/** Локали, чьи сообщения уже зарегистрированы. `ru` в бандле как fallback. */
const loaders: Record<LocaleCode, (() => Promise<{ default: MessageSchema }>) | null> = {
    ru: null,
    en: () => import('@/i18n/messages/en'),
};

function apply(locale: LocaleCode): void {
    i18n.global.locale.value = locale;
    activeLocale.value = locale;
    document.documentElement.lang = locale;
}

/** Синхронная смена для локалей с уже загруженными сообщениями (ru, либо повторный выбор). */
export function setLocaleSync(locale: LocaleCode): void {
    apply(locale);
}

/** Единственная точка смены языка: догружает сообщения, обновляет состояние и сохраняет выбор. */
export async function setLocale(locale: LocaleCode): Promise<void> {
    const load = loaders[locale];

    if (load !== null && !i18n.global.availableLocales.includes(locale)) {
        const messages = await load();

        i18n.global.setLocaleMessage(locale, messages.default);
    }

    apply(locale);
    writeStoredLocale(locale);
}

/** Вызывается один раз при старте приложения, до монтирования. */
export async function bootstrapLocale(): Promise<void> {
    await setLocale(detectLocale());
}
