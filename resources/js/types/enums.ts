/**
 * Отражает строковые enum'ы из app/Enums — только значения и типы.
 * Подписи к ним живут в файлах локалей под ключом `enums.*`, читаются
 * через @/composables/useEnumLabel.
 *
 * Держать в синхронизации с:
 *   app/Enums/TaskStatus.php, TaskPriority.php, ProjectStatus.php,
 *   app/Enums/UserStatus.php, RoleSlug.php, Permission.php
 */

export const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PROJECT_STATUSES = ['active', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const USER_STATUSES = ['active', 'inactive', 'blocked'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const ROLE_SLUGS = ['admin', 'manager', 'user'] as const;
export type RoleSlug = (typeof ROLE_SLUGS)[number];

export const PERMISSIONS = [
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
    'users.viewAny',
    'users.view',
    'users.viewAssignable',
    'users.update',
    'statistics.view',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Wildcard-разрешение, выдаваемое роли админа через RoleSlug::defaultPermissions(). */
export const PERMISSION_WILDCARD = '*';
