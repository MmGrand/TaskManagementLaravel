import { ref } from 'vue';
import { defineStore } from 'pinia';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
    id: number;
    tone: ToastTone;
    message: string;
}

const AUTO_DISMISS_MS = 5000;
const MAX_VISIBLE = 4;

export const useUiStore = defineStore('ui', () => {
    const toasts = ref<Toast[]>([]);
    const timers = new Map<number, ReturnType<typeof setTimeout>>();
    let nextId = 1;

    function dismiss(id: number): void {
        toasts.value = toasts.value.filter((toast) => toast.id !== id);

        const timer = timers.get(id);

        if (timer !== undefined) {
            clearTimeout(timer);
            timers.delete(id);
        }
    }

    function push(message: string, tone: ToastTone = 'info'): number {
        const id = nextId++;

        toasts.value = [...toasts.value, { id, tone, message }];

        // Сначала самые старые: обрезаем с начала, чтобы новые оставались видимыми.
        while (toasts.value.length > MAX_VISIBLE) {
            dismiss(toasts.value[0]!.id);
        }

        timers.set(
            id,
            setTimeout(() => dismiss(id), AUTO_DISMISS_MS),
        );

        return id;
    }

    const success = (message: string): number => push(message, 'success');
    const error = (message: string): number => push(message, 'error');

    return { toasts, push, success, error, dismiss };
});
