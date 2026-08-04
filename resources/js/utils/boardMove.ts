import type { TaskPriority, TaskStatus } from '@/types/enums';
import type { Task } from '@/types/models';

export type BoardGroupBy = 'status' | 'priority' | 'assigned_to';

export interface MoveNeighbours {
    after_task_id: number | null;
    before_task_id: number | null;
}

export function neighboursAt(tasks: Task[], index: number): MoveNeighbours {
    return {
        after_task_id: tasks[index - 1]?.id ?? null,
        before_task_id: tasks[index + 1]?.id ?? null,
    };
}

export function columnPatch(
    groupBy: BoardGroupBy,
    columnKey: string,
): Partial<Pick<Task, 'status' | 'priority' | 'assigned_to'>> {
    if (groupBy === 'status') {
        return { status: columnKey as TaskStatus };
    }

    if (groupBy === 'priority') {
        return { priority: columnKey as TaskPriority };
    }

    return { assigned_to: Number(columnKey) };
}

export function columnKeyOf(task: Task, groupBy: BoardGroupBy): string {
    return String(task[groupBy]);
}
