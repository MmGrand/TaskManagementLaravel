import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import * as projectsApi from '@/api/projects';
import ProjectsListView from '@/views/projects/ProjectsListView.vue';
import { chooseOption } from '@/tests/ui';
import { makePage, makeProject, makeRole, makeUser } from '@/tests/fixtures';
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
vi.mock('@/api/projects');

const mockedApi = vi.mocked(projectsApi);

async function mountAs(slug: RoleSlug, userId = 1) {
    const wrapper = mount(ProjectsListView, {
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

beforeEach(() => {
    vi.resetAllMocks();
    window.localStorage.clear();
    for (const key of Object.keys(routeQuery)) {
        delete routeQuery[key];
    }
    mockedApi.list.mockResolvedValue(makePage([]));
});

describe('loading', () => {
    it('renders a row per project', async () => {
        mockedApi.list.mockResolvedValue(
            makePage([makeProject({ id: 1, name: 'Альфа' }), makeProject({ id: 2, name: 'Бета' })]),
        );

        const wrapper = await mountAs('admin');

        expect(wrapper.findAll('tbody tr')).toHaveLength(2);
        expect(wrapper.text()).toContain('Альфа');
        expect(wrapper.text()).toContain('Бета');
    });

    it('shows the empty state when nothing came back', async () => {
        const wrapper = await mountAs('admin');

        expect(wrapper.text()).toContain('Проектов пока нет');
    });

    it('surfaces a load failure instead of an empty table', async () => {
        mockedApi.list.mockRejectedValue({ message: 'Действие запрещено.', isForbidden: true });

        const wrapper = await mountAs('user');

        expect(wrapper.text()).toContain('Действие запрещено.');
    });

    it('seeds the filter and the page from the URL', async () => {
        routeQuery.status = 'archived';
        routeQuery.page = '2';

        await mountAs('admin');

        expect(mockedApi.list).toHaveBeenCalledWith({ status: 'archived', page: 2 });
    });
});

describe('permissions', () => {
    it('offers creation only with projects.create', async () => {
        expect((await mountAs('manager')).text()).toContain('Создать проект');
        expect((await mountAs('user')).text()).not.toContain('Создать проект');
    });

    it('hides row actions on projects the manager does not own', async () => {
        mockedApi.list.mockResolvedValue(makePage([makeProject({ id: 1, created_by: 99 })]));

        const wrapper = await mountAs('manager', 5);

        expect(wrapper.text()).not.toContain('Изменить');
        expect(wrapper.text()).not.toContain('Удалить');
    });

    it('shows row actions on the manager’s own projects', async () => {
        mockedApi.list.mockResolvedValue(makePage([makeProject({ id: 1, created_by: 5 })]));

        const wrapper = await mountAs('manager', 5);

        expect(wrapper.text()).toContain('Изменить');
        expect(wrapper.text()).toContain('Удалить');
    });

    it('lets an admin act on projects they do not own', async () => {
        mockedApi.list.mockResolvedValue(makePage([makeProject({ id: 1, created_by: 99 })]));

        expect((await mountAs('admin', 1)).text()).toContain('Удалить');
    });
});

describe('filtering', () => {
    it('pushes the filter into the URL and resets to page 1', async () => {
        routeQuery.page = '3';
        const wrapper = await mountAs('admin');

        await chooseOption(wrapper, 0, 'Завершён');
        await flushPromises();

        expect(push).toHaveBeenCalledWith({ query: { status: 'completed' } });
    });
});
