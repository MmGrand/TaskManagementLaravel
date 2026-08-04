import { describe, expect, it } from 'vitest';
import { columnKeyOf, columnPatch, neighboursAt } from '@/utils/boardMove';
import { makeTask } from '@/tests/fixtures';

const tasks = [makeTask({ id: 1 }), makeTask({ id: 2 }), makeTask({ id: 3 })];

describe('neighboursAt', () => {
    it('names both neighbours in the middle of a column', () => {
        expect(neighboursAt(tasks, 1)).toEqual({ after_task_id: 1, before_task_id: 3 });
    });

    it('leaves the upper neighbour null at the top', () => {
        expect(neighboursAt(tasks, 0)).toEqual({ after_task_id: null, before_task_id: 2 });
    });

    it('leaves the lower neighbour null at the bottom', () => {
        expect(neighboursAt(tasks, 2)).toEqual({ after_task_id: 2, before_task_id: null });
    });

    it('reports no neighbours in a column of one', () => {
        expect(neighboursAt([makeTask({ id: 9 })], 0)).toEqual({
            after_task_id: null,
            before_task_id: null,
        });
    });

    it('reports no neighbours for a drop into an empty column', () => {
        expect(neighboursAt([], 0)).toEqual({ after_task_id: null, before_task_id: null });
    });
});

describe('columnPatch', () => {
    it('patches the dimension the board is grouped by', () => {
        expect(columnPatch('status', 'completed')).toEqual({ status: 'completed' });
        expect(columnPatch('priority', 'high')).toEqual({ priority: 'high' });
        expect(columnPatch('assigned_to', '7')).toEqual({ assigned_to: 7 });
    });
});

describe('columnKeyOf', () => {
    it('reads the current column of a task as a string key', () => {
        const task = makeTask({ status: 'in_progress', priority: 'low', assigned_to: 4 });

        expect(columnKeyOf(task, 'status')).toBe('in_progress');
        expect(columnKeyOf(task, 'priority')).toBe('low');
        expect(columnKeyOf(task, 'assigned_to')).toBe('4');
    });
});
