import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AppNav from '@/components/layout/AppNav.vue';
import { makeRole, makeUser } from '@/tests/fixtures';
import type { RoleSlug } from '@/types/enums';

vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));

function mountNavAs(slug: RoleSlug) {
    return mount(AppNav, {
        global: {
            plugins: [
                createTestingPinia({
                    createSpy: vi.fn,
                    // `can()` — реальная проверка прав, а не побочный эффект: в
                    // setup-сторе любая возвращаемая функция считается action'ом,
                    // поэтому стаб заставил бы её вернуть undefined.
                    stubActions: false,
                    initialState: { auth: { token: 'tok', user: makeUser({ role: makeRole(slug) }) } },
                }),
            ],
            stubs: { RouterLink: RouterLinkStub },
        },
    });
}

beforeEach(() => {
    window.localStorage.clear();
});

describe('AppNav', () => {
    it('shows every section to an admin', () => {
        const text = mountNavAs('admin').text();

        expect(text).toContain('Проекты');
        expect(text).toContain('Задачи');
        expect(text).toContain('Пользователи');
    });

    it('shows users to a manager, who has users.viewAny', () => {
        expect(mountNavAs('manager').text()).toContain('Пользователи');
    });

    it('hides users from a plain user, who would get a 403', () => {
        const text = mountNavAs('user').text();

        expect(text).toContain('Проекты');
        expect(text).toContain('Задачи');
        expect(text).not.toContain('Пользователи');
    });
});
