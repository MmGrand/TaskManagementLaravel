import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as usersApi from '@/api/users';
import * as rolesApi from '@/api/roles';
import { http } from '@/api/http';
import { makeRole, makeUser } from '@/tests/fixtures';

vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));

const mockedHttp = vi.mocked(http);
const payload = {
    first_name: 'Иван',
    last_name: 'Петров',
    email: 'a@b.c',
    phone: '+7',
};

beforeEach(() => {
    vi.resetAllMocks();
});

describe('save', () => {
    it('uses PUT with a JSON body when there is no avatar', async () => {
        mockedHttp.put.mockResolvedValue({ data: { data: makeUser() } });

        await usersApi.save(3, payload, null);

        expect(mockedHttp.put).toHaveBeenCalledWith('/users/3', payload);
        expect(mockedHttp.post).not.toHaveBeenCalled();
    });

    it('switches to POST with FormData when an avatar is attached', async () => {
        mockedHttp.post.mockResolvedValue({ data: { data: makeUser() } });
        const file = new File(['x'], 'a.png', { type: 'image/png' });

        await usersApi.save(3, payload, file);

        expect(mockedHttp.put).not.toHaveBeenCalled();

        const [url, body] = mockedHttp.post.mock.calls[0]!;

        expect(url).toBe('/users/3');
        expect(body).toBeInstanceOf(FormData);
        expect((body as FormData).get('avatar')).toBe(file);
    });

    it('unwraps the data envelope either way', async () => {
        const user = makeUser({ id: 3 });
        mockedHttp.put.mockResolvedValue({ data: { data: user } });

        await expect(usersApi.save(3, payload, null)).resolves.toBe(user);
    });
});

describe('roles api', () => {
    it('unwraps the unpaginated collection', async () => {
        const roles = [makeRole('admin'), makeRole('manager')];
        mockedHttp.get.mockResolvedValue({ data: { data: roles } });

        await expect(rolesApi.list()).resolves.toBe(roles);
        expect(mockedHttp.get).toHaveBeenCalledWith('/roles');
    });
});
