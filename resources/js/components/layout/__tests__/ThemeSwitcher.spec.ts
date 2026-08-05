import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher.vue';
import { readStoredTheme } from '@/utils/theme';

function mountSwitcher() {
    return mount(ThemeSwitcher, {
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
});

describe('ThemeSwitcher', () => {
    it('keeps the menu closed until the trigger is pressed', () => {
        const wrapper = mountSwitcher();

        expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    });

    it('offers every mode', async () => {
        const options = await openMenu(mountSwitcher());

        // Галочка активного режима попадает в text(), поэтому сверяем сами подписи.
        expect(options).toHaveLength(3);
        expect(options[0]!.text()).toContain('Светлая');
        expect(options[1]!.text()).toContain('Тёмная');
        expect(options[2]!.text()).toContain('Системная');
    });

    it('marks the active mode as checked', async () => {
        const options = await openMenu(mountSwitcher());

        expect(options.map((option) => option.attributes('aria-checked'))).toEqual(['false', 'false', 'true']);
    });

    it('switches the theme, persists the choice and closes the menu', async () => {
        const wrapper = mountSwitcher();
        const options = await openMenu(wrapper);

        await options[1]!.trigger('click');

        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(readStoredTheme()).toBe('dark');
        expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    });

    it('labels the trigger for assistive technology', () => {
        expect(mountSwitcher().find('button').attributes('aria-label')).toBe('Тема');
    });
});
