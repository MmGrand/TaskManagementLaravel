import { describe, expect, it } from 'vitest';
import { buildAssigneeTaskPayload, buildManageableTaskPayload } from '@/utils/taskPayload';
import type { TaskFormValues } from '@/utils/taskPayload';

function values(overrides: Partial<TaskFormValues> = {}): TaskFormValues {
    return {
        title: 'Задача',
        description: 'Описание',
        status: 'pending',
        priority: 'medium',
        project_id: '3',
        assigned_to: '7',
        due_date: '2026-08-01',
        ...overrides,
    };
}

describe('buildManageableTaskPayload', () => {
    it('keeps all seven required fields even when one value changed', () => {
        const payload = buildManageableTaskPayload(values({ status: 'completed' }));

        expect(Object.keys(payload).sort()).toEqual(
            ['assigned_to', 'description', 'due_date', 'priority', 'project_id', 'status', 'title'].sort(),
        );
    });

    it('converts the select strings to numeric ids', () => {
        const payload = buildManageableTaskPayload(values());

        expect(payload.project_id).toBe(3);
        expect(payload.assigned_to).toBe(7);
    });

    it('sends null, not an empty string, for a cleared due date', () => {
        expect(buildManageableTaskPayload(values({ due_date: '' })).due_date).toBeNull();
    });

    it('sends null for a cleared description', () => {
        expect(buildManageableTaskPayload(values({ description: '   ' })).description).toBeNull();
    });

    it('trims the title', () => {
        expect(buildManageableTaskPayload(values({ title: '  Задача  ' })).title).toBe('Задача');
    });
});

describe('buildAssigneeTaskPayload', () => {
    it('sends nothing but the status', () => {
        const payload = buildAssigneeTaskPayload('in_progress');

        expect(payload).toEqual({ status: 'in_progress' });
        expect(Object.keys(payload)).toHaveLength(1);
    });
});
