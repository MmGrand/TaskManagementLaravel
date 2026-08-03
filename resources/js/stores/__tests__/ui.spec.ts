import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useUiStore } from '@/stores/ui';

beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
});

afterEach(() => {
    vi.useRealTimers();
});

describe('toasts', () => {
    it('pushes and dismisses by id', () => {
        const ui = useUiStore();
        const id = ui.success('Сохранено');

        expect(ui.toasts).toHaveLength(1);
        expect(ui.toasts[0]!.tone).toBe('success');

        ui.dismiss(id);
        expect(ui.toasts).toHaveLength(0);
    });

    it('auto-dismisses after the timeout', () => {
        const ui = useUiStore();
        ui.error('Что-то пошло не так');

        expect(ui.toasts).toHaveLength(1);

        vi.advanceTimersByTime(5000);

        expect(ui.toasts).toHaveLength(0);
    });

    it('trims the oldest once the stack is full', () => {
        const ui = useUiStore();

        for (let i = 1; i <= 6; i++) {
            ui.push(`Сообщение ${i}`);
        }

        expect(ui.toasts).toHaveLength(4);
        expect(ui.toasts[0]!.message).toBe('Сообщение 3');
        expect(ui.toasts[3]!.message).toBe('Сообщение 6');
    });
});
