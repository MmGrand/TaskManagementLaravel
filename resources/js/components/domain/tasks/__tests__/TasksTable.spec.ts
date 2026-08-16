import { describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import TasksTable from '@/components/domain/tasks/TasksTable.vue';
import { makeRole, makeTask, makeUser } from '@/tests/fixtures';
import type { RoleSlug } from '@/types/enums';
import type { Task } from '@/types/models';

function mountTable(tasks: Task[], slug: RoleSlug = 'admin', userId = 1) {
    return mount(TasksTable, {
        props: { tasks },
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

describe('TasksTable', () => {
    it('renders a row per task with its title, project and assignee', () => {
        const wrapper = mountTable([
            makeTask({
                id: 1,
                title: 'Первая задача',
                assigned_user: { id: 2, first_name: 'Мария', last_name: 'Иванова', avatar: null },
            }),
        ]);

        expect(wrapper.findAll('tbody tr')).toHaveLength(1);
        expect(wrapper.text()).toContain('Первая задача');
        expect(wrapper.text()).toContain('Мария Иванова');
    });

    it('flags an overdue task', () => {
        const wrapper = mountTable([
            makeTask({ id: 1, due_date: '2000-01-01', status: 'pending' }),
        ]);

        expect(wrapper.text()).toContain('Просрочена');
    });

    it('lets an admin edit and delete any task', () => {
        const wrapper = mountTable([makeTask({ id: 1, created_by: 99 })], 'admin', 1);

        expect(wrapper.text()).toContain('Изменить');
        expect(wrapper.text()).toContain('Удалить');
    });

    it('hides row actions from a user unrelated to the task', () => {
        const wrapper = mountTable([makeTask({ id: 1, created_by: 99, assigned_to: 98 })], 'user', 1);

        expect(wrapper.text()).not.toContain('Изменить');
        expect(wrapper.text()).not.toContain('Удалить');
    });

    it('emits edit and delete with the clicked task', async () => {
        const task = makeTask({ id: 1 });
        const wrapper = mountTable([task]);

        await wrapper.find('button').trigger('click');

        expect(wrapper.emitted('edit')![0]![0]).toEqual(task);
    });
});
