import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import type { Router } from 'vue-router';
import * as authApi from '@/api/auth';
import * as usersApi from '@/api/users';
import { registerGuards } from '@/router/guards';
import { routes } from '@/router/routes';
import { useAuthStore } from '@/stores/auth';
import { makeRole, makeUser } from '@/tests/fixtures';
import { writeToken, writeUser } from '@/utils/tokenStorage';

vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));
vi.mock('@/api/auth');
vi.mock('@/api/users');

function buildRouter(): Router {
    const router = createRouter({ history: createMemoryHistory(), routes });

    registerGuards(router);

    return router;
}

beforeEach(() => {
    vi.resetAllMocks();
    window.localStorage.clear();
    setActivePinia(createPinia());
});

describe('auth guard', () => {
    it('sends an anonymous visitor to login and remembers where they were going', async () => {
        const router = buildRouter();

        await router.push('/');

        expect(router.currentRoute.value.name).toBe('login');
        expect(router.currentRoute.value.query.redirect).toBe('/');
    });

    it('lets an authenticated visitor through', async () => {
        writeToken('tok');
        writeUser(makeUser());
        vi.mocked(usersApi).show.mockResolvedValue(makeUser());

        const router = buildRouter();
        await router.push('/');

        expect(router.currentRoute.value.name).toBe('dashboard');
    });

    it('redirects an authenticated visitor away from the login screen', async () => {
        writeToken('tok');
        writeUser(makeUser());
        vi.mocked(usersApi).show.mockResolvedValue(makeUser());

        const router = buildRouter();
        await router.push('/login');

        expect(router.currentRoute.value.name).toBe('dashboard');
    });

    it('sends a visitor lacking the route permission to the forbidden page', async () => {
        writeToken('tok');
        writeUser(makeUser({ role: makeRole('user') }));
        vi.mocked(usersApi).show.mockResolvedValue(makeUser({ role: makeRole('user') }));

        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                ...routes,
                {
                    path: '/stats',
                    name: 'stats',
                    component: { template: '<div />' },
                    meta: { requiresAuth: true, permission: 'statistics.view' },
                },
            ],
        });
        registerGuards(router);

        await router.push('/stats');

        expect(router.currentRoute.value.name).toBe('forbidden');
    });

    it('bootstraps the session only once across navigations', async () => {
        writeToken('tok');
        writeUser(makeUser());
        vi.mocked(usersApi).show.mockResolvedValue(makeUser());

        const router = buildRouter();
        await router.push('/');
        await router.push('/403');

        expect(vi.mocked(usersApi).show).toHaveBeenCalledOnce();
    });

    it('falls back to the not-found route for unknown paths', async () => {
        const router = buildRouter();

        await router.push('/definitely-not-a-route');

        expect(router.currentRoute.value.name).toBe('not-found');
    });

    it('keeps a bootstrap failure from blocking navigation', async () => {
        writeToken('tok');
        vi.mocked(authApi).fetchCurrentUserId.mockRejectedValue({ isUnauthenticated: true, message: 'Не авторизован.' });

        const router = buildRouter();
        await router.push('/');

        expect(router.currentRoute.value.name).toBe('login');
        expect(useAuthStore().sessionEndedMessage).toBe('Не авторизован.');
    });
});

describe('title guard', () => {
    it('writes the route title into the document', async () => {
        const router = buildRouter();

        await router.push('/login');

        expect(document.title).toBe('Вход — Task Management');
    });
});
