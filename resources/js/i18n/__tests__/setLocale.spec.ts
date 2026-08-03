import { beforeEach, describe, expect, it } from 'vitest';
import { i18n, ruPluralRule, setLocale, setLocaleSync } from '@/i18n';
import { activeLocale, intlLocale } from '@/i18n/locale-state';
import { detectLocale, readStoredLocale } from '@/i18n/locales';

beforeEach(() => {
    window.localStorage.clear();
    setLocaleSync('ru');
});

describe('setLocale', () => {
    it('loads the messages of a locale that is not bundled', async () => {
        expect(i18n.global.availableLocales).not.toContain('en');

        await setLocale('en');

        expect(i18n.global.availableLocales).toContain('en');
        expect(i18n.global.t('common.save')).toBe('Save');
    });

    it('moves every piece of locale state together', async () => {
        await setLocale('en');

        expect(activeLocale.value).toBe('en');
        expect(i18n.global.locale.value).toBe('en');
        expect(intlLocale.value).toBe('en-GB');
        expect(document.documentElement.lang).toBe('en');
    });

    it('persists the choice so a reload keeps it', async () => {
        await setLocale('en');

        expect(readStoredLocale()).toBe('en');
        expect(detectLocale()).toBe('en');
    });

    it('falls back to the bundled locale when nothing is stored', () => {
        // В jsdom navigator.language === 'en-US', поэтому проверяем именно ветку
        // сохранённого выбора, а не язык браузера.
        expect(readStoredLocale()).toBeNull();
    });
});

describe('the Russian plural rule', () => {
    it.each([
        [1, 0],
        [21, 0],
        [2, 1],
        [23, 1],
        [5, 2],
        [11, 2],
        [14, 2],
        [0, 2],
    ])('puts %i into form %i', (count, expected) => {
        expect(ruPluralRule(count, 3)).toBe(expected);
    });

    it('clamps to the number of forms the message actually has', () => {
        // Русское `throttle.retryIn` несёт одну форму — индекс не должен выйти за неё.
        expect(ruPluralRule(5, 1)).toBe(0);
        expect(ruPluralRule(5, 2)).toBe(1);
    });
});

describe('pluralisation through t()', () => {
    it('keeps the single Russian form for any count', () => {
        expect(i18n.global.t('throttle.retryIn', { n: 1 }, 1)).toBe('Слишком много попыток. Повторите через 1 с.');
        expect(i18n.global.t('throttle.retryIn', { n: 5 }, 5)).toBe('Слишком много попыток. Повторите через 5 с.');
    });

    it('switches the English form on the count', async () => {
        await setLocale('en');

        expect(i18n.global.t('throttle.retryIn', { n: 1 }, 1)).toBe('Too many attempts. Try again in 1 second.');
        expect(i18n.global.t('throttle.retryIn', { n: 5 }, 5)).toBe('Too many attempts. Try again in 5 seconds.');
    });
});
