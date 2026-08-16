import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import TaskBoardColumn from '@/components/domain/tasks/board/TaskBoardColumn.vue';
import type { BoardColumn } from '@/composables/useTaskBoard';
import { makeRole, makeTask, makeUser } from '@/tests/fixtures';

vi.mock('vue-draggable-plus', () => ({
    VueDraggable: {
        name: 'VueDraggable',
        props: { modelValue: { type: Array, default: () => [] } },
        emits: ['update:modelValue', 'start', 'end'],
        template: '<div class="vue-draggable-stub"><slot /></div>',
    },
}));

function makeColumn(overrides: Partial<BoardColumn> = {}): BoardColumn {
    return {
        key: 'pending',
        label: 'Ожидает',
        tasks: [],
        total: 0,
        page: 1,
        lastPage: 1,
        loading: false,
        error: null,
        ...overrides,
    };
}

function mountColumn(props: Record<string, unknown> = {}) {
    return mount(TaskBoardColumn, {
        props: {
            column: makeColumn(),
            groupBy: 'status',
            dragDisabled: false,
            canCreate: false,
            createPending: false,
            projectId: '',
            projectOptions: [],
            ...props,
        },
        global: {
            plugins: [
                createTestingPinia({
                    createSpy: vi.fn,
                    stubActions: false,
                    initialState: { auth: { token: 'tok', user: makeUser({ id: 1, role: makeRole('admin') }) } },
                }),
            ],
        },
    });
}

describe('TaskBoardColumn', () => {
    it('renders the label and the total counter', () => {
        const wrapper = mountColumn({ column: makeColumn({ label: 'В работе', total: 4 }) });

        expect(wrapper.text()).toContain('В работе');
        expect(wrapper.text()).toContain('4');
    });

    it('renders a card per task', () => {
        const wrapper = mountColumn({
            column: makeColumn({ tasks: [makeTask({ id: 1, title: 'Первая' }), makeTask({ id: 2, title: 'Вторая' })] }),
        });

        expect(wrapper.text()).toContain('Первая');
        expect(wrapper.text()).toContain('Вторая');
    });

    it('shows the column error instead of its cards', () => {
        const wrapper = mountColumn({
            column: makeColumn({
                tasks: [makeTask({ id: 1, title: 'Скрытая' })],
                error: { message: 'Не удалось загрузить.' } as never,
            }),
        });

        expect(wrapper.text()).toContain('Не удалось загрузить.');
        expect(wrapper.text()).not.toContain('Скрытая');
        expect(wrapper.find('.vue-draggable-stub').exists()).toBe(false);
    });

    it('offers "load more" only once another page exists and nothing is loading', async () => {
        const wrapper = mountColumn({ column: makeColumn({ page: 1, lastPage: 2 }) });

        expect(wrapper.text()).toContain('Показать ещё');

        await wrapper.setProps({ column: makeColumn({ page: 1, lastPage: 2, loading: true }) });

        expect(wrapper.text()).not.toContain('Показать ещё');
    });

    it('emits load-more with the column key', async () => {
        const wrapper = mountColumn({ column: makeColumn({ key: 'in_progress', page: 1, lastPage: 2 }) });

        await wrapper.find('button').trigger('click');

        expect(wrapper.emitted('load-more')![0]).toEqual(['in_progress']);
    });

    it('opens a task when its card is clicked', async () => {
        const task = makeTask({ id: 5, title: 'Кликабельная' });
        const wrapper = mountColumn({ column: makeColumn({ tasks: [task] }) });

        await wrapper.find('[data-task-id="5"]').trigger('click');

        expect(wrapper.emitted('open')![0]![0]).toEqual(task);
    });

    it('renders the quick-add control only when creation is allowed', async () => {
        const wrapper = mountColumn({ canCreate: false });

        expect(wrapper.text()).not.toContain('Добавить задачу');

        await wrapper.setProps({ canCreate: true });

        expect(wrapper.text()).toContain('Добавить задачу');
    });
});
