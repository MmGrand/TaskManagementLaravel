import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as projectsApi from '@/api/projects';
import { http } from '@/api/http';
import { makeMeta, makeProject } from '@/tests/fixtures';

vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));

const mockedHttp = vi.mocked(http);

beforeEach(() => {
    vi.resetAllMocks();
});

describe('list', () => {
    it('flattens the paginated envelope', async () => {
        const meta = makeMeta({ total: 2 });
        mockedHttp.get.mockResolvedValue({ data: { data: [makeProject()], links: {}, meta } });

        const page = await projectsApi.list();

        expect(page.items).toHaveLength(1);
        expect(page.meta).toBe(meta);
    });

    it('forwards the status filter and the page', async () => {
        mockedHttp.get.mockResolvedValue({ data: { data: [], links: {}, meta: makeMeta() } });

        await projectsApi.list({ status: 'archived', page: 3 });

        expect(mockedHttp.get).toHaveBeenCalledWith('/projects', {
            params: { status: 'archived', page: 3 },
        });
    });

    it('omits blank filters instead of sending empty strings', async () => {
        mockedHttp.get.mockResolvedValue({ data: { data: [], links: {}, meta: makeMeta() } });

        await projectsApi.list({ status: '', page: 1 });

        expect(mockedHttp.get).toHaveBeenCalledWith('/projects', { params: {} });
    });

    it('never sends per_page, which the backend ignores', async () => {
        mockedHttp.get.mockResolvedValue({ data: { data: [], links: {}, meta: makeMeta() } });

        await projectsApi.list({ status: 'active', page: 2 });

        const params = mockedHttp.get.mock.calls[0]![1]!.params as Record<string, unknown>;

        expect(Object.keys(params)).not.toContain('per_page');
    });
});

describe('writes', () => {
    it('unwraps the data envelope on create', async () => {
        const project = makeProject({ id: 4 });
        mockedHttp.post.mockResolvedValue({ data: { data: project } });

        const payload = { name: 'Новый', description: null, status: 'active' as const };

        await expect(projectsApi.create(payload)).resolves.toBe(project);
        expect(mockedHttp.post).toHaveBeenCalledWith('/projects', payload);
    });

    it('uses PUT with the full payload, because there is no PATCH', async () => {
        mockedHttp.put.mockResolvedValue({ data: { data: makeProject() } });

        const payload = { name: 'Изменён', description: 'Текст', status: 'completed' as const };
        await projectsApi.update(7, payload);

        expect(mockedHttp.put).toHaveBeenCalledWith('/projects/7', payload);
        expect(Object.keys(payload)).toEqual(['name', 'description', 'status']);
    });

    it('tolerates the empty 204 body on delete', async () => {
        mockedHttp.delete.mockResolvedValue({ data: null });

        await expect(projectsApi.remove(2)).resolves.toBeUndefined();
        expect(mockedHttp.delete).toHaveBeenCalledWith('/projects/2');
    });
});
