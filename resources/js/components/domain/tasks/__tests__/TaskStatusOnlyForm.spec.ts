import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TaskStatusOnlyForm from '@/components/domain/tasks/TaskStatusOnlyForm.vue';
import { chooseOption, comboboxes } from '@/tests/ui';
import { makeTask } from '@/tests/fixtures';

function mountForm(props: Record<string, unknown> = {}) {
    return mount(TaskStatusOnlyForm, { props: { task: makeTask({ id: 1, status: 'pending' }), ...props } });
}

describe('TaskStatusOnlyForm', () => {
    it('preselects the task’s current status', () => {
        const wrapper = mountForm();

        expect(comboboxes(wrapper)[0]!.text()).toContain('Ожидает');
    });

    it('emits only the status on submit', async () => {
        const wrapper = mountForm();

        await chooseOption(wrapper, 0, 'Завершена');
        await wrapper.find('form').trigger('submit');

        expect(wrapper.emitted('submit')![0]![0]).toEqual({ status: 'completed' });
    });

    it('follows the task prop when a different task is assigned', async () => {
        const wrapper = mountForm();

        await wrapper.setProps({ task: makeTask({ id: 1, status: 'in_progress' }) });

        expect(comboboxes(wrapper)[0]!.text()).toContain('В работе');
    });

    it('shows the status-specific server error', () => {
        const wrapper = mountForm({
            error: { message: 'Проверьте поля.', isValidation: true, errors: { status: ['Недопустимый переход статуса.'] } },
        });

        expect(wrapper.text()).toContain('Недопустимый переход статуса.');
    });

    it('emits cancel', async () => {
        const wrapper = mountForm();

        await wrapper.findAll('button').find((button) => button.text() === 'Отмена')!.trigger('click');

        expect(wrapper.emitted('cancel')).toHaveLength(1);
    });
});
