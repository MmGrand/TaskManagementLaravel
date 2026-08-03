import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import AppModal from '@/components/ui/AppModal.vue';

function mountModal(open = true) {
    return mount(AppModal, {
        props: { open, title: 'Подтверждение' },
        slots: { default: '<button type="button" id="inner">Внутри</button>' },
        attachTo: document.body,
    });
}

describe('AppModal', () => {
    it('renders nothing while closed', () => {
        expect(mountModal(false).find('[role="dialog"]').exists()).toBe(false);
    });

    it('exposes the dialog semantics and labels it by the title', () => {
        const dialog = mountModal().find('[role="dialog"]');

        expect(dialog.attributes('aria-modal')).toBe('true');
        expect(dialog.attributes('aria-labelledby')).toBeDefined();
    });

    it('emits close on Escape', async () => {
        const wrapper = mountModal();

        await wrapper.find('.fixed').trigger('keydown', { key: 'Escape' });

        expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('emits close when the backdrop is clicked but not the panel', async () => {
        const wrapper = mountModal();

        await wrapper.find('[role="dialog"]').trigger('click');
        expect(wrapper.emitted('close')).toBeUndefined();

        await wrapper.find('.fixed').trigger('click');
        expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('moves focus into the dialog when it opens', async () => {
        const wrapper = mount(AppModal, {
            props: { open: false, title: 'Подтверждение' },
            slots: { default: '<button type="button" id="inner">Внутри</button>' },
            attachTo: document.body,
        });

        await wrapper.setProps({ open: true });
        // Watcher ждёт nextTick перед фокусировкой, поэтому одного тика недостаточно.
        await flushPromises();

        const dialog = wrapper.find('[role="dialog"]').element;

        expect(document.activeElement).not.toBe(document.body);
        expect(dialog.contains(document.activeElement)).toBe(true);
    });
});
