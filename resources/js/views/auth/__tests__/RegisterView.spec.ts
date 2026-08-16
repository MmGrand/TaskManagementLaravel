import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { RouterLinkStub } from '@vue/test-utils';
import RegisterView from '@/views/auth/RegisterView.vue';
import { useAuthStore } from '@/stores/auth';

const replace = vi.fn();

vi.mock('vue-router', () => ({
    useRouter: () => ({ replace }),
}));
vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));

function mountView() {
    const wrapper = mount(RegisterView, {
        global: {
            plugins: [createTestingPinia({ createSpy: vi.fn, stubActions: true })],
            stubs: { RouterLink: RouterLinkStub },
        },
    });

    return { wrapper, auth: useAuthStore() };
}

async function fillValidForm(wrapper: ReturnType<typeof mountView>['wrapper']): Promise<void> {
    const inputs = wrapper.findAll('input');

    await inputs[0]!.setValue('  Иван  ');
    await inputs[1]!.setValue('  Петров  ');
    await inputs[2]!.setValue('  ivan@example.com  ');
    await wrapper.find('input[type="tel"]').setValue('89991234567');
    await inputs.filter((input) => input.attributes('type') === 'password')[0]!.setValue('newpass1');
    await inputs.filter((input) => input.attributes('type') === 'password')[1]!.setValue('newpass1');
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('RegisterView', () => {
    it('reports every empty required field at once on submit', async () => {
        const { wrapper } = mountView();

        await wrapper.find('form').trigger('submit');

        expect(wrapper.text()).toContain('Заполните это поле.');
        expect(useAuthStore().register).not.toHaveBeenCalled();
    });

    it('rejects a password without a digit', async () => {
        const { wrapper } = mountView();
        await fillValidForm(wrapper);

        const passwordInputs = wrapper.findAll('input').filter((input) => input.attributes('type') === 'password');
        await passwordInputs[0]!.setValue('onlyletters');
        await passwordInputs[1]!.setValue('onlyletters');
        await wrapper.find('form').trigger('submit');

        expect(wrapper.text()).toContain('Пароль должен содержать буквы и цифры.');
        expect(useAuthStore().register).not.toHaveBeenCalled();
    });

    it('rejects a confirmation that does not match', async () => {
        const { wrapper } = mountView();
        await fillValidForm(wrapper);

        const passwordInputs = wrapper.findAll('input').filter((input) => input.attributes('type') === 'password');
        await passwordInputs[1]!.setValue('different1');
        await wrapper.find('form').trigger('submit');

        expect(wrapper.text()).toContain('Пароли не совпадают.');
        expect(useAuthStore().register).not.toHaveBeenCalled();
    });

    it('trims text fields and normalizes the phone before registering', async () => {
        const { wrapper, auth } = mountView();
        vi.mocked(auth.register).mockResolvedValue(undefined);

        await fillValidForm(wrapper);
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(auth.register).toHaveBeenCalledWith({
            first_name: 'Иван',
            last_name: 'Петров',
            email: 'ivan@example.com',
            phone: '+79991234567',
            password: 'newpass1',
            password_confirmation: 'newpass1',
        });
    });

    it('redirects to the dashboard once registration succeeds', async () => {
        const { wrapper, auth } = mountView();
        vi.mocked(auth.register).mockResolvedValue(undefined);

        await fillValidForm(wrapper);
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(replace).toHaveBeenCalledWith({ name: 'dashboard' });
    });

    it('renders a 422 field error from the server without redirecting', async () => {
        const { wrapper, auth } = mountView();
        vi.mocked(auth.register).mockRejectedValue({
            status: 422,
            message: 'Проверьте поля.',
            errors: { email: ['Этот email уже занят.'] },
            isValidation: true,
            isUnauthenticated: false,
            isForbidden: false,
            isNotFound: false,
            isThrottled: false,
            isNetwork: false,
            isAccountDisabled: false,
            retryAfter: null,
        });

        await fillValidForm(wrapper);
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(wrapper.text()).toContain('Этот email уже занят.');
        expect(replace).not.toHaveBeenCalled();
    });
});
