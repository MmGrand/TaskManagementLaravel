import { describe, expect, it } from 'vitest';
import { isTaskManageableBy, isTaskOverdue, toDateInput } from '@/utils/taskAccess';
import { makeProject, makeRole, makeTask, makeUser } from '@/tests/fixtures';

const admin = makeUser({ id: 1, role: makeRole('admin') });
const manager = makeUser({ id: 2, role: makeRole('manager') });
const plainUser = makeUser({ id: 3, role: makeRole('user') });

describe('isTaskManageableBy', () => {
    it('always allows an admin', () => {
        expect(isTaskManageableBy(makeTask({ created_by: 99 }), admin)).toBe(true);
    });

    it('allows the task creator regardless of role', () => {
        expect(isTaskManageableBy(makeTask({ created_by: 3 }), plainUser)).toBe(true);
    });

    it('allows a manager who owns the project', () => {
        const task = makeTask({ created_by: 99, project: makeProject({ created_by: 2 }) });

        expect(isTaskManageableBy(task, manager)).toBe(true);
    });

    it('denies a manager who does not own the project', () => {
        const task = makeTask({ created_by: 99, project: makeProject({ created_by: 77 }) });

        expect(isTaskManageableBy(task, manager)).toBe(false);
    });

    it('denies a plain user who is only the assignee', () => {
        const task = makeTask({ created_by: 99, assigned_to: 3 });

        expect(isTaskManageableBy(task, plainUser)).toBe(false);
    });

    it('denies when the project relation was not loaded', () => {
        const task = makeTask({ created_by: 99, project: undefined });

        expect(isTaskManageableBy(task, manager)).toBe(false);
    });

    it('denies an anonymous caller', () => {
        expect(isTaskManageableBy(makeTask(), null)).toBe(false);
    });
});

describe('isTaskOverdue', () => {
    const today = new Date(2026, 6, 15);

    it('flags a past due date on an unfinished task', () => {
        expect(isTaskOverdue(makeTask({ due_date: '2026-07-14' }), today)).toBe(true);
    });

    it('does not flag a task due today', () => {
        expect(isTaskOverdue(makeTask({ due_date: '2026-07-15' }), today)).toBe(false);
    });

    it('never flags a completed task', () => {
        expect(isTaskOverdue(makeTask({ due_date: '2026-01-01', status: 'completed' }), today)).toBe(false);
    });

    it('never flags a task without a due date', () => {
        expect(isTaskOverdue(makeTask({ due_date: null }), today)).toBe(false);
    });
});

describe('toDateInput', () => {
    it('formats in local time, not UTC', () => {
        expect(toDateInput(new Date(2026, 0, 5))).toBe('2026-01-05');
        expect(toDateInput(new Date(2026, 11, 31))).toBe('2026-12-31');
    });
});
