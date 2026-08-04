import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TaskCard from '@/components/domain/tasks/board/TaskCard.vue';
import { makeTask } from '@/tests/fixtures';

function mountCard(movable = true) {
    return mount(TaskCard, {
        props: { task: makeTask({ id: 1, title: 'Задача' }), groupBy: 'status' as const, movable },
    });
}

function press(element: Element, type: string, x: number, y: number): void {
    element.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
}

describe('TaskCard', () => {
    it('opens on a click anywhere on the card, not just the title', async () => {
        const wrapper = mountCard();

        await wrapper.find('[data-task-id="1"]').trigger('click');

        expect(wrapper.emitted('open')).toHaveLength(1);
    });

    it('opens when a nested element is clicked', async () => {
        const wrapper = mountCard();

        await wrapper.find('h3').trigger('click');

        expect(wrapper.emitted('open')).toHaveLength(1);
    });

    it('stays closed when the pointer travelled far enough to be a drag', () => {
        const wrapper = mountCard();
        const card = wrapper.find('[data-task-id="1"]').element;

        press(card, 'pointerdown', 10, 10);
        press(card, 'click', 180, 90);

        expect(wrapper.emitted('open')).toBeUndefined();
    });

    it('opens when the pointer barely moved between press and release', () => {
        const wrapper = mountCard();
        const card = wrapper.find('[data-task-id="1"]').element;

        press(card, 'pointerdown', 10, 10);
        press(card, 'click', 12, 11);

        expect(wrapper.emitted('open')).toHaveLength(1);
    });

    it('opens from the keyboard', async () => {
        const wrapper = mountCard();

        await wrapper.find('[data-task-id="1"]').trigger('keydown.enter');

        expect(wrapper.emitted('open')).toHaveLength(1);
    });
});
