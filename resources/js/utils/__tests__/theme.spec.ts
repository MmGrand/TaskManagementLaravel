import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stubMatchMedia } from '@/tests/media';
import {
    applyTheme,
    detectTheme,
    prefersDark,
    readStoredTheme,
    watchSystemTheme,
    writeStoredTheme,
} from '@/utils/theme';

beforeEach(() => {
    window.localStorage.clear();
});

describe('readStoredTheme', () => {
    it('returns the saved mode', () => {
        writeStoredTheme('dark');

        expect(readStoredTheme()).toBe('dark');
    });

    it('ignores a value that is not a known mode', () => {
        window.localStorage.setItem('tm.theme', 'purple');

        expect(readStoredTheme()).toBeNull();
    });

    it('survives a storage that throws', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('quota exceeded');
        });
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('access denied');
        });

        expect(() => writeStoredTheme('dark')).not.toThrow();
        expect(readStoredTheme()).toBeNull();

        vi.restoreAllMocks();
    });
});

describe('detectTheme', () => {
    it('follows the system when nothing is saved', () => {
        expect(detectTheme()).toBe('system');
    });

    it('prefers the saved mode over the system', () => {
        writeStoredTheme('light');

        expect(detectTheme()).toBe('light');
    });
});

describe('prefersDark', () => {
    it('mirrors the media query', () => {
        stubMatchMedia(true);

        expect(prefersDark()).toBe(true);
    });

    it('falls back to light where matchMedia is missing', () => {
        vi.stubGlobal('matchMedia', undefined);

        expect(prefersDark()).toBe(false);
    });
});

describe('watchSystemTheme', () => {
    it('reports the change and unsubscribes', () => {
        const media = stubMatchMedia(false);
        const onChange = vi.fn();

        const stop = watchSystemTheme(onChange);
        media.setMatches(true);

        expect(onChange).toHaveBeenCalledWith(true);

        stop();
        media.setMatches(false);

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(media.listenerCount()).toBe(0);
    });

    it('returns a no-op where matchMedia is missing', () => {
        vi.stubGlobal('matchMedia', undefined);

        expect(() => watchSystemTheme(vi.fn())()).not.toThrow();
    });
});

describe('applyTheme', () => {
    it('toggles the class the blade script sets before the first frame', () => {
        applyTheme(true);
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        applyTheme(false);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
});
