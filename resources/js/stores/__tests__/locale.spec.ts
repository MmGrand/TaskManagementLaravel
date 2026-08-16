import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLocaleStore } from '@/stores/locale';

beforeEach(() => {
    setActivePinia(createPinia());
    window.localStorage.clear();
});

describe('useLocaleStore', () => {
    it('mirrors the locale i18n is currently set to', () => {
        const locale = useLocaleStore();

        expect(locale.current).toBe('ru');
    });

    it('lists both supported locales', () => {
        const locale = useLocaleStore();

        expect(locale.available.map((item) => item.code)).toEqual(['ru', 'en']);
    });

    it('switches the active locale and persists the choice', async () => {
        const locale = useLocaleStore();

        await locale.set('en');

        expect(locale.current).toBe('en');
        expect(window.localStorage.getItem('tm.locale')).toBe('en');
    });

    it('is a no-op when asked to set the locale that is already active', async () => {
        const locale = useLocaleStore();

        await expect(locale.set('ru')).resolves.toBeUndefined();

        expect(locale.current).toBe('ru');
    });
});
