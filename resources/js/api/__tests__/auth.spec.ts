import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '@/api/auth';
import { http } from '@/api/http';
import { makeUser } from '@/tests/fixtures';

vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));

const mockedHttp = vi.mocked(http);

beforeEach(() => {
    vi.resetAllMocks();
});

describe('auth api', () => {
    it('reads the unwrapped {user, token} body returned by login', async () => {
        const user = makeUser();
        mockedHttp.post.mockResolvedValue({ data: { user, token: 'plain-text-token' } });

        const result = await authApi.login({ email: 'a@b.c', password: 'password' });

        expect(mockedHttp.post).toHaveBeenCalledWith('/login', { email: 'a@b.c', password: 'password' });
        expect(result.token).toBe('plain-text-token');
        expect(result.user).toBe(user);
    });

    it('sends password_confirmation on register', async () => {
        mockedHttp.post.mockResolvedValue({ data: { user: makeUser(), token: 't' } });

        await authApi.register({
            first_name: 'Иван',
            last_name: 'Петров',
            email: 'a@b.c',
            phone: '+70000000000',
            password: 'password',
            password_confirmation: 'password',
        });

        expect(mockedHttp.post).toHaveBeenCalledWith(
            '/register',
            expect.objectContaining({ password_confirmation: 'password' }),
        );
    });

    it('resolves on the empty 204 body returned by logout', async () => {
        mockedHttp.post.mockResolvedValue({ data: null });

        await expect(authApi.logout()).resolves.toBeUndefined();
        expect(mockedHttp.post).toHaveBeenCalledWith('/logout');
    });

    it('reads the id off the raw model returned by GET /user', async () => {
        mockedHttp.get.mockResolvedValue({ data: { id: 7, avatar: 'avatars/raw-path.jpg' } });

        await expect(authApi.fetchCurrentUserId()).resolves.toBe(7);
    });
});
