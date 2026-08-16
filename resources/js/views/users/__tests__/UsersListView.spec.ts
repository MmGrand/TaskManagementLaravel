import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import * as usersApi from '@/api/users';
import UsersListView from '@/views/users/UsersListView.vue';
import { makePage, makeRole, makeUser } from '@/tests/fixtures';
import type { RoleSlug } from '@/types/enums';

const routeQuery: Record<string, string> = {};

vi.mock('vue-router', () => ({
    useRoute: () => ({ query: routeQuery }),
    useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));
vi.mock('@/api/users');

const mockedApi = vi.mocked(usersApi);

async function mountAs(slug: RoleSlug, userId = 1) {
    const wrapper = mount(UsersListView, {
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
    it('renders a row per user', async () => {
        mockedApi.list.mockResolvedValue(
            makePage([makeUser({ id: 1, first_name: 'Иван' }), makeUser({ id: 2, first_name: 'Пётр' })]),
        );

        const wrapper = await mountAs('admin');

        expect(wrapper.findAll('tbody tr')).toHaveLength(2);
        expect(wrapper.text()).toContain('Иван');
        expect(wrapper.text()).toContain('Пётр');
    });

    it('shows the empty state when nothing came back', async () => {
        const wrapper = await mountAs('admin');

        expect(wrapper.text()).toContain('Пользователей не найдено');
    });

    it('surfaces a load failure instead of an empty table', async () => {
        mockedApi.list.mockRejectedValue({ message: 'Внутренняя ошибка сервера.', isForbidden: false });

        const wrapper = await mountAs('admin');

        expect(wrapper.text()).toContain('Внутренняя ошибка сервера.');
    });
});
