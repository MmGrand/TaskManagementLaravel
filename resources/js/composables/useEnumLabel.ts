import { computed } from 'vue';
import type { ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SelectOption } from '@/components/ui/AppSelect.vue';

/** Ключи верхнего уровня внутри `enums.*` в файлах локалей. */
export type EnumGroup = 'taskStatus' | 'taskPriority' | 'projectStatus' | 'userStatus' | 'role';

/**
 * Подписи к строковым enum'ам из app/Enums. Заменяет прежние словари
 * `*_LABELS` и `labelFor` из @/types/enums.
 */
export function useEnumLabel() {
    const { t, te } = useI18n();

    /**
     * Сохраняет контракт прежнего labelFor: статус, добавленный на бэкенде,
     * рендерится своим slug'ом, а не «undefined» и не путём ключа. `te` заодно
     * глушит варнинг intlify о ненайденном ключе.
     */
    function enumLabel(group: EnumGroup, value: string): string {
        const key = `enums.${group}.${value}`;

        return te(key) ? t(key) : value;
    }

    /**
     * Опции для AppSelect. Возвращается computed, иначе подписи «замёрзнут»
     * на языке, активном в момент вызова setup().
     */
    function enumOptions(group: EnumGroup, values: readonly string[]): ComputedRef<SelectOption[]> {
        return computed(() => values.map((value) => ({ value, label: enumLabel(group, value) })));
    }

    return { enumLabel, enumOptions };
}
