import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePermissions } from '@/composables/usePermissions';
import { useAuthStore } from '@/stores/auth';
import {
    MANAGER_PERMISSIONS,
    USER_PERMISSIONS,
    makeProject,
    makeRole,
    makeTask,
    makeUser,
} from '@/tests/fixtures';
import { PERMISSIONS, type RoleSlug } from '@/types/enums';
import type { User } from '@/types/models';

vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));

function signIn(user: User): ReturnType<typeof usePermissions> {
    useAuthStore().$patch({ user, token: 'tok' });

    return usePermissions();
}

function signInAs(slug: RoleSlug, id = 1): ReturnType<typeof usePermissions> {
    return signIn(makeUser({ id, role: makeRole(slug) }));
}

beforeEach(() => {
    window.localStorage.clear();
    setActivePinia(createPinia());
});

describe('permission matrix', () => {
    it('grants an admin every permission through the wildcard', () => {
        const { can } = signInAs('admin');

        for (const permission of PERMISSIONS) {
            expect(can(permission), permission).toBe(true);
        }
    });

    it('grants a manager exactly the seeded set', () => {
        const { can } = signInAs('manager');

        for (const permission of PERMISSIONS) {
            expect(can(permission), permission).toBe(MANAGER_PERMISSIONS.includes(permission));
        }
    });

    it('grants a plain user exactly the seeded set', () => {
        const { can } = signInAs('user');

        for (const permission of PERMISSIONS) {
            expect(can(permission), permission).toBe(USER_PERMISSIONS.includes(permission));
        }
    });

    it('revokes everything when the role is deactivated', () => {
        const { can } = signIn(makeUser({ role: makeRole('admin', { is_active: false }) }));

        for (const permission of PERMISSIONS) {
            expect(can(permission), permission).toBe(false);
        }
    });
});

describe('project policy mirror', () => {
    it('lets a manager manage only their own projects', () => {
        const permissions = signInAs('manager', 7);

        expect(permissions.canUpdateProject(makeProject({ created_by: 7 }))).toBe(true);
        expect(permissions.canDeleteProject(makeProject({ created_by: 7 }))).toBe(true);
        expect(permissions.canUpdateProject(makeProject({ created_by: 8 }))).toBe(false);
        expect(permissions.canDeleteProject(makeProject({ created_by: 8 }))).toBe(false);
    });

    it('lets an admin manage projects they do not own (Gate::before)', () => {
        const permissions = signInAs('admin', 1);

        expect(permissions.canUpdateProject(makeProject({ created_by: 99 }))).toBe(true);
        expect(permissions.canDeleteProject(makeProject({ created_by: 99 }))).toBe(true);
    });

    it('denies a plain user, who has no project write permissions', () => {
        const permissions = signInAs('user', 3);

        expect(permissions.canUpdateProject(makeProject({ created_by: 3 }))).toBe(false);
        expect(permissions.canAddTaskToProject(makeProject({ created_by: 3 }))).toBe(false);
    });
});

describe('task policy mirror', () => {
    it('treats creator, assignee and owning manager as related', () => {
        const permissions = signInAs('manager', 5);

        expect(permissions.isRelatedToTask(makeTask({ created_by: 5, assigned_to: 9 }))).toBe(true);
        expect(permissions.isRelatedToTask(makeTask({ created_by: 9, assigned_to: 5 }))).toBe(true);
        expect(
            permissions.isRelatedToTask(
                makeTask({ created_by: 9, assigned_to: 9, project: makeProject({ created_by: 5 }) }),
            ),
        ).toBe(true);
        expect(
            permissions.isRelatedToTask(
                makeTask({ created_by: 9, assigned_to: 9, project: makeProject({ created_by: 9 }) }),
            ),
        ).toBe(false);
    });

    it('lets an assignee update but never delete', () => {
        const permissions = signInAs('user', 4);
        const task = makeTask({ created_by: 9, assigned_to: 4 });

        expect(permissions.canUpdateTask(task)).toBe(true);
        expect(permissions.canDeleteTask(task)).toBe(false);
    });

    it('restricts deletion to the task creator', () => {
        const permissions = signInAs('manager', 5);

        expect(permissions.canDeleteTask(makeTask({ created_by: 5 }))).toBe(true);
        expect(permissions.canDeleteTask(makeTask({ created_by: 6 }))).toBe(false);
    });
});

describe('user policy mirror', () => {
    it('always allows acting on yourself', () => {
        const permissions = signInAs('user', 2);
        const me = makeUser({ id: 2, role: makeRole('user') });

        expect(permissions.canViewUser(me)).toBe(true);
        expect(permissions.canUpdateUser(me)).toBe(true);
        expect(permissions.canUpdateUser(makeUser({ id: 3 }))).toBe(false);
    });

    it('exposes whether status and role_id may be sent at all', () => {
        expect(signInAs('admin').canManageUsers.value).toBe(true);
        expect(signInAs('manager').canManageUsers.value).toBe(false);
        expect(signInAs('user').canManageUsers.value).toBe(false);
    });
});
