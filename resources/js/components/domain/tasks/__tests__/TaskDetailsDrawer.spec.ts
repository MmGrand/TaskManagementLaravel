import { describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import TaskDetailsDrawer from '@/components/domain/tasks/TaskDetailsDrawer.vue';
import { makeRole, makeTask, makeUser } from '@/tests/fixtures';
import type { RoleSlug } from '@/types/enums';
import type { Task } from '@/types/models';

function mountDrawer(task: Task | null, slug: RoleSlug = 'admin', userId = 1) {
    return mount(TaskDetailsDrawer, {
        props: { open: true, task },
        global: {
            plugins: [
                createTestingPinia({
                    createSpy: vi.fn,
                    stubActions: false,
                    initialState: { auth: { token: 'tok', user: makeUser({ id: userId, role: makeRole(slug) }) } },
                }),
            ],
            stubs: { RouterLink: RouterLinkStub },
        },
    });
}

describe('TaskDetailsDrawer', () => {
    it('renders nothing about a task while none is selected', () => {
        const wrapper = mountDrawer(null);

        expect(wrapper.text()).not.toContain('Изменить');
    });

    it('shows the task title and a link to its full page', () => {
        const wrapper = mountDrawer(makeTask({ id: 7, title: 'Проверка дрена' }));

        expect(wrapper.text()).toContain('Проверка дрена');

        // TaskSummary тоже рендерит свою RouterLink (на проект), поэтому ищем
        // именно ссылку на полную страницу задачи, а не первую попавшуюся.
        const taskLink = wrapper
            .findAllComponents(RouterLinkStub)
            .find((link) => (link.props('to') as { name?: string }).name === 'task');

        expect(taskLink?.props('to')).toEqual({ name: 'task', params: { id: 7 } });
    });

    it('offers edit and delete to an admin', () => {
        const wrapper = mountDrawer(makeTask({ id: 1, created_by: 99 }));

        expect(wrapper.text()).toContain('Изменить');
        expect(wrapper.text()).toContain('Удалить');
    });

    it('hides edit and delete from a user unrelated to the task', () => {
        const wrapper = mountDrawer(makeTask({ id: 1, created_by: 99, assigned_to: 98 }), 'user', 1);

        expect(wrapper.text()).not.toContain('Изменить');
        expect(wrapper.text()).not.toContain('Удалить');
    });

    it('emits edit with the current task', async () => {
        const task = makeTask({ id: 1 });
        const wrapper = mountDrawer(task);

        await wrapper.findAll('button').find((button) => button.text() === 'Изменить')!.trigger('click');

        expect(wrapper.emitted('edit')![0]![0]).toEqual(task);
    });

    it('emits close when the drawer is dismissed', async () => {
        const wrapper = mountDrawer(makeTask({ id: 1 }));

        await wrapper.find('[aria-label="Закрыть"]').trigger('click');

        expect(wrapper.emitted('close')).toHaveLength(1);
    });
});
