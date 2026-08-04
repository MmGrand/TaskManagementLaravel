import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import UserMenu from '@/components/layout/UserMenu.vue';
import { makeRole, makeUser } from '@/tests/fixtures';
import { useAuthStore } from '@/stores/auth';

const replace = vi.fn();

vi.mock('vue-router', () => ({
    useRouter: () => ({ replace }),
    useRoute: () => ({ fullPath: '/dashboard' }),
}));
vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));

function mountMenu() {
    const wrapper = mount(UserMenu, {
        attachTo: document.body,
        global: {
            plugins: [
                createTestingPinia({
                    createSpy: vi.fn,
                    stubActions: true,
                    initialState: {
                        auth: {
                            token: 'tok',
                            user: makeUser({
                                first_name: 'Admin',
                                last_name: 'User',
                                role: makeRole('admin'),
                            }),
                        },
                    },
                }),
            ],
            stubs: { RouterLink: RouterLinkStub },
        },
    });

    return { wrapper, auth: useAuthStore() };
}

beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
});

describe('UserMenu', () => {
    it('keeps the details collapsed until the trigger is used', () => {
        const { wrapper } = mountMenu();

        expect(wrapper.find('[role="menu"]').exists()).toBe(false);
        expect(wrapper.find('button').attributes('aria-expanded')).toBe('false');
    });

    it('reveals the role, the profile link and logout once opened', async () => {
        const { wrapper } = mountMenu();

        await wrapper.find('button').trigger('click');

        const menu = wrapper.find('[role="menu"]');

        expect(menu.exists()).toBe(true);
        expect(menu.text()).toContain('Admin User');
        expect(menu.text()).toContain('Администратор');
        expect(menu.text()).toContain('Профиль');
        expect(menu.text()).toContain('Выйти');
        expect(wrapper.find('button').attributes('aria-expanded')).toBe('true');
    });

    it('logs out from inside the menu and lands on the login screen', async () => {
        const { wrapper, auth } = mountMenu();
        vi.mocked(auth.logout).mockResolvedValue(undefined);

        await wrapper.find('button').trigger('click');
        await wrapper.find('[role="menu"] button').trigger('click');
        await flushPromises();

        expect(auth.logout).toHaveBeenCalled();
        expect(replace).toHaveBeenCalledWith({ name: 'login' });
    });

    it('closes on Escape', async () => {
        const { wrapper } = mountMenu();

        await wrapper.find('button').trigger('click');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await flushPromises();

        expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    });

    it('closes on a click outside', async () => {
        const { wrapper } = mountMenu();

        await wrapper.find('button').trigger('click');
        document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await flushPromises();

        expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    });
});
