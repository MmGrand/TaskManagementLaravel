import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import * as tasksApi from '@/api/tasks';
import * as projectsApi from '@/api/projects';
import * as usersApi from '@/api/users';
import TasksListView from '@/views/tasks/TasksListView.vue';
import TaskForm from '@/components/domain/tasks/TaskForm.vue';
import TaskStatusOnlyForm from '@/components/domain/tasks/TaskStatusOnlyForm.vue';
import { chooseOption, comboboxes } from '@/tests/ui';
import { makePage, makeProject, makeRole, makeTask, makeUser } from '@/tests/fixtures';
import type { RoleSlug } from '@/types/enums';

const push = vi.fn();
const routeQuery: Record<string, string> = {};

vi.mock('vue-router', () => ({
    useRoute: () => ({ query: routeQuery }),
    useRouter: () => ({ push }),
}));
vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));
vi.mock('@/api/tasks');
vi.mock('@/api/projects');
vi.mock('@/api/users');

vi.mock('vue-draggable-plus', () => ({
    VueDraggable: {
        name: 'VueDraggable',
        props: { modelValue: { type: Array, default: () => [] } },
        emits: ['update:modelValue', 'start', 'end'],
        template: '<div class="vue-draggable-stub"><slot /></div>',
    },
}));

async function mountAs(slug: RoleSlug, userId = 1) {
    const wrapper = mount(TasksListView, {
        global: {
            plugins: [
                createTestingPinia({
                    createSpy: vi.fn,
                    stubActions: false,
                    initialState: {
                        auth: { token: 'tok', user: makeUser({ id: userId, role: makeRole(slug) }) },
                    },
                }),
            ],
            stubs: { RouterLink: RouterLinkStub },
        },
    });

    await flushPromises();

    return wrapper;
}

async function groupByOptions(wrapper: Awaited<ReturnType<typeof mountAs>>): Promise<string[]> {
    await comboboxes(wrapper).at(-1)!.trigger('click');

    return wrapper.findAll('[role="option"]').map((option) => option.text());
}

beforeEach(() => {
    vi.resetAllMocks();
    window.localStorage.clear();
    for (const key of Object.keys(routeQuery)) {
        delete routeQuery[key];
    }
    vi.mocked(tasksApi).list.mockResolvedValue(makePage([]));
    vi.mocked(projectsApi).list.mockResolvedValue(makePage([]));
    vi.mocked(usersApi).list.mockResolvedValue(makePage([]));
});

describe('listing', () => {
    it('sends the default sort on first load', async () => {
        await mountAs('admin');

        expect(vi.mocked(tasksApi).list).toHaveBeenCalledWith(
            expect.objectContaining({ sort_by: 'created_at', sort_direction: 'desc', page: 1 }),
        );
    });

    it('renders Russian status and priority labels', async () => {
        vi.mocked(tasksApi).list.mockResolvedValue(
            makePage([makeTask({ id: 1, title: 'Первая', status: 'in_progress', priority: 'high' })]),
        );

        const wrapper = await mountAs('admin');

        expect(wrapper.text()).toContain('В работе');
        expect(wrapper.text()).toContain('Высокий');
    });

    it('marks an overdue task', async () => {
        vi.mocked(tasksApi).list.mockResolvedValue(
            makePage([makeTask({ id: 1, due_date: '2000-01-01', status: 'pending' })]),
        );

        expect((await mountAs('admin')).text()).toContain('Просрочена');
    });

    it('shows the empty state when the filters match nothing', async () => {
        expect((await mountAs('admin')).text()).toContain('Задач не найдено');
    });

    it('seeds filters from the URL', async () => {
        routeQuery.status = 'completed';
        routeQuery.priority = 'low';
        routeQuery.sort_by = 'due_date';

        await mountAs('admin');

        expect(vi.mocked(tasksApi).list).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'completed', priority: 'low', sort_by: 'due_date' }),
        );
    });

    it('pushes a changed filter into the URL only after applying it', async () => {
        const wrapper = await mountAs('admin');

        await chooseOption(wrapper, 0, 'Завершена');
        await flushPromises();

        expect(push).not.toHaveBeenCalled();

        await wrapper.findAll('button').find((button) => button.text() === 'Применить')!.trigger('click');
        await flushPromises();

        expect(push).toHaveBeenCalledWith({ query: { status: 'completed' } });
    });
});

describe('the board view', () => {
    it('renders columns instead of the table', async () => {
        routeQuery.view = 'board';

        const wrapper = await mountAs('admin');

        expect(wrapper.find('table').exists()).toBe(false);
        expect(wrapper.text()).toContain('Ожидает');
        expect(wrapper.text()).toContain('В работе');
        expect(wrapper.text()).toContain('Завершена');
    });

    it('fetches one ranked page per status column', async () => {
        routeQuery.view = 'board';

        await mountAs('admin');

        const statuses = vi
            .mocked(tasksApi)
            .list.mock.calls.map(([filters]) => filters?.status);

        expect(statuses).toEqual(['pending', 'in_progress', 'completed']);
        expect(vi.mocked(tasksApi).list).toHaveBeenCalledWith(
            expect.objectContaining({ sort_by: 'position', sort_direction: 'asc', per_page: 50 }),
        );
    });

    it('puts the view in the URL when the toggle is used', async () => {
        const wrapper = await mountAs('admin');

        await wrapper.findAll('button').find((button) => button.text() === 'Доска')!.trigger('click');
        await flushPromises();

        expect(push).toHaveBeenCalledWith({ query: { view: 'board' } });
    });

    it('shows the column counters from the server total', async () => {
        routeQuery.view = 'board';
        vi.mocked(tasksApi).list.mockResolvedValue(makePage([makeTask({ id: 1 })], { total: 42 }));

        expect((await mountAs('admin')).text()).toContain('42');
    });

    it('hides grouping by assignee without users.viewAny', async () => {
        routeQuery.view = 'board';

        expect(await groupByOptions(await mountAs('user'))).not.toContain('По исполнителю');
        expect(await groupByOptions(await mountAs('manager'))).toContain('По исполнителю');
    });

    it('falls back to status when the URL asks for a grouping the role cannot use', async () => {
        routeQuery.view = 'board';
        routeQuery.group_by = 'assigned_to';

        await mountAs('user');

        const statuses = vi
            .mocked(tasksApi)
            .list.mock.calls.map(([filters]) => filters?.status);

        expect(statuses).toEqual(['pending', 'in_progress', 'completed']);
        expect(vi.mocked(usersApi).list).not.toHaveBeenCalled();
    });

    it('lets the column own the grouped dimension instead of the filter', async () => {
        routeQuery.view = 'board';
        routeQuery.group_by = 'priority';
        routeQuery.priority = 'high';

        await mountAs('admin');

        const sent = vi.mocked(tasksApi).list.mock.calls.map(([filters]) => filters);

        expect(sent.map((filters) => filters?.priority)).toEqual(['low', 'medium', 'high']);
    });

    it('offers quick add per column only with tasks.create', async () => {
        routeQuery.view = 'board';

        expect((await mountAs('manager')).text()).toContain('Добавить задачу');
        expect((await mountAs('user')).text()).not.toContain('Добавить задачу');
    });
});

describe('permissions', () => {
    it('offers creation only with tasks.create', async () => {
        expect((await mountAs('manager')).text()).toContain('Создать задачу');
        expect((await mountAs('user')).text()).not.toContain('Создать задачу');
    });

    it('lets an assignee edit but not delete', async () => {
        vi.mocked(tasksApi).list.mockResolvedValue(
            makePage([makeTask({ id: 1, created_by: 99, assigned_to: 4 })]),
        );

        const wrapper = await mountAs('user', 4);

        expect(wrapper.text()).toContain('Изменить');
        expect(wrapper.text()).not.toContain('Удалить');
    });
});

describe('the dynamic edit form', () => {
    it('gives an assignee the status-only form', async () => {
        vi.mocked(tasksApi).list.mockResolvedValue(
            makePage([makeTask({ id: 1, created_by: 99, assigned_to: 4, project: makeProject({ created_by: 99 }) })]),
        );

        const wrapper = await mountAs('user', 4);
        await wrapper.findAll('tbody button')[0]!.trigger('click');
        await flushPromises();

        expect(wrapper.findComponent(TaskStatusOnlyForm).exists()).toBe(true);
        expect(wrapper.findComponent(TaskForm).exists()).toBe(false);
    });

    it('gives the task creator the full form', async () => {
        vi.mocked(tasksApi).list.mockResolvedValue(
            makePage([makeTask({ id: 1, created_by: 5, assigned_to: 9 })]),
        );

        const wrapper = await mountAs('manager', 5);
        await wrapper.findAll('tbody button')[0]!.trigger('click');
        await flushPromises();

        expect(wrapper.findComponent(TaskForm).exists()).toBe(true);
        expect(wrapper.findComponent(TaskStatusOnlyForm).exists()).toBe(false);
    });

    it('gives the manager who owns the project the full form', async () => {
        vi.mocked(tasksApi).list.mockResolvedValue(
            makePage([
                makeTask({ id: 1, created_by: 99, assigned_to: 99, project: makeProject({ created_by: 5 }) }),
            ]),
        );

        const wrapper = await mountAs('manager', 5);
        await wrapper.findAll('tbody button')[0]!.trigger('click');
        await flushPromises();

        expect(wrapper.findComponent(TaskForm).exists()).toBe(true);
    });

    it('gives an admin the full form on someone else’s task', async () => {
        vi.mocked(tasksApi).list.mockResolvedValue(
            makePage([makeTask({ id: 1, created_by: 99, assigned_to: 99 })]),
        );

        const wrapper = await mountAs('admin', 1);
        await wrapper.findAll('tbody button')[0]!.trigger('click');
        await flushPromises();

        expect(wrapper.findComponent(TaskForm).exists()).toBe(true);
    });

    it('sends only the status when the assignee submits', async () => {
        vi.mocked(tasksApi).list.mockResolvedValue(
            makePage([makeTask({ id: 1, created_by: 99, assigned_to: 4, status: 'pending' })]),
        );
        vi.mocked(tasksApi).update.mockResolvedValue(makeTask({ id: 1, status: 'in_progress' }));

        const wrapper = await mountAs('user', 4);
        await wrapper.findAll('tbody button')[0]!.trigger('click');
        await flushPromises();

        const statusForm = wrapper.findComponent(TaskStatusOnlyForm);
        await chooseOption(statusForm, 0, 'В работе');
        await statusForm.find('form').trigger('submit');
        await flushPromises();

        expect(vi.mocked(tasksApi).update).toHaveBeenCalledWith(1, { status: 'in_progress' });
    });
});
