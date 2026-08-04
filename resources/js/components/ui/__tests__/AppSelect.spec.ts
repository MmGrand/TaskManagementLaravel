import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AppSelect from '@/components/ui/AppSelect.vue';

const OPTIONS = [
    { value: 'pending', label: 'Ожидает' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'completed', label: 'Завершена' },
];

function mountSelect(props: Record<string, unknown> = {}) {
    return mount(AppSelect, {
        props: { options: OPTIONS, modelValue: 'pending', ...props },
        attachTo: document.body,
    });
}

function trigger(wrapper: ReturnType<typeof mountSelect>) {
    return wrapper.find('[role="combobox"]');
}

function options(wrapper: ReturnType<typeof mountSelect>) {
    return wrapper.findAll('[role="option"]');
}

function emittedModel(wrapper: ReturnType<typeof mountSelect>): unknown {
    return wrapper.emitted('update:modelValue')?.at(-1)?.[0];
}

describe('AppSelect', () => {
    it('shows the label of the current value and keeps the list closed', () => {
        const wrapper = mountSelect();

        expect(trigger(wrapper).text()).toContain('Ожидает');
        expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
        expect(options(wrapper)).toHaveLength(0);
    });

    it('opens on click and marks the current value as selected', async () => {
        const wrapper = mountSelect();

        await trigger(wrapper).trigger('click');

        expect(options(wrapper).map((option) => option.text())).toEqual([
            'Ожидает',
            'В работе',
            'Завершена',
        ]);
        expect(options(wrapper).map((option) => option.attributes('aria-selected'))).toEqual([
            'true',
            'false',
            'false',
        ]);
    });

    it('emits the value of the option that was clicked and closes', async () => {
        const wrapper = mountSelect();

        await trigger(wrapper).trigger('click');
        await options(wrapper)[1]!.trigger('click');

        expect(emittedModel(wrapper)).toBe('in_progress');
        expect(options(wrapper)).toHaveLength(0);
    });

    it('offers the placeholder as the empty value', async () => {
        const wrapper = mountSelect({ modelValue: '', placeholder: 'Все' });

        expect(trigger(wrapper).text()).toContain('Все');

        await trigger(wrapper).trigger('click');
        await options(wrapper)[2]!.trigger('click');

        expect(emittedModel(wrapper)).toBe('in_progress');
    });

    it('walks the list with the arrows and picks with Enter', async () => {
        const wrapper = mountSelect();

        await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' });
        await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' });
        await trigger(wrapper).trigger('keydown', { key: 'Enter' });

        expect(emittedModel(wrapper)).toBe('in_progress');
    });

    it('stops at the last option instead of wrapping around', async () => {
        const wrapper = mountSelect({ modelValue: 'in_progress' });

        // Первая стрелка раскрывает список на текущем значении, дальше — движение.
        await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' });
        await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' });
        await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' });
        await trigger(wrapper).trigger('keydown', { key: 'Enter' });

        expect(emittedModel(wrapper)).toBe('completed');
    });

    it('jumps to an option by its first letters, as a native list does', async () => {
        const wrapper = mountSelect();

        await trigger(wrapper).trigger('keydown', { key: 'З' });

        expect(emittedModel(wrapper)).toBe('completed');
    });

    it('closes on Escape without changing the value', async () => {
        const wrapper = mountSelect();

        await trigger(wrapper).trigger('click');
        await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' });
        await trigger(wrapper).trigger('keydown', { key: 'Escape' });

        expect(options(wrapper)).toHaveLength(0);
        expect(emittedModel(wrapper)).toBeUndefined();
    });

    it('closes on a click outside', async () => {
        const wrapper = mountSelect();

        await trigger(wrapper).trigger('click');
        document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(options(wrapper)).toHaveLength(0);
    });

    it('stays shut when disabled', async () => {
        const wrapper = mountSelect({ disabled: true });

        await trigger(wrapper).trigger('click');

        expect(options(wrapper)).toHaveLength(0);
        expect(trigger(wrapper).attributes('disabled')).toBeDefined();
    });

    it('reserves the width of the longest option, not of the current one', () => {
        const wrapper = mountSelect({ modelValue: '', placeholder: 'Все' });
        const sizer = wrapper.find('[aria-hidden="true"].invisible');

        expect(sizer.findAll('span').map((span) => span.text())).toEqual([
            'Все',
            'Ожидает',
            'В работе',
            'Завершена',
        ]);
        expect(sizer.classes()).toContain('h-0');
    });

    it('passes the field wiring on to assistive technology', () => {
        const wrapper = mountSelect({ id: 'status', invalid: true, describedBy: 'status-error' });

        expect(trigger(wrapper).attributes('id')).toBe('status');
        expect(trigger(wrapper).attributes('aria-invalid')).toBe('true');
        expect(trigger(wrapper).attributes('aria-describedby')).toBe('status-error');
    });
});
