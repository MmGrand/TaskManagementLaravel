import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import AppDateInput from '@/components/ui/AppDateInput.vue';
import { setLocale } from '@/i18n';

function mountInput(modelValue = '') {
    return mount(AppDateInput, { props: { modelValue }, attachTo: document.body });
}

function emittedModel(wrapper: ReturnType<typeof mountInput>): unknown {
    return wrapper.emitted('update:modelValue')?.at(-1)?.[0];
}

describe('AppDateInput', () => {
    it('shows the value and the hint in the active language', async () => {
        const wrapper = mountInput('2026-07-15');

        expect(wrapper.find('input').element.value).toBe('15.07.2026');
        expect(wrapper.find('input').attributes('placeholder')).toBe('дд.мм.гггг');

        await setLocale('en');
        await nextTick();

        expect(wrapper.find('input').element.value).toBe('15/07/2026');
        expect(wrapper.find('input').attributes('placeholder')).toBe('dd/mm/yyyy');
    });

    it('emits ISO for the backend, not what is typed', async () => {
        const wrapper = mountInput();

        await wrapper.find('input').setValue('15.07.2026');

        expect(emittedModel(wrapper)).toBe('2026-07-15');
    });

    it('builds a date out of the digits as they are typed', async () => {
        const wrapper = mountInput();
        const input = wrapper.find('input');

        await input.setValue('15');

        expect(input.element.value).toBe('15');

        await input.setValue('15072026');

        expect(input.element.value).toBe('15.07.2026');
        expect(emittedModel(wrapper)).toBe('2026-07-15');
    });

    it('pads a day that cannot grow and moves on to the month', async () => {
        const wrapper = mountInput();
        const input = wrapper.find('input');

        await input.setValue('4');

        expect(input.element.value).toBe('04');
    });

    it('applies nothing while the typed date is incomplete', async () => {
        const wrapper = mountInput('2026-07-15');

        await wrapper.find('input').setValue('15.07');

        expect(emittedModel(wrapper)).toBe('');
    });

    it('normalises the typed text on blur', async () => {
        const wrapper = mountInput();
        const input = wrapper.find('input');

        await input.setValue('5/7/2026');
        await input.trigger('blur');

        expect(input.element.value).toBe('05.07.2026');
    });

    it('picks a day from a calendar rendered in the active language', async () => {
        const wrapper = mountInput('2026-07-15');

        await wrapper.find('button[aria-expanded]').trigger('click');
        await nextTick();

        expect(wrapper.text()).toContain('Июль 2026');

        await wrapper.find('[data-iso="2026-07-20"]').trigger('click');

        expect(emittedModel(wrapper)).toBe('2026-07-20');
        expect(wrapper.find('[data-iso="2026-07-20"]').exists()).toBe(false);
    });

    it('walks to the previous month from the header', async () => {
        const wrapper = mountInput('2026-07-15');

        await wrapper.find('button[aria-expanded]').trigger('click');
        await wrapper.findAll('button').find((button) => button.text() === '‹')!.trigger('click');

        expect(wrapper.text()).toContain('Июнь 2026');
    });

    it('closes on Escape', async () => {
        const wrapper = mountInput('2026-07-15');

        await wrapper.find('button[aria-expanded]').trigger('click');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await nextTick();

        expect(wrapper.find('[data-iso="2026-07-15"]').exists()).toBe(false);
    });
});
