import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import TaskBoard from '@/components/domain/tasks/board/TaskBoard.vue';
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

function mountBoard(columns: BoardColumn[], truncated = false) {
    return mount(TaskBoard, {
        props: {
            columns,
            groupBy: 'status',
            dragDisabled: false,
            canCreate: false,
            createPending: false,
            projectId: '',
            projectOptions: [],
            truncated,
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

describe('TaskBoard', () => {
    it('renders one column per entry', () => {
        const wrapper = mountBoard([
            makeColumn({ key: 'pending', label: 'Ожидает' }),
            makeColumn({ key: 'in_progress', label: 'В работе' }),
            makeColumn({ key: 'completed', label: 'Завершена' }),
        ]);

        expect(wrapper.text()).toContain('Ожидает');
        expect(wrapper.text()).toContain('В работе');
        expect(wrapper.text()).toContain('Завершена');
    });

    it('warns when the column set was truncated', () => {
        const wrapper = mountBoard([makeColumn()], true);

        expect(wrapper.text()).toContain('Показаны не все исполнители');
    });

    it('stays quiet when nothing was truncated', () => {
        const wrapper = mountBoard([makeColumn()], false);

        expect(wrapper.text()).not.toContain('Показаны не все исполнители');
    });

    it('forwards a card open from whichever column raised it', async () => {
        const task = makeTask({ id: 9, title: 'Открываемая' });
        const wrapper = mountBoard([makeColumn({ tasks: [task] })]);

        await wrapper.find('[data-task-id="9"]').trigger('click');

        expect(wrapper.emitted('open')![0]![0]).toEqual(task);
    });

    it('forwards load-more with the originating column key', async () => {
        const wrapper = mountBoard([
            makeColumn({ key: 'pending', page: 1, lastPage: 2 }),
            makeColumn({ key: 'in_progress', page: 1, lastPage: 3 }),
        ]);

        await wrapper.findAll('button').find((button) => button.text() === 'Показать ещё')!.trigger('click');

        expect(wrapper.emitted('load-more')![0]).toEqual(['pending']);
    });
});
