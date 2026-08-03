import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import * as statisticsApi from '@/api/statistics';
import * as tasksApi from '@/api/tasks';
import { http } from '@/api/http';
import DashboardView from '@/views/DashboardView.vue';
import { makePage, makeRole, makeTask, makeUser } from '@/tests/fixtures';
import type { RoleSlug } from '@/types/enums';
import type { Statistics } from '@/types/models';

vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));
vi.mock('@/api/statistics');
vi.mock('@/api/tasks');

function makeStatistics(overrides: Partial<Statistics> = {}): Statistics {
    return {
        projects_count: 3,
        tasks_count: 12,
        tasks_by_status: { pending: 7, in_progress: 4, completed: 1 },
        overdue_tasks_count: 2,
        top_active_users: [
            {
                id: 2,
                first_name: 'Мария',
                last_name: 'Иванова',
                email: 'maria@example.com',
                tasks_created_count: 9,
            },
        ],
        ...overrides,
    };
}

async function mountAs(slug: RoleSlug) {
    const wrapper = mount(DashboardView, {
        global: {
            plugins: [
                createTestingPinia({
                    createSpy: vi.fn,
                    stubActions: false,
                    initialState: { auth: { token: 'tok', user: makeUser({ role: makeRole(slug) }) } },
                }),
            ],
            stubs: { RouterLink: RouterLinkStub },
        },
    });

    await flushPromises();

    return wrapper;
}

beforeEach(() => {
    vi.resetAllMocks();
    window.localStorage.clear();
    vi.mocked(statisticsApi).summary.mockResolvedValue(makeStatistics());
    vi.mocked(tasksApi).list.mockResolvedValue(makePage([]));
});

describe('with statistics.view', () => {
    it('renders the counters', async () => {
        const wrapper = await mountAs('manager');

        expect(wrapper.text()).toContain('Проектов');
        expect(wrapper.text()).toContain('12');
        expect(wrapper.text()).toContain('Просрочено');
    });

    it('renders the status breakdown with Russian labels', async () => {
        const wrapper = await mountAs('admin');

        expect(wrapper.text()).toContain('Ожидает');
        expect(wrapper.text()).toContain('В работе');
        expect(wrapper.text()).toContain('Завершена');
    });

    it('renders the top active users', async () => {
        const wrapper = await mountAs('admin');

        expect(wrapper.text()).toContain('Мария Иванова');
        expect(wrapper.text()).toContain('9');
    });

    it('shows the empty state when nobody has created a task', async () => {
        vi.mocked(statisticsApi).summary.mockResolvedValue(makeStatistics({ top_active_users: [] }));

        expect((await mountAs('admin')).text()).toContain('Пока нет данных');
    });

    it('renders a zero for a status the payload omitted', async () => {
        vi.mocked(statisticsApi).summary.mockResolvedValue(
            makeStatistics({
                tasks_by_status: { pending: 5 } as Statistics['tasks_by_status'],
            }),
        );

        const wrapper = await mountAs('admin');

        expect(wrapper.text()).toContain('Завершена');
        expect(wrapper.text()).not.toContain('undefined');
    });

    it('refetches exactly once when refreshed', async () => {
        const wrapper = await mountAs('admin');
        expect(statisticsApi.summary).toHaveBeenCalledTimes(1);

        await wrapper.find('button').trigger('click');
        await flushPromises();

        expect(statisticsApi.summary).toHaveBeenCalledTimes(2);
    });

    it('surfaces a load failure', async () => {
        vi.mocked(statisticsApi).summary.mockRejectedValue({ message: 'Действие запрещено.', isForbidden: true });

        expect((await mountAs('manager')).text()).toContain('Действие запрещено.');
    });
});

describe('without statistics.view', () => {
    it('shows the personal task list instead of requesting the statistics endpoint', async () => {
        vi.mocked(tasksApi).list.mockResolvedValue(makePage([makeTask({ id: 1, title: 'Моя задача' })]));

        const wrapper = await mountAs('user');

        expect(statisticsApi.summary).not.toHaveBeenCalled();
        expect(tasksApi.list).toHaveBeenCalledWith(
            expect.objectContaining({ assigned_to: '1', sort_by: 'due_date', sort_direction: 'asc' }),
        );
        expect(wrapper.text()).toContain('Мои задачи');
        expect(wrapper.text()).toContain('Моя задача');
    });

    it('shows an empty state when nothing is assigned', async () => {
        expect((await mountAs('user')).text()).toContain('Вам пока не назначено ни одной задачи');
    });

    it('refetches my tasks when refreshed', async () => {
        const wrapper = await mountAs('user');
        expect(tasksApi.list).toHaveBeenCalledTimes(1);

        await wrapper.find('button').trigger('click');
        await flushPromises();

        expect(tasksApi.list).toHaveBeenCalledTimes(2);
        expect(statisticsApi.summary).not.toHaveBeenCalled();
    });
});

describe('statistics api', () => {
    it('reads the bare object, not a data envelope', async () => {
        vi.doUnmock('@/api/statistics');
        const actual = await vi.importActual<typeof statisticsApi>('@/api/statistics');
        const payload = makeStatistics();

        vi.mocked(http).get.mockResolvedValue({ data: payload });

        await expect(actual.summary()).resolves.toBe(payload);
        expect(vi.mocked(http).get).toHaveBeenCalledWith('/statistics');
    });
});
