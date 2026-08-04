import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as tasksApi from '@/api/tasks';
import { http } from '@/api/http';
import { makeMeta, makeTask } from '@/tests/fixtures';

vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));

const mockedHttp = vi.mocked(http);

function paramsOfLastGet(): Record<string, unknown> {
    return mockedHttp.get.mock.calls[0]![1]!.params as Record<string, unknown>;
}

beforeEach(() => {
    vi.resetAllMocks();
    mockedHttp.get.mockResolvedValue({ data: { data: [], links: {}, meta: makeMeta() } });
});

describe('list', () => {
    it('forwards every supported filter verbatim', async () => {
        await tasksApi.list({
            status: 'in_progress',
            priority: 'high',
            project_id: '3',
            assigned_to: '7',
            due_date_from: '2026-08-01',
            due_date_to: '2026-08-31',
            created_from: '2026-07-01',
            created_to: '2026-07-31',
        });

        expect(paramsOfLastGet()).toEqual({
            status: 'in_progress',
            priority: 'high',
            project_id: '3',
            assigned_to: '7',
            due_date_from: '2026-08-01',
            due_date_to: '2026-08-31',
            created_from: '2026-07-01',
            created_to: '2026-07-31',
        });
    });

    it('forwards the sort parameters', async () => {
        await tasksApi.list({ sort_by: 'due_date', sort_direction: 'asc' });

        expect(paramsOfLastGet()).toEqual({ sort_by: 'due_date', sort_direction: 'asc' });
    });

    it('omits cleared filters so exists rules are not tripped by empty strings', async () => {
        await tasksApi.list({ status: '', project_id: '', assigned_to: '', due_date_from: '' });

        expect(paramsOfLastGet()).toEqual({});
    });

    it('omits page 1 and sends any later page', async () => {
        await tasksApi.list({ page: 1 });
        expect(paramsOfLastGet()).toEqual({});

        vi.resetAllMocks();
        mockedHttp.get.mockResolvedValue({ data: { data: [], links: {}, meta: makeMeta() } });
        await tasksApi.list({ page: 4 });
        expect(paramsOfLastGet()).toEqual({ page: 4 });
    });

    it('flattens the paginated envelope', async () => {
        const meta = makeMeta({ total: 1 });
        mockedHttp.get.mockResolvedValue({ data: { data: [makeTask()], links: {}, meta } });

        const page = await tasksApi.list();

        expect(page.items).toHaveLength(1);
        expect(page.meta).toBe(meta);
    });
});

describe('writes', () => {
    it('updates with PUT, never PATCH', async () => {
        mockedHttp.put.mockResolvedValue({ data: { data: makeTask() } });

        await tasksApi.update(5, { status: 'completed' });

        expect(mockedHttp.put).toHaveBeenCalledWith('/tasks/5', { status: 'completed' });
        expect(mockedHttp.post).not.toHaveBeenCalled();
    });

    it('unwraps the data envelope on create', async () => {
        const task = makeTask({ id: 11 });
        mockedHttp.post.mockResolvedValue({ data: { data: task } });

        const payload = {
            title: 'Новая',
            description: null,
            status: 'pending' as const,
            priority: 'low' as const,
            project_id: 1,
            assigned_to: 2,
            due_date: null,
        };

        await expect(tasksApi.create(payload)).resolves.toBe(task);
        expect(mockedHttp.post).toHaveBeenCalledWith('/tasks', payload);
    });

    it('moves with PATCH and names the neighbours instead of a position', async () => {
        const task = makeTask({ id: 1, status: 'in_progress' });
        mockedHttp.patch.mockResolvedValue({ data: { data: task } });

        const payload = {
            status: 'in_progress' as const,
            after_task_id: 4,
            before_task_id: null,
        };

        await expect(tasksApi.move(1, payload)).resolves.toBe(task);
        expect(mockedHttp.patch).toHaveBeenCalledWith('/tasks/1/move', payload);
        expect(mockedHttp.put).not.toHaveBeenCalled();
    });

    it('tolerates the empty 204 body on delete', async () => {
        mockedHttp.delete.mockResolvedValue({ data: null });

        await expect(tasksApi.remove(9)).resolves.toBeUndefined();
    });
});
