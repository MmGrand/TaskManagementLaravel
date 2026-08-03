import { ref } from 'vue';
import { isApiError } from '@/api/errors';
import { i18n } from '@/i18n';
import type { ApiError } from '@/types/api';

/**
 * Оборачивает обработчик отправки состоянием, нужным каждой форме здесь:
 * флаг ожидания, нормализованная ошибка и сообщения по полям из ответа 422.
 */
export function useApiForm() {
    const pending = ref(false);
    const error = ref<ApiError | null>(null);

    function fieldError(field: string): string | null {
        return error.value?.errors[field]?.[0] ?? null;
    }

    /** True, если ошибка не была проблемой валидации на уровне поля. */
    function generalMessage(): string | null {
        if (error.value === null) {
            return null;
        }

        return error.value.isValidation && Object.keys(error.value.errors).length > 0
            ? null
            : error.value.message;
    }

    function reset(): void {
        error.value = null;
    }

    /**
     * При успехе резолвится значением обработчика, при ошибке — `undefined`,
     * чтобы вызывающий код ветвился по результату, а не писал свой try/catch.
     */
    async function submit<T>(handler: () => Promise<T>): Promise<T | undefined> {
        pending.value = true;
        error.value = null;

        try {
            return await handler();
        } catch (caught) {
            error.value = isApiError(caught)
                ? caught
                : {
                      status: 0,
                      message: i18n.global.t('errors.unknown'),
                      errors: {},
                      isValidation: false,
                      isUnauthenticated: false,
                      isForbidden: false,
                      isNotFound: false,
                      isThrottled: false,
                      isNetwork: false,
                      isAccountDisabled: false,
                      retryAfter: null,
                  };

            return undefined;
        } finally {
            pending.value = false;
        }
    }

    return { pending, error, submit, fieldError, generalMessage, reset };
}
