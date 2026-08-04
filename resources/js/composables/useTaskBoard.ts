import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import * as tasksApi from '@/api/tasks';
import type { TaskFilters } from '@/api/tasks';
import { activeLocale } from '@/i18n/locale-state';
import { useUiStore } from '@/stores/ui';
import type { ApiError } from '@/types/api';
import type { Task } from '@/types/models';
import type { BoardGroupBy, MoveNeighbours } from '@/utils/boardMove';
import { columnKeyOf, columnPatch } from '@/utils/boardMove';

const COLUMN_PAGE_SIZE = 50;

export interface BoardColumn {
    key: string;
    label: string;
    tasks: Task[];
    total: number;
    page: number;
    lastPage: number;
    loading: boolean;
    error: ApiError | null;
}

export interface BoardColumnSpec {
    key: string;
    label: string;
}

export interface MoveIntent extends MoveNeighbours {
    task: Task;
    columnKey: string;
}

interface ColumnSnapshot {
    key: string;
    tasks: Task[];
    total: number;
}

export interface TaskBoardOptions {
    groupBy: Ref<BoardGroupBy>;
    columnSpecs: () => BoardColumnSpec[];
    filters: () => TaskFilters;
}

export function useTaskBoard(options: TaskBoardOptions) {
    const ui = useUiStore();

    const columns = ref<BoardColumn[]>([]);
    const dragging = ref(false);

    let snapshot: ColumnSnapshot[] | null = null;

    function blankColumn(spec: BoardColumnSpec): BoardColumn {
        return {
            ...spec,
            tasks: [],
            total: 0,
            page: 1,
            lastPage: 1,
            loading: false,
            error: null,
        };
    }

    function columnFilters(column: BoardColumn, page: number): TaskFilters {
        return {
            ...options.filters(),
            [options.groupBy.value]: column.key,
            sort_by: 'position',
            sort_direction: 'asc',
            per_page: COLUMN_PAGE_SIZE,
            page,
        };
    }

    async function fetchColumn(column: BoardColumn, page: number): Promise<void> {
        column.loading = true;
        column.error = null;

        try {
            const result = await tasksApi.list(columnFilters(column, page));

            column.tasks = page === 1 ? result.items : [...column.tasks, ...result.items];
            column.total = result.meta.total;
            column.page = result.meta.current_page;
            column.lastPage = result.meta.last_page;
        } catch (error) {
            column.error = error as ApiError;
        } finally {
            column.loading = false;
        }
    }

    async function load(): Promise<void> {
        columns.value = options.columnSpecs().map(blankColumn);

        await Promise.allSettled(columns.value.map((column) => fetchColumn(column, 1)));
    }

    function relabel(): void {
        const specs = options.columnSpecs();

        for (const column of columns.value) {
            const spec = specs.find((candidate) => candidate.key === column.key);

            if (spec !== undefined) {
                column.label = spec.label;
            }
        }
    }

    watch(activeLocale, relabel);

    async function loadMore(key: string): Promise<void> {
        const column = columns.value.find((candidate) => candidate.key === key);

        if (column === undefined || column.page >= column.lastPage || column.loading) {
            return;
        }

        await fetchColumn(column, column.page + 1);
    }

    function columnOf(key: string): BoardColumn | undefined {
        return columns.value.find((candidate) => candidate.key === key);
    }

    function beginDrag(): void {
        snapshot = columns.value.map((column) => ({
            key: column.key,
            tasks: [...column.tasks],
            total: column.total,
        }));
    }

    function rollback(): void {
        if (snapshot === null) {
            return;
        }

        for (const saved of snapshot) {
            const column = columnOf(saved.key);

            if (column !== undefined) {
                column.tasks = saved.tasks;
                column.total = saved.total;
            }
        }

        snapshot = null;
    }

    function recount(fromKey: string, toKey: string): void {
        if (fromKey === toKey) {
            return;
        }

        const from = columnOf(fromKey);
        const to = columnOf(toKey);

        if (from !== undefined) {
            from.total = Math.max(0, from.total - 1);
        }

        if (to !== undefined) {
            to.total += 1;
        }
    }

    async function move(intent: MoveIntent): Promise<void> {
        const { task, columnKey } = intent;
        const sourceKey = columnKeyOf(task, options.groupBy.value);
        const patch = sourceKey === columnKey ? {} : columnPatch(options.groupBy.value, columnKey);

        if (snapshot === null) {
            beginDrag();
        }

        Object.assign(task, patch);
        recount(sourceKey, columnKey);

        dragging.value = true;

        try {
            const saved = await tasksApi.move(task.id, {
                ...patch,
                after_task_id: intent.after_task_id,
                before_task_id: intent.before_task_id,
            });

            Object.assign(task, saved);
            snapshot = null;
        } catch (error) {
            rollback();
            ui.error((error as ApiError).message);
        } finally {
            dragging.value = false;
        }
    }

    function insertRanked(column: BoardColumn, task: Task): void {
        const index = column.tasks.findIndex((candidate) => candidate.position > task.position);

        if (index === -1) {
            column.tasks.push(task);
        } else {
            column.tasks.splice(index, 0, task);
        }
    }

    function applyTask(task: Task): void {
        removeTask(task.id);

        const column = columnOf(columnKeyOf(task, options.groupBy.value));

        if (column === undefined) {
            return;
        }

        insertRanked(column, task);
        column.total += 1;
    }

    function removeTask(id: number): void {
        for (const column of columns.value) {
            const index = column.tasks.findIndex((task) => task.id === id);

            if (index !== -1) {
                column.tasks.splice(index, 1);
                column.total = Math.max(0, column.total - 1);
            }
        }
    }

    function addTask(task: Task): void {
        const column = columnOf(columnKeyOf(task, options.groupBy.value));

        if (column === undefined) {
            return;
        }

        column.tasks.push(task);
        column.total += 1;
    }

    return { columns, dragging, load, loadMore, beginDrag, move, applyTask, removeTask, addTask };
}
