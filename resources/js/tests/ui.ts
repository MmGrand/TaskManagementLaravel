import type { DOMWrapper, VueWrapper } from '@vue/test-utils';

type Queryable = Pick<VueWrapper, 'findAll'>;

export function comboboxes(wrapper: Queryable): DOMWrapper<Element>[] {
    return wrapper.findAll('[role="combobox"]');
}

/**
 * AppSelect — не нативный `<select>`, поэтому выбор варианта в тестах повторяет
 * действия пользователя: раскрыть список и кликнуть по строке с подписью.
 */
export async function chooseOption(wrapper: Queryable, index: number, label: string): Promise<void> {
    const trigger = comboboxes(wrapper)[index];

    if (trigger === undefined) {
        throw new Error(`There is no select #${index} on the screen.`);
    }

    await trigger.trigger('click');

    const option = wrapper.findAll('[role="option"]').find((candidate) => candidate.text() === label);

    if (option === undefined) {
        throw new Error(`The select #${index} does not offer "${label}".`);
    }

    await option.trigger('click');
}
