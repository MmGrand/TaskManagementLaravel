import { computed } from 'vue';
import { defineStore } from 'pinia';
import { setLocale } from '@/i18n';
import { activeLocale, type LocaleCode } from '@/i18n/locale-state';
import { SUPPORTED_LOCALES } from '@/i18n/locales';

/**
 * Тонкий фасад над i18n для компонентов: значение принадлежит i18n, стор его
 * только читает и делегирует смену.
 *
 * Зависимость строго односторонняя — i18n не должен импортировать стор, иначе
 * router/guards.ts и api/errors.ts транзитивно потребуют активной Pinia.
 */
export const useLocaleStore = defineStore('locale', () => {
    const current = computed(() => activeLocale.value);
    const available = SUPPORTED_LOCALES;

    /** Догружает сообщения, обновляет состояние и сохраняет выбор в localStorage. */
    async function set(locale: LocaleCode): Promise<void> {
        if (locale !== activeLocale.value) {
            await setLocale(locale);
        }
    }

    return { current, available, set };
});
