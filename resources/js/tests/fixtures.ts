import type { Page, PageMeta } from '@/types/api';
import type { Project, Role, Task, User } from '@/types/models';
import type { Permission, RoleSlug } from '@/types/enums';

/**
 * Permission sets copied verbatim from RoleSlug::defaultPermissions() so the
 * frontend mirror is tested against what the seeder actually stores.
 */
export const ADMIN_PERMISSIONS: ('*' | Permission)[] = ['*'];

export const MANAGER_PERMISSIONS: Permission[] = [
    'projects.viewAny',
    'projects.view',
    'projects.create',
    'projects.update',
    'projects.delete',
    'tasks.viewAny',
    'tasks.view',
    'tasks.create',
    'tasks.update',
    'tasks.delete',
    'users.viewAssignable',
    'statistics.view',
];

export const USER_PERMISSIONS: Permission[] = [
    'projects.viewAny',
    'projects.view',
    'tasks.viewAny',
    'tasks.view',
    'tasks.update',
];

const ROLE_DEFAULTS: Record<RoleSlug, { id: number; name: string; permissions: ('*' | Permission)[] }> = {
    admin: { id: 1, name: 'Администратор', permissions: ADMIN_PERMISSIONS },
    manager: { id: 2, name: 'Менеджер', permissions: MANAGER_PERMISSIONS },
    user: { id: 3, name: 'Пользователь', permissions: USER_PERMISSIONS },
};

export function makeRole(slug: RoleSlug, overrides: Partial<Role> = {}): Role {
    const defaults = ROLE_DEFAULTS[slug];

    return {
        id: defaults.id,
        slug,
        name: defaults.name,
        permissions: defaults.permissions,
        is_active: true,
        created_at: '2026-01-01T00:00:00.000000Z',
        updated_at: '2026-01-01T00:00:00.000000Z',
        ...overrides,
    };
}

export function makeUser(overrides: Partial<User> = {}): User {
    const role = overrides.role ?? makeRole('user');

    return {
        id: 1,
        first_name: 'Иван',
        last_name: 'Петров',
        email: 'ivan@example.com',
        status: 'active',
        avatar: null,
        phone: '+70000000000',
        role_id: role.id,
        role,
        created_at: '2026-01-01T00:00:00.000000Z',
        updated_at: '2026-01-01T00:00:00.000000Z',
        ...overrides,
    };
}

export function makeProject(overrides: Partial<Project> = {}): Project {
    return {
        id: 1,
        name: 'Проект',
        description: null,
        status: 'active',
        created_by: 1,
        created_at: '2026-01-01T00:00:00.000000Z',
        updated_at: '2026-01-01T00:00:00.000000Z',
        ...overrides,
    };
}

export function makeTask(overrides: Partial<Task> = {}): Task {
    return {
        id: 1,
        title: 'Задача',
        description: null,
        status: 'pending',
        priority: 'medium',
        project_id: 1,
        assigned_to: 1,
        created_by: 1,
        due_date: null,
        position: 1000,
        project: makeProject(),
        created_at: '2026-01-01T00:00:00.000000Z',
        updated_at: '2026-01-01T00:00:00.000000Z',
        ...overrides,
    };
}

export function makeMeta(overrides: Partial<PageMeta> = {}): PageMeta {
    const total = overrides.total ?? 1;

    return {
        current_page: 1,
        from: total === 0 ? null : 1,
        last_page: 1,
        path: 'http://localhost/api/items',
        per_page: 15,
        to: total === 0 ? null : total,
        total,
        links: [],
        ...overrides,
    };
}

export function makePage<T>(items: T[], meta: Partial<PageMeta> = {}): Page<T> {
    return { items, meta: makeMeta({ total: items.length, ...meta }) };
}

/** Формирует axios-подобный reject для тестов normalizeError. */
export function makeHttpError(
    status: number,
    data: unknown = {},
    headers: Record<string, unknown> = {},
): unknown {
    return { response: { status, data, headers } };
}
