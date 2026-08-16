import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, ref } from 'vue';
import * as tasksApi from '@/api/tasks';
import { useTaskBoard } from '@/composables/useTaskBoard';
import { setLocale } from '@/i18n';
import type { BoardGroupBy } from '@/utils/boardMove';
import { useUiStore } from '@/stores/ui';
import { makePage, makeTask } from '@/tests/fixtures';

vi.mock('@/api/tasks');

const mockedApi = vi.mocked(tasksApi);

const STATUS_COLUMNS = [
    { key: 'pending', label: 'Ожидает' },
    { key: 'in_progress', label: 'В работе' },
    { key: 'completed', label: 'Завершена' },
];

function board(groupBy: BoardGroupBy = 'status', filters: Record<string, string> = {}) {
    return useTaskBoard({
        groupBy: ref(groupBy),
        columnSpecs: () => STATUS_COLUMNS,
        filters: () => filters,
    });
}

beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    mockedApi.list.mockResolvedValue(makePage([]));
});

describe('load', () => {
    it('issues one request per column and ranks by position', async () => {
        const instance = board();

        await instance.load();

        expect(mockedApi.list).toHaveBeenCalledTimes(3);
        expect(mockedApi.list).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'pending',
                sort_by: 'position',
                sort_direction: 'asc',
                per_page: 50,
                page: 1,
            }),
        );
    });

    it('lets the column, not the page filter, decide the grouped dimension', async () => {
        const instance = board('status', { status: 'completed', priority: 'high' });

        await instance.load();

        const sent = mockedApi.list.mock.calls.map(([filters]) => filters);

        expect(sent.map((filters) => filters?.status)).toEqual(['pending', 'in_progress', 'completed']);
        expect(sent.every((filters) => filters?.priority === 'high')).toBe(true);
    });

    it('keeps the other columns usable when one of them fails', async () => {
        mockedApi.list
            .mockResolvedValueOnce(makePage([makeTask({ id: 1 })]))
            .mockRejectedValueOnce({ status: 429, message: 'Слишком много запросов.' })
            .mockResolvedValueOnce(makePage([]));

        const instance = board();
        await instance.load();

        expect(instance.columns.value[0]!.tasks).toHaveLength(1);
        expect(instance.columns.value[1]!.error).not.toBeNull();
        expect(instance.columns.value[2]!.error).toBeNull();
    });

    it('exposes the server total, not the loaded count', async () => {
        mockedApi.list.mockResolvedValue(makePage([makeTask({ id: 1 })], { total: 87, last_page: 2 }));

        const instance = board();
        await instance.load();

        expect(instance.columns.value[0]!.total).toBe(87);
    });
});

describe('locale', () => {
    it('relabels the loaded columns without refetching them', async () => {
        const specs = ref(STATUS_COLUMNS);
        const instance = useTaskBoard({
            groupBy: ref<BoardGroupBy>('status'),
            columnSpecs: () => specs.value,
            filters: () => ({}),
        });

        await instance.load();
        mockedApi.list.mockClear();

        specs.value = [
            { key: 'pending', label: 'Pending' },
            { key: 'in_progress', label: 'In progress' },
            { key: 'completed', label: 'Completed' },
        ];
        await setLocale('en');
        await nextTick();

        expect(instance.columns.value.map((column) => column.label)).toEqual([
            'Pending',
            'In progress',
            'Completed',
        ]);
        expect(mockedApi.list).not.toHaveBeenCalled();
    });
});

describe('loadMore', () => {
    it('appends the next page and advances the cursor', async () => {
        mockedApi.list.mockResolvedValue(
            makePage([makeTask({ id: 1 })], { total: 2, last_page: 2, current_page: 1 }),
        );

        const instance = board();
        await instance.load();

        mockedApi.list.mockResolvedValue(
            makePage([makeTask({ id: 2 })], { total: 2, last_page: 2, current_page: 2 }),
        );
        await instance.loadMore('pending');

        expect(instance.columns.value[0]!.tasks.map((task) => task.id)).toEqual([1, 2]);
        expect(instance.columns.value[0]!.page).toBe(2);
    });

    it('does nothing once the last page is loaded', async () => {
        const instance = board();
        await instance.load();

        vi.resetAllMocks();
        await instance.loadMore('pending');

        expect(mockedApi.list).not.toHaveBeenCalled();
    });
});

describe('move', () => {
    async function loadedBoard() {
        mockedApi.list
            .mockResolvedValueOnce(makePage([makeTask({ id: 1, status: 'pending' })], { total: 1 }))
            .mockResolvedValueOnce(makePage([], { total: 0 }))
            .mockResolvedValueOnce(makePage([], { total: 0 }));

        const instance = board();
        await instance.load();

        return instance;
    }

    it('patches the card and the counters before the server answers', async () => {
        const instance = await loadedBoard();
        const task = instance.columns.value[0]!.tasks[0]!;

        mockedApi.move.mockResolvedValue(makeTask({ id: 1, status: 'in_progress', position: 5000 }));

        await instance.move({ task, columnKey: 'in_progress', after_task_id: null, before_task_id: null });

        expect(mockedApi.move).toHaveBeenCalledWith(1, {
            status: 'in_progress',
            after_task_id: null,
            before_task_id: null,
        });
        expect(instance.columns.value[0]!.total).toBe(0);
        expect(instance.columns.value[1]!.total).toBe(1);
        expect(task.position).toBe(5000);
    });

    it('sends no column fields when a card is only reordered', async () => {
        const instance = await loadedBoard();
        const task = instance.columns.value[0]!.tasks[0]!;

        mockedApi.move.mockResolvedValue(makeTask({ id: 1, status: 'pending' }));

        await instance.move({ task, columnKey: 'pending', after_task_id: 4, before_task_id: null });

        expect(mockedApi.move).toHaveBeenCalledWith(1, {
            after_task_id: 4,
            before_task_id: null,
        });
    });

    it('restores both columns and reports the error when the move is rejected', async () => {
        const instance = await loadedBoard();
        const ui = useUiStore();
        const task = instance.columns.value[0]!.tasks[0]!;

        instance.beginDrag();
        instance.columns.value[0]!.tasks = [];
        instance.columns.value[1]!.tasks = [task];

        mockedApi.move.mockRejectedValue({ status: 422, message: 'Соседняя задача недоступна.' });

        await instance.move({ task, columnKey: 'in_progress', after_task_id: null, before_task_id: null });

        expect(instance.columns.value[0]!.tasks.map((item) => item.id)).toEqual([1]);
        expect(instance.columns.value[0]!.total).toBe(1);
        expect(instance.columns.value[1]!.tasks).toHaveLength(0);
        expect(instance.columns.value[1]!.total).toBe(0);
        expect(ui.toasts.at(-1)?.message).toBe('Соседняя задача недоступна.');
    });

    it('blocks a second drag while one is in flight', async () => {
        const instance = await loadedBoard();
        const task = instance.columns.value[0]!.tasks[0]!;

        let release = (): void => {};
        mockedApi.move.mockReturnValue(
            new Promise((resolve) => {
                release = () => resolve(makeTask({ id: 1 }));
            }),
        );

        const pending = instance.move({
            task,
            columnKey: 'in_progress',
            after_task_id: null,
            before_task_id: null,
        });

        expect(instance.dragging.value).toBe(true);

        release();
        await pending;

        expect(instance.dragging.value).toBe(false);
    });

    it('ignores a second move started while the first has not resolved yet', async () => {
        const instance = await loadedBoard();
        const task = instance.columns.value[0]!.tasks[0]!;

        let release = (): void => {};
        mockedApi.move.mockReturnValue(
            new Promise((resolve) => {
                release = () => resolve(makeTask({ id: 1, status: 'in_progress' }));
            }),
        );

        const first = instance.move({ task, columnKey: 'in_progress', after_task_id: null, before_task_id: null });
        const second = instance.move({ task, columnKey: 'completed', after_task_id: null, before_task_id: null });

        release();
        await first;
        await second;

        expect(mockedApi.move).toHaveBeenCalledTimes(1);
    });
});

describe('local mutations', () => {
    async function loadedBoard() {
        mockedApi.list
            .mockResolvedValueOnce(makePage([makeTask({ id: 1, position: 2000 })], { total: 1 }))
            .mockResolvedValueOnce(makePage([], { total: 0 }))
            .mockResolvedValueOnce(makePage([], { total: 0 }));

        const instance = board();
        await instance.load();

        return instance;
    }

    it('re-slots an edited task into its new column', async () => {
        const instance = await loadedBoard();

        instance.applyTask(makeTask({ id: 1, status: 'completed', position: 2000 }));

        expect(instance.columns.value[0]!.tasks).toHaveLength(0);
        expect(instance.columns.value[0]!.total).toBe(0);
        expect(instance.columns.value[2]!.tasks.map((task) => task.id)).toEqual([1]);
        expect(instance.columns.value[2]!.total).toBe(1);
    });

    it('keeps a re-slotted task ordered by rank', async () => {
        const instance = await loadedBoard();

        instance.addTask(makeTask({ id: 2, status: 'pending', position: 9000 }));
        instance.applyTask(makeTask({ id: 3, status: 'pending', position: 3000 }));

        expect(instance.columns.value[0]!.tasks.map((task) => task.id)).toEqual([1, 3, 2]);
    });

    it('drops a deleted task and its counter', async () => {
        const instance = await loadedBoard();

        instance.removeTask(1);

        expect(instance.columns.value[0]!.tasks).toHaveLength(0);
        expect(instance.columns.value[0]!.total).toBe(0);
    });

    it('appends a new task to the tail, where the server ranks it', async () => {
        const instance = await loadedBoard();

        instance.addTask(makeTask({ id: 5, status: 'pending', position: 9000 }));

        expect(instance.columns.value[0]!.tasks.map((task) => task.id)).toEqual([1, 5]);
        expect(instance.columns.value[0]!.total).toBe(2);
    });
});
