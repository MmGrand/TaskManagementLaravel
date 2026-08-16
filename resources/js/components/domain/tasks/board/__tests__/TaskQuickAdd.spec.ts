import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TaskQuickAdd from '@/components/domain/tasks/board/TaskQuickAdd.vue';

function mountQuickAdd(projectId = '3') {
    return mount(TaskQuickAdd, {
        props: { pending: false, projectId, projectOptions: [] },
    });
}

describe('TaskQuickAdd', () => {
    it('starts closed and reveals the form on click', async () => {
        const wrapper = mountQuickAdd();

        expect(wrapper.find('form').exists()).toBe(false);

        await wrapper.find('button').trigger('click');

        expect(wrapper.find('form').exists()).toBe(true);
    });

    it('emits the trimmed title on submit', async () => {
        const wrapper = mountQuickAdd();
        await wrapper.find('button').trigger('click');

        await wrapper.find('input').setValue('  Новая задача  ');
        await wrapper.find('form').trigger('submit');

        expect(wrapper.emitted('submit')![0]![0]).toEqual({ title: 'Новая задача', projectId: '3' });
    });

    it('blocks submission and explains why once the title exceeds 255 characters', async () => {
        const wrapper = mountQuickAdd();
        await wrapper.find('button').trigger('click');

        await wrapper.find('input').setValue('a'.repeat(256));

        expect(wrapper.text()).toContain('Не длиннее 255 символов.');
        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();

        await wrapper.find('form').trigger('submit');

        expect(wrapper.emitted('submit')).toBeUndefined();
    });

    it('clears the title when cancelled', async () => {
        const wrapper = mountQuickAdd();
        await wrapper.find('button').trigger('click');

        await wrapper.find('input').setValue('Черновик');
        await wrapper.find('button[type="button"]').trigger('click');
        await wrapper.find('button').trigger('click');

        expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
    });
});
