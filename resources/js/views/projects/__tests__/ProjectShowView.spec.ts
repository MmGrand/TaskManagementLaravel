import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import * as projectsApi from '@/api/projects';
import ProjectShowView from '@/views/projects/ProjectShowView.vue';
import { makeProject, makeRole, makeUser } from '@/tests/fixtures';

const route = reactive({ params: { id: '1' } });

vi.mock('vue-router', () => ({
    useRoute: () => route,
}));
vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));
vi.mock('@/api/projects');

// `route` реактивный (нужно проверить watch по :id), поэтому предыдущий
// смонтированный экран обязательно размонтируем — иначе его watcher переживёт
// тест и среагирует на мутацию route в соседнем.
let activeWrapper: VueWrapper | null = null;

beforeEach(() => {
    vi.resetAllMocks();
    route.params.id = '1';
});

afterEach(() => {
    activeWrapper?.unmount();
    activeWrapper = null;
});

async function mountView() {
    const wrapper = mount(ProjectShowView, {
        global: {
            plugins: [
                createTestingPinia({
                    createSpy: vi.fn,
                    stubActions: false,
                    initialState: { auth: { token: 'tok', user: makeUser({ id: 1, role: makeRole('admin') }) } },
                }),
            ],
            stubs: { RouterLink: true },
        },
    });

    activeWrapper = wrapper;
    await flushPromises();

    return wrapper;
}

describe('ProjectShowView', () => {
    it('loads the project named in the route', async () => {
        vi.mocked(projectsApi).show.mockResolvedValue(makeProject({ id: 1, name: 'Первый проект' }));

        const wrapper = await mountView();

        expect(projectsApi.show).toHaveBeenCalledWith(1);
        expect(wrapper.text()).toContain('Первый проект');
    });

    it('reloads instead of keeping the previous project when the route id changes without a remount', async () => {
        vi.mocked(projectsApi)
            .show.mockResolvedValueOnce(makeProject({ id: 1, name: 'Первый проект' }))
            .mockResolvedValueOnce(makeProject({ id: 2, name: 'Второй проект' }));

        const wrapper = await mountView();

        expect(wrapper.text()).toContain('Первый проект');

        route.params.id = '2';
        await flushPromises();

        expect(projectsApi.show).toHaveBeenLastCalledWith(2);
        expect(wrapper.text()).toContain('Второй проект');
        expect(wrapper.text()).not.toContain('Первый проект');
    });
});
