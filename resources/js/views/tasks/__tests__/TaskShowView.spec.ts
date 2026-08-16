import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import * as tasksApi from '@/api/tasks';
import TaskShowView from '@/views/tasks/TaskShowView.vue';
import { makeRole, makeTask, makeUser } from '@/tests/fixtures';

const route = reactive({ params: { id: '1' } });

vi.mock('vue-router', () => ({
    useRoute: () => route,
}));
vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));
vi.mock('@/api/tasks');

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
    const wrapper = mount(TaskShowView, {
        global: {
            plugins: [
                createTestingPinia({
                    createSpy: vi.fn,
                    stubActions: false,
                    initialState: { auth: { token: 'tok', user: makeUser({ id: 1, role: makeRole('admin') }) } },
                }),
            ],
        },
    });

    activeWrapper = wrapper;
    await flushPromises();

    return wrapper;
}

describe('TaskShowView', () => {
    it('loads the task named in the route', async () => {
        vi.mocked(tasksApi).show.mockResolvedValue(makeTask({ id: 1, title: 'Первая задача' }));

        const wrapper = await mountView();

        expect(tasksApi.show).toHaveBeenCalledWith(1);
        expect(wrapper.text()).toContain('Первая задача');
    });

    it('reloads instead of keeping the previous task when the route id changes without a remount', async () => {
        vi.mocked(tasksApi)
            .show.mockResolvedValueOnce(makeTask({ id: 1, title: 'Первая задача' }))
            .mockResolvedValueOnce(makeTask({ id: 2, title: 'Вторая задача' }));

        const wrapper = await mountView();

        expect(wrapper.text()).toContain('Первая задача');

        route.params.id = '2';
        await flushPromises();

        expect(tasksApi.show).toHaveBeenLastCalledWith(2);
        expect(wrapper.text()).toContain('Вторая задача');
        expect(wrapper.text()).not.toContain('Первая задача');
    });

    it('shows a load error instead of the previous task on a failed reload', async () => {
        vi.mocked(tasksApi)
            .show.mockResolvedValueOnce(makeTask({ id: 1, title: 'Первая задача' }))
            .mockRejectedValueOnce({ message: 'Не удалось загрузить.', isForbidden: false });

        const wrapper = await mountView();
        expect(wrapper.text()).toContain('Первая задача');

        route.params.id = '2';
        await flushPromises();

        expect(wrapper.text()).toContain('Не удалось загрузить.');
        expect(wrapper.text()).not.toContain('Первая задача');
    });
});
