import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, reactive } from 'vue';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { useListQuery } from '@/composables/useListQuery';

// `route.query` — а не его поля — переприсваивается целиком на каждую
// навигацию: так же, как настоящий vue-router заменяет объект query разом,
// а не мутирует прежний. Только это заставляет сработать `watch(() => route.query, ...)`.
const route = reactive<{ query: Record<string, string> }>({ query: {} });
const push = vi.fn((to: { query?: Record<string, string> }) => {
    route.query = { ...(to.query ?? {}) };

    return Promise.resolve();
});

vi.mock('vue-router', () => ({
    useRoute: () => route,
    useRouter: () => ({ push }),
}));

// `routeQuery` реактивный (нужно проверить watch по route.query), поэтому
// предыдущий смонтированный экземпляр обязательно размонтируем — иначе его
// watcher переживёт тест и среагирует на мутацию routeQuery в соседнем.
let activeWrapper: VueWrapper | null = null;

function mountQuery(load: () => Promise<void>) {
    const wrapper = mount(
        defineComponent({
            template: '<div />',
            setup() {
                return useListQuery<{ status: string }>({ status: '' }, load);
            },
        }),
    );

    activeWrapper = wrapper;

    return wrapper;
}

beforeEach(() => {
    vi.clearAllMocks();
    route.query = {};
});

afterEach(() => {
    activeWrapper?.unmount();
    activeWrapper = null;
});

describe('useListQuery', () => {
    it('loads once on mount', () => {
        const load = vi.fn().mockResolvedValue(undefined);
        mountQuery(load);

        expect(load).toHaveBeenCalledTimes(1);
    });

    it('seeds the filter and page from the current URL', () => {
        route.query = { status: 'archived', page: '3' };

        const wrapper = mountQuery(vi.fn().mockResolvedValue(undefined));

        expect(wrapper.vm.filters.status).toBe('archived');
        expect(wrapper.vm.page).toBe(3);
    });

    it('falls back to the default filter and page 1 for a garbage query value', () => {
        route.query = { page: 'not-a-number' };

        const wrapper = mountQuery(vi.fn().mockResolvedValue(undefined));

        expect(wrapper.vm.filters.status).toBe('');
        expect(wrapper.vm.page).toBe(1);
    });

    it('resets to page 1 and pushes only the non-default filter', () => {
        const wrapper = mountQuery(vi.fn().mockResolvedValue(undefined));

        wrapper.vm.page = 5;
        wrapper.vm.filters.status = 'archived';
        wrapper.vm.applyFilters();

        expect(wrapper.vm.page).toBe(1);
        expect(push).toHaveBeenCalledWith({ query: { status: 'archived' } });
    });

    it('sends the page in the query once past the first one', () => {
        const wrapper = mountQuery(vi.fn().mockResolvedValue(undefined));

        wrapper.vm.goToPage(2);

        expect(push).toHaveBeenCalledWith({ query: { page: '2' } });
    });

    it('omits the page from the query once back on the first one', () => {
        const wrapper = mountQuery(vi.fn().mockResolvedValue(undefined));

        wrapper.vm.goToPage(1);

        expect(push).toHaveBeenCalledWith({ query: {} });
    });

    it('restores the default filter and reapplies it', () => {
        const wrapper = mountQuery(vi.fn().mockResolvedValue(undefined));

        wrapper.vm.filters.status = 'archived';
        wrapper.vm.page = 3;
        wrapper.vm.resetFilters();

        expect(wrapper.vm.filters.status).toBe('');
        expect(push).toHaveBeenCalledWith({ query: {} });
    });

    it('reloads and re-reads the filter when the URL changes underneath it', async () => {
        const load = vi.fn().mockResolvedValue(undefined);
        const wrapper = mountQuery(load);

        load.mockClear();
        route.query = { status: 'archived' };
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.filters.status).toBe('archived');
        expect(load).toHaveBeenCalledTimes(1);
    });
});
