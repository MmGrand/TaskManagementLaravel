import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import * as rolesApi from '@/api/roles';
import UserForm from '@/components/domain/users/UserForm.vue';
import { makeRole, makeUser } from '@/tests/fixtures';
import type { User } from '@/types/models';

vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));
vi.mock('@/api/roles');

beforeEach(() => {
    vi.resetAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    vi.mocked(rolesApi).list.mockResolvedValue([makeRole('user')]);
});

async function mountForm(user: User = makeUser({ id: 1, role: makeRole('user') })) {
    const wrapper = mount(UserForm, {
        props: { user },
        global: {
            plugins: [
                createTestingPinia({
                    createSpy: vi.fn,
                    stubActions: false,
                    initialState: { auth: { token: 'tok', user } },
                }),
            ],
        },
    });

    await flushPromises();

    return wrapper;
}

function phoneField(wrapper: Awaited<ReturnType<typeof mountForm>>) {
    return wrapper.find('input[type="tel"]');
}

describe('UserForm', () => {
    it('shows the stored phone in the readable format', async () => {
        const wrapper = await mountForm(makeUser({ phone: '+12488628415' }));

        expect((phoneField(wrapper).element as HTMLInputElement).value).toBe('+1 248 862 8415');
    });

    it('sends the phone back in the format the server stores', async () => {
        const wrapper = await mountForm();

        await phoneField(wrapper).setValue('79991234567');
        await wrapper.find('form').trigger('submit');

        expect(wrapper.emitted('submit')![0]![0]).toMatchObject({ phone: '+79991234567' });
    });

    it('keeps an incomplete phone out of the request', async () => {
        const wrapper = await mountForm();

        await phoneField(wrapper).setValue('7999');
        await wrapper.find('form').trigger('submit');

        expect(wrapper.emitted('submit')).toBeUndefined();
        expect(wrapper.text()).toContain('в международном формате');
    });

    it('keeps a malformed email out of the request', async () => {
        const wrapper = await mountForm();

        await wrapper.find('input[type="email"]').setValue('ivan@example');
        await wrapper.find('form').trigger('submit');

        expect(wrapper.emitted('submit')).toBeUndefined();
        expect(wrapper.text()).toContain('Введите адрес целиком');
    });

    it('reports an empty required field only once it has been left', async () => {
        const wrapper = await mountForm();
        const firstName = wrapper.findAll('input')[1]!;

        await firstName.setValue('');

        expect(wrapper.text()).not.toContain('Заполните это поле.');

        await firstName.trigger('blur');

        expect(wrapper.text()).toContain('Заполните это поле.');
    });

    it('stops showing the message as soon as the value is fixed', async () => {
        const wrapper = await mountForm();

        await phoneField(wrapper).setValue('7999');
        await wrapper.find('form').trigger('submit');
        await phoneField(wrapper).setValue('79991234567');

        expect(wrapper.text()).not.toContain('в международном формате');
    });

    it('does not carry the previous user’s chosen avatar into a different user’s save', async () => {
        const userA = makeUser({ id: 1, role: makeRole('user') });
        const userB = makeUser({ id: 2, role: makeRole('user') });
        const wrapper = await mountForm(userA);

        const input = wrapper.find('input[type="file"]');
        const file = new File(['x'], 'a.png', { type: 'image/png' });

        Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
        await input.trigger('change');

        await wrapper.setProps({ user: userB });
        await wrapper.find('form').trigger('submit');

        expect(wrapper.emitted('submit')![0]![1]).toBeNull();
    });
});
