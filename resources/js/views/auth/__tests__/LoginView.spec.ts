import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { RouterLinkStub } from '@vue/test-utils';
import LoginView from '@/views/auth/LoginView.vue';
import { useAuthStore } from '@/stores/auth';

const replace = vi.fn();
const routeQuery: { redirect?: string } = {};

vi.mock('vue-router', () => ({
    useRouter: () => ({ replace }),
    useRoute: () => ({ query: routeQuery }),
}));
vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));

function mountView() {
    const wrapper = mount(LoginView, {
        global: {
            plugins: [createTestingPinia({ createSpy: vi.fn, stubActions: true })],
            stubs: { RouterLink: RouterLinkStub },
        },
    });

    return { wrapper, auth: useAuthStore() };
}

async function fillAndSubmit(wrapper: ReturnType<typeof mountView>['wrapper']): Promise<void> {
    const inputs = wrapper.findAll('input');

    await inputs[0]!.setValue('  admin@example.com  ');
    await inputs[1]!.setValue('password');
    await wrapper.find('form').trigger('submit');
    await flushPromises();
}

beforeEach(() => {
    vi.clearAllMocks();
    delete routeQuery.redirect;
});

describe('LoginView', () => {
    it('submits trimmed credentials and lands on the dashboard', async () => {
        const { wrapper, auth } = mountView();
        vi.mocked(auth.login).mockResolvedValue(undefined);

        await fillAndSubmit(wrapper);

        expect(auth.login).toHaveBeenCalledWith({ email: 'admin@example.com', password: 'password' });
        expect(replace).toHaveBeenCalledWith({ name: 'dashboard' });
    });

    it('returns to the originally requested page', async () => {
        routeQuery.redirect = '/tasks/5';
        const { wrapper, auth } = mountView();
        vi.mocked(auth.login).mockResolvedValue(undefined);

        await fillAndSubmit(wrapper);

        expect(replace).toHaveBeenCalledWith('/tasks/5');
    });

    it('falls back to the dashboard for a redirect that points off-site', async () => {
        routeQuery.redirect = '//evil.example.com';
        const { wrapper, auth } = mountView();
        vi.mocked(auth.login).mockResolvedValue(undefined);

        await fillAndSubmit(wrapper);

        expect(replace).toHaveBeenCalledWith({ name: 'dashboard' });
    });

    it('renders the server field error under the email input', async () => {
        const { wrapper, auth } = mountView();
        vi.mocked(auth.login).mockRejectedValue({
            status: 422,
            message: 'Проверьте поля.',
            errors: { email: ['Email or password is incorrect.'] },
            isValidation: true,
            isUnauthenticated: false,
            isForbidden: false,
            isNotFound: false,
            isThrottled: false,
            isNetwork: false,
            isAccountDisabled: false,
            retryAfter: null,
        });

        await fillAndSubmit(wrapper);

        expect(wrapper.text()).toContain('Email or password is incorrect.');
        expect(replace).not.toHaveBeenCalled();
    });

    it('counts down and blocks the button when the auth rate limit is hit', async () => {
        const { wrapper, auth } = mountView();
        vi.mocked(auth.login).mockRejectedValue({
            status: 429,
            message: 'Слишком много запросов. Попробуйте позже.',
            errors: {},
            isValidation: false,
            isUnauthenticated: false,
            isForbidden: false,
            isNotFound: false,
            isThrottled: true,
            isNetwork: false,
            isAccountDisabled: false,
            retryAfter: 60,
        });

        await fillAndSubmit(wrapper);

        expect(wrapper.text()).toContain('Повторите через 60 с.');
        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
    });

    it('surfaces the reason a previous session ended', () => {
        const { wrapper, auth } = mountView();
        auth.sessionEndedMessage = 'Аккаунт недоступен: Заблокирован.';

        return wrapper.vm.$nextTick().then(() => {
            expect(wrapper.text()).toContain('Аккаунт недоступен: Заблокирован.');
        });
    });
});
