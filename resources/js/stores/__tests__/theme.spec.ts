import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { useThemeStore } from '@/stores/theme';
import { stubMatchMedia } from '@/tests/media';
import { readStoredTheme, writeStoredTheme } from '@/utils/theme';

function isDarkApplied(): boolean {
    return document.documentElement.classList.contains('dark');
}

beforeEach(() => {
    window.localStorage.clear();
    setActivePinia(createPinia());
});

describe('initial mode', () => {
    it('follows the system when nothing is saved', () => {
        stubMatchMedia(true);

        const theme = useThemeStore();

        expect(theme.mode).toBe('system');
        expect(theme.isDark).toBe(true);
    });

    it('restores the saved mode regardless of the system', () => {
        stubMatchMedia(true);
        writeStoredTheme('light');

        const theme = useThemeStore();

        expect(theme.mode).toBe('light');
        expect(theme.isDark).toBe(false);
    });
});

describe('set', () => {
    it('applies the class and persists the choice', async () => {
        const theme = useThemeStore();

        theme.set('dark');
        await nextTick();

        expect(theme.isDark).toBe(true);
        expect(isDarkApplied()).toBe(true);
        expect(readStoredTheme()).toBe('dark');

        theme.set('light');
        await nextTick();

        expect(isDarkApplied()).toBe(false);
        expect(readStoredTheme()).toBe('light');
    });
});

describe('system mode', () => {
    it('follows a system change without a reload', async () => {
        const media = stubMatchMedia(false);
        const theme = useThemeStore();

        media.setMatches(true);
        await nextTick();

        expect(theme.isDark).toBe(true);
        expect(isDarkApplied()).toBe(true);
    });

    it('ignores a system change while the mode is explicit', async () => {
        const media = stubMatchMedia(false);
        const theme = useThemeStore();

        theme.set('light');
        media.setMatches(true);
        await nextTick();

        expect(theme.isDark).toBe(false);
        expect(isDarkApplied()).toBe(false);
    });
});
