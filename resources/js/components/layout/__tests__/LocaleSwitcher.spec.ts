import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import LocaleSwitcher from '@/components/layout/LocaleSwitcher.vue';
import { setLocaleSync } from '@/i18n';
import { activeLocale } from '@/i18n/locale-state';
import { readStoredLocale } from '@/i18n/locales';

function mountSwitcher() {
    return mount(LocaleSwitcher, {
        attachTo: document.body,
        global: { plugins: [createTestingPinia({ createSpy: vi.fn, stubActions: false })] },
    });
}

async function openMenu(wrapper: ReturnType<typeof mountSwitcher>) {
    await wrapper.find('button').trigger('click');

    return wrapper.findAll('[role="menuitemradio"]');
}

beforeEach(() => {
    window.localStorage.clear();
    setLocaleSync('ru');
});

describe('LocaleSwitcher', () => {
    it('shows only the active locale code until opened', () => {
        const wrapper = mountSwitcher();

        expect(wrapper.find('button').text()).toContain('RU');
        expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    });

    it('lists every supported locale under its own name', async () => {
        const options = await openMenu(mountSwitcher());

        // Галочка активного языка попадает в text(), поэтому сверяем сами названия.
        expect(options).toHaveLength(2);
        expect(options[0]!.text()).toContain('Русский');
        expect(options[1]!.text()).toContain('English');
    });

    it('marks the active locale as checked', async () => {
        const options = await openMenu(mountSwitcher());

        expect(options.map((option) => option.attributes('aria-checked'))).toEqual(['true', 'false']);
    });

    it('switches the language, persists the choice and closes the menu', async () => {
        const wrapper = mountSwitcher();
        const options = await openMenu(wrapper);

        await options[1]!.trigger('click');

        // waitFor, а не flushPromises: setLocale догружает сообщения динамическим
        // импортом, и число тиков до его резолва не фиксировано.
        await vi.waitFor(() => expect(activeLocale.value).toBe('en'));

        expect(readStoredLocale()).toBe('en');
        expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    });

    it('labels the trigger for assistive technology', () => {
        expect(mountSwitcher().find('button').attributes('aria-label')).toBe('Язык');
    });
});
