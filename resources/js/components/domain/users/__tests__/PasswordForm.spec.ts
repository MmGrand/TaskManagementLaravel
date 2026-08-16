import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PasswordForm from '@/components/domain/users/PasswordForm.vue';

function mountForm(props: Record<string, unknown> = {}) {
    return mount(PasswordForm, { props });
}

async function fillAndSubmit(
    wrapper: ReturnType<typeof mountForm>,
    values: { current?: string; password?: string; confirmation?: string },
): Promise<void> {
    const fields = wrapper.findAll('input[type="password"]');

    if (values.current !== undefined) {
        await fields[0]!.setValue(values.current);
    }

    if (values.password !== undefined) {
        await fields[1]!.setValue(values.password);
    }

    if (values.confirmation !== undefined) {
        await fields[2]!.setValue(values.confirmation);
    }

    await wrapper.find('form').trigger('submit');
}

describe('PasswordForm', () => {
    it('reports every empty field at once on submit', async () => {
        const wrapper = mountForm();

        await wrapper.find('form').trigger('submit');

        expect(wrapper.text()).toContain('Заполните это поле.');
        expect(wrapper.emitted('submit')).toBeUndefined();
    });

    it('rejects a new password without a digit', async () => {
        const wrapper = mountForm();

        await fillAndSubmit(wrapper, { current: 'old-pass', password: 'onlyletters', confirmation: 'onlyletters' });

        expect(wrapper.text()).toContain('Пароль должен содержать буквы и цифры.');
        expect(wrapper.emitted('submit')).toBeUndefined();
    });

    it('rejects a new password shorter than the minimum', async () => {
        const wrapper = mountForm();

        await fillAndSubmit(wrapper, { current: 'old-pass', password: 'a1', confirmation: 'a1' });

        expect(wrapper.text()).toContain('Не короче 8 символов.');
        expect(wrapper.emitted('submit')).toBeUndefined();
    });

    it('rejects a confirmation that does not match', async () => {
        const wrapper = mountForm();

        await fillAndSubmit(wrapper, { current: 'old-pass', password: 'newpass1', confirmation: 'newpass2' });

        expect(wrapper.text()).toContain('Пароли не совпадают.');
        expect(wrapper.emitted('submit')).toBeUndefined();
    });

    it('emits the typed passwords once every rule passes', async () => {
        const wrapper = mountForm();

        await fillAndSubmit(wrapper, { current: 'old-pass', password: 'newpass1', confirmation: 'newpass1' });

        expect(wrapper.emitted('submit')![0]![0]).toEqual({
            current_password: 'old-pass',
            password: 'newpass1',
            password_confirmation: 'newpass1',
        });
    });

    it('shows the general server error but not a field-shaped one', () => {
        const wrapper = mountForm({
            error: { message: 'Текущий пароль неверен.', isValidation: false, errors: {} },
        });

        expect(wrapper.text()).toContain('Текущий пароль неверен.');
    });

    it('renders a 422 field error from the server', () => {
        const wrapper = mountForm({
            error: {
                message: 'Проверьте поля.',
                isValidation: true,
                errors: { password: ['Слишком похож на предыдущий пароль.'] },
            },
        });

        expect(wrapper.text()).toContain('Слишком похож на предыдущий пароль.');
    });

    it('disables submission while pending', () => {
        const wrapper = mountForm({ pending: true });

        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
    });
});
