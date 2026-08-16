import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AppPhoneInput from '@/components/ui/AppPhoneInput.vue';

function mountInput(modelValue = '') {
    return mount(AppPhoneInput, { props: { modelValue, 'onUpdate:modelValue': () => {} } });
}

async function type(wrapper: ReturnType<typeof mountInput>, text: string): Promise<void> {
    await wrapper.find('input').setValue(text);
    await wrapper.setProps({ modelValue: wrapper.emitted('update:modelValue')!.at(-1)![0] as string });
}

describe('AppPhoneInput', () => {
    it('masks what the user types', async () => {
        const wrapper = mountInput();

        await type(wrapper, '79991234567');

        expect(wrapper.find('input').element.value).toBe('+7 999 123 45 67');
    });

    it('drops the characters a phone number cannot contain', async () => {
        const wrapper = mountInput();

        await type(wrapper, '8 (999) абв 12-34');

        expect(wrapper.find('input').element.value).toBe('+7 999 123 4');
    });

    it('formats a stored number on mount', () => {
        const wrapper = mountInput('+79991234567');

        expect(wrapper.emitted('update:modelValue')![0]![0]).toBe('+7 999 123 45 67');
    });

    it('stops accepting digits past the E.164 limit', async () => {
        const wrapper = mountInput();

        await type(wrapper, '1234567890123456789');

        expect(wrapper.find('input').element.value.replace(/\D/g, '')).toHaveLength(15);
    });

    it('marks itself invalid for the field wrapper', () => {
        const wrapper = mount(AppPhoneInput, { props: { modelValue: '', invalid: true, describedBy: 'phone-error' } });

        expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
        expect(wrapper.find('input').attributes('aria-describedby')).toBe('phone-error');
    });
});
