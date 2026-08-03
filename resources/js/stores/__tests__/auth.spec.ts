import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import * as authApi from '@/api/auth';
import * as usersApi from '@/api/users';
import { useAuthStore } from '@/stores/auth';
import { makeRole, makeUser } from '@/tests/fixtures';
import { readToken, readUser, writeToken, writeUser } from '@/utils/tokenStorage';

vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));
vi.mock('@/api/auth');
vi.mock('@/api/users');

const mockedAuthApi = vi.mocked(authApi);
const mockedUsersApi = vi.mocked(usersApi);

beforeEach(() => {
    vi.resetAllMocks();
    window.localStorage.clear();
    setActivePinia(createPinia());
});

describe('login', () => {
    it('persists the token and the role-bearing user', async () => {
        const user = makeUser({ role: makeRole('manager') });
        mockedAuthApi.login.mockResolvedValue({ user, token: 'tok' });

        const auth = useAuthStore();
        await auth.login({ email: 'a@b.c', password: 'password' });

        expect(auth.isAuthenticated).toBe(true);
        expect(auth.role?.slug).toBe('manager');
        expect(readToken()).toBe('tok');
        expect(readUser()?.id).toBe(user.id);
    });

    it('leaves the session untouched when the credentials are rejected', async () => {
        mockedAuthApi.login.mockRejectedValue({ status: 422, errors: { email: ['bad'] } });

        const auth = useAuthStore();
        await expect(auth.login({ email: 'a@b.c', password: 'nope' })).rejects.toBeDefined();

        expect(auth.isAuthenticated).toBe(false);
        expect(readToken()).toBeNull();
    });
});

describe('logout', () => {
    it('clears the local session even when the request fails', async () => {
        writeToken('tok');
        writeUser(makeUser());
        mockedAuthApi.logout.mockRejectedValue({ status: 401, message: 'Не авторизован.' });

        const auth = useAuthStore();
        await auth.logout();

        expect(auth.isAuthenticated).toBe(false);
        expect(auth.user).toBeNull();
        expect(readToken()).toBeNull();
        expect(readUser()).toBeNull();
    });
});

describe('bootstrap', () => {
    it('does nothing and issues no request without a token', async () => {
        const auth = useAuthStore();
        await auth.bootstrap();

        expect(mockedAuthApi.fetchCurrentUserId).not.toHaveBeenCalled();
        expect(mockedUsersApi.show).not.toHaveBeenCalled();
        expect(auth.bootstrapped).toBe(true);
    });

    it('refreshes the cached user through users.show without hitting GET /user', async () => {
        writeToken('tok');
        writeUser(makeUser({ id: 9, first_name: 'Старое' }));
        mockedUsersApi.show.mockResolvedValue(makeUser({ id: 9, first_name: 'Новое' }));

        const auth = useAuthStore();
        await auth.bootstrap();

        expect(mockedAuthApi.fetchCurrentUserId).not.toHaveBeenCalled();
        expect(mockedUsersApi.show).toHaveBeenCalledWith(9);
        expect(auth.user?.first_name).toBe('Новое');
    });

    it('recovers the id via GET /user when the cache is empty', async () => {
        writeToken('tok');
        mockedAuthApi.fetchCurrentUserId.mockResolvedValue(4);
        mockedUsersApi.show.mockResolvedValue(makeUser({ id: 4 }));

        const auth = useAuthStore();
        await auth.bootstrap();

        expect(mockedAuthApi.fetchCurrentUserId).toHaveBeenCalledOnce();
        expect(mockedUsersApi.show).toHaveBeenCalledWith(4);
        expect(auth.user?.id).toBe(4);
    });

    it('drops the session on a 401 and keeps the message for the login screen', async () => {
        writeToken('stale');
        writeUser(makeUser({ id: 3 }));
        mockedUsersApi.show.mockRejectedValue({ isUnauthenticated: true, message: 'Не авторизован.' });

        const auth = useAuthStore();
        await auth.bootstrap();

        expect(auth.isAuthenticated).toBe(false);
        expect(auth.sessionEndedMessage).toBe('Не авторизован.');
    });

    it('drops the session when the account was disabled', async () => {
        writeToken('tok');
        writeUser(makeUser({ id: 3 }));
        mockedUsersApi.show.mockRejectedValue({
            isAccountDisabled: true,
            message: 'Аккаунт недоступен: Заблокирован.',
        });

        const auth = useAuthStore();
        await auth.bootstrap();

        expect(auth.isAuthenticated).toBe(false);
        expect(auth.sessionEndedMessage).toBe('Аккаунт недоступен: Заблокирован.');
    });

    it('keeps the cached session when the refresh fails for another reason', async () => {
        writeToken('tok');
        writeUser(makeUser({ id: 3 }));
        mockedUsersApi.show.mockRejectedValue({ isNetwork: true, message: 'Сервер недоступен.' });

        const auth = useAuthStore();
        await auth.bootstrap();

        expect(auth.isAuthenticated).toBe(true);
        expect(auth.user?.id).toBe(3);
    });

    it('runs at most once', async () => {
        writeToken('tok');
        mockedAuthApi.fetchCurrentUserId.mockResolvedValue(1);
        mockedUsersApi.show.mockResolvedValue(makeUser());

        const auth = useAuthStore();
        await auth.bootstrap();
        await auth.bootstrap();

        expect(mockedUsersApi.show).toHaveBeenCalledOnce();
    });
});

describe('can', () => {
    it('grants everything on the admin wildcard', () => {
        writeUser(makeUser({ role: makeRole('admin') }));

        const auth = useAuthStore();

        expect(auth.can('users.update')).toBe(true);
        expect(auth.can('statistics.view')).toBe(true);
        expect(auth.isAdmin).toBe(true);
    });

    it('matches the manager permission set', () => {
        writeUser(makeUser({ role: makeRole('manager') }));

        const auth = useAuthStore();

        expect(auth.can('projects.create')).toBe(true);
        expect(auth.can('statistics.view')).toBe(true);
        expect(auth.can('users.update')).toBe(false);
    });

    it('matches the plain user permission set', () => {
        writeUser(makeUser({ role: makeRole('user') }));

        const auth = useAuthStore();

        expect(auth.can('tasks.update')).toBe(true);
        expect(auth.can('tasks.create')).toBe(false);
        expect(auth.can('statistics.view')).toBe(false);
    });

    it('denies everything when the role is deactivated', () => {
        writeUser(makeUser({ role: makeRole('admin', { is_active: false }) }));

        expect(useAuthStore().can('projects.viewAny')).toBe(false);
    });

    it('denies everything when there is no role at all', () => {
        writeUser(makeUser({ role: undefined, role_id: null }));

        expect(useAuthStore().can('projects.viewAny')).toBe(false);
    });
});
