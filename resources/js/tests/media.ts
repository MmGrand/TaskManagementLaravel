import { vi } from 'vitest';

export interface MatchMediaStub {
    /** Меняет ответ запроса и уведомляет подписчиков, как это делает браузер. */
    setMatches(matches: boolean): void;
    listenerCount(): number;
}

/**
 * jsdom не реализует matchMedia, а на нём держится определение системной темы.
 * Заглушка ставится глобально в setup.ts и переопределяется в спеках, которым
 * нужно управлять ответом и событием change.
 */
export function stubMatchMedia(initialMatches = false): MatchMediaStub {
    let matches = initialMatches;
    const listeners = new Set<(event: MediaQueryListEvent) => void>();

    vi.stubGlobal('matchMedia', (media: string) => ({
        media,
        get matches() {
            return matches;
        },
        addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
            listeners.add(listener);
        },
        removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
            listeners.delete(listener);
        },
    }));

    return {
        setMatches(next: boolean): void {
            matches = next;
            listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent));
        },
        listenerCount: () => listeners.size,
    };
}
