import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as usersApi from '@/api/users';
import { http } from '@/api/http';
import { makeMeta, makeUser } from '@/tests/fixtures';

vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));

const mockedHttp = vi.mocked(http);

beforeEach(() => {
    vi.resetAllMocks();
});

describe('users api', () => {
    it('unwraps the data envelope on show', async () => {
        const user = makeUser({ id: 5 });
        mockedHttp.get.mockResolvedValue({ data: { data: user } });

        await expect(usersApi.show(5)).resolves.toBe(user);
        expect(mockedHttp.get).toHaveBeenCalledWith('/users/5');
    });

    it('flattens the paginated envelope into items and meta', async () => {
        const meta = makeMeta({ total: 2, last_page: 3 });
        mockedHttp.get.mockResolvedValue({ data: { data: [makeUser()], links: {}, meta } });

        const page = await usersApi.list(2);

        expect(mockedHttp.get).toHaveBeenCalledWith('/users', { params: { page: 2 } });
        expect(page.items).toHaveLength(1);
        expect(page.meta).toBe(meta);
    });

    it('reads assignees from their own endpoint', async () => {
        const meta = makeMeta({ total: 1, last_page: 1 });
        mockedHttp.get.mockResolvedValue({ data: { data: [makeUser()], links: {}, meta } });

        const page = await usersApi.listAssignable(2);

        expect(mockedHttp.get).toHaveBeenCalledWith('/users/assignable', { params: { page: 2 } });
        expect(page.items).toHaveLength(1);
        expect(page.meta).toBe(meta);
    });
});
