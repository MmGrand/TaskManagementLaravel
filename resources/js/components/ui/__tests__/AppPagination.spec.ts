import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AppPagination from '@/components/ui/AppPagination.vue';
import { makeMeta } from '@/tests/fixtures';

function mountPagination(meta: Parameters<typeof makeMeta>[0]) {
    return mount(AppPagination, { props: { meta: makeMeta(meta) } });
}

describe('AppPagination', () => {
    it('renders nothing on a single page', () => {
        expect(mountPagination({ last_page: 1 }).find('nav').exists()).toBe(false);
    });

    it('disables the back button on the first page', () => {
        const wrapper = mountPagination({ current_page: 1, last_page: 3, total: 40, from: 1, to: 15 });
        const [back, forward] = wrapper.findAll('button');

        expect(back!.attributes('disabled')).toBeDefined();
        expect(forward!.attributes('disabled')).toBeUndefined();
    });

    it('disables the forward button on the last page', () => {
        const wrapper = mountPagination({ current_page: 3, last_page: 3, total: 40, from: 31, to: 40 });
        const [back, forward] = wrapper.findAll('button');

        expect(back!.attributes('disabled')).toBeUndefined();
        expect(forward!.attributes('disabled')).toBeDefined();
    });

    it('emits the target page', async () => {
        const wrapper = mountPagination({ current_page: 2, last_page: 3, total: 40, from: 16, to: 30 });

        await wrapper.findAll('button')[1]!.trigger('click');
        await wrapper.findAll('button')[0]!.trigger('click');

        expect(wrapper.emitted('update:page')).toEqual([[3], [1]]);
    });

    it('shows the range and the total', () => {
        const wrapper = mountPagination({ current_page: 2, last_page: 3, total: 40, from: 16, to: 30 });

        expect(wrapper.text()).toContain('16–30 из 40');
        expect(wrapper.text()).toContain('2 / 3');
    });
});
