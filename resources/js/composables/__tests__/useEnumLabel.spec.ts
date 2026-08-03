import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { useEnumLabel } from '@/composables/useEnumLabel';
import { setLocale, setLocaleSync } from '@/i18n';
import { TASK_STATUSES } from '@/types/enums';

/** useI18n требует контекста компонента, поэтому composable вызывается внутри setup. */
function useInComponent() {
    let api!: ReturnType<typeof useEnumLabel>;

    mount(
        defineComponent({
            setup() {
                api = useEnumLabel();

                return () => null;
            },
        }),
    );

    return api;
}

beforeEach(() => {
    setLocaleSync('ru');
});

describe('enumLabel', () => {
    it('translates a known value', () => {
        expect(useInComponent().enumLabel('taskStatus', 'in_progress')).toBe('В работе');
        expect(useInComponent().enumLabel('role', 'admin')).toBe('Администратор');
    });

    /** Контракт прежнего labelFor: статус, добавленный на бэкенде, не должен ломать UI. */
    it('returns an unknown value as-is instead of the key path', () => {
        expect(useInComponent().enumLabel('taskStatus', 'on_hold')).toBe('on_hold');
    });

    it('follows the active locale', async () => {
        await setLocale('en');

        expect(useInComponent().enumLabel('taskStatus', 'in_progress')).toBe('In progress');
    });
});

describe('enumOptions', () => {
    it('builds select options in catalogue order', () => {
        expect(useInComponent().enumOptions('taskStatus', TASK_STATUSES).value).toEqual([
            { value: 'pending', label: 'Ожидает' },
            { value: 'in_progress', label: 'В работе' },
            { value: 'completed', label: 'Завершена' },
        ]);
    });

    it('recomputes the labels when the locale changes', async () => {
        const options = useInComponent().enumOptions('taskPriority', ['low']);

        expect(options.value[0]!.label).toBe('Низкий');

        await setLocale('en');

        expect(options.value[0]!.label).toBe('Low');
    });
});
