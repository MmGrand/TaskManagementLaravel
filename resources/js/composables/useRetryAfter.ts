import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ApiError } from '@/types/api';

/**
 * Отсчитывает Retry-After для ответа 429.
 *
 * Эндпоинты авторизации разрешают 5 запросов в минуту с IP, это легко
 * превысить при вводе пароля, поэтому UI сообщает пользователю, сколько ждать,
 * вместо того чтобы позволять жать на кнопку, которая пока не сработает.
 */
export function useRetryAfter(error: Ref<ApiError | null>) {
    const { t } = useI18n();
    const secondsLeft = ref(0);
    let timer: ReturnType<typeof setInterval> | null = null;

    function stop(): void {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
    }

    function start(seconds: number): void {
        stop();
        secondsLeft.value = seconds;

        timer = setInterval(() => {
            secondsLeft.value -= 1;

            if (secondsLeft.value <= 0) {
                secondsLeft.value = 0;
                stop();
            }
        }, 1000);
    }

    watch(error, (next) => {
        if (next?.isThrottled) {
            // Без заголовка Retry-After берём окно лимитера по умолчанию.
            start(next.retryAfter ?? 60);
        } else if (next === null) {
            stop();
            secondsLeft.value = 0;
        }
    });

    onBeforeUnmount(stop);

    const isWaiting = computed(() => secondsLeft.value > 0);
    // Третий аргумент — счёт для плюрализации: русская форма одна, английских две.
    const message = computed(() =>
        isWaiting.value ? t('throttle.retryIn', { n: secondsLeft.value }, secondsLeft.value) : null,
    );

    return { secondsLeft, isWaiting, message };
}
