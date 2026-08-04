import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import { RouterLinkStub, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AppShell from '@/components/layout/AppShell.vue';
import { makeRole, makeUser } from '@/tests/fixtures';

const route = reactive({ fullPath: '/dashboard' });

vi.mock('vue-router', () => ({
    useRouter: () => ({ replace: vi.fn() }),
    useRoute: () => route,
}));
vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));

function mountShell() {
    return mount(AppShell, {
        attachTo: document.body,
        global: {
            plugins: [
                createTestingPinia({
                    createSpy: vi.fn,
                    stubActions: false,
                    initialState: { auth: { token: 'tok', user: makeUser({ role: makeRole('admin') }) } },
                }),
            ],
            stubs: { RouterLink: RouterLinkStub },
        },
    });
}

function openMenu(wrapper: ReturnType<typeof mountShell>) {
    return wrapper.find('[aria-label="Открыть меню"]').trigger('click');
}

beforeEach(() => {
    route.fullPath = '/dashboard';
    window.localStorage.clear();
});

describe('AppShell', () => {
    it('keeps the mobile menu closed until the burger is used', () => {
        const wrapper = mountShell();

        expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
        expect(wrapper.find('[aria-label="Открыть меню"]').attributes('aria-expanded')).toBe('false');
    });

    it('opens the navigation in a drawer', async () => {
        const wrapper = mountShell();

        await openMenu(wrapper);

        const drawer = wrapper.find('[role="dialog"]');

        expect(drawer.exists()).toBe(true);
        expect(drawer.text()).toContain('Проекты');
        expect(drawer.text()).toContain('Задачи');
    });

    it('closes the drawer once navigation happened', async () => {
        const wrapper = mountShell();

        await openMenu(wrapper);
        route.fullPath = '/projects';

        await vi.waitFor(() => expect(wrapper.find('[role="dialog"]').exists()).toBe(false));
    });
});
