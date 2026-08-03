import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { Project, Task, User } from '@/types/models';
import type { Permission } from '@/types/enums';

/**
 * Клиентское отражение бэкендовых gate'ов и policy.
 *
 * Существует исключительно для того, чтобы UI мог скрывать действия, которые
 * всё равно провалятся; единственным источником истины остаётся сервер.
 * `Gate::before` даёт админам все права, поэтому каждая проверка владения ниже
 * начинается с короткого замыкания через `isAdmin`.
 *
 * Одна policy намеренно не отражена: `ProjectPolicy::view` для обычного
 * пользователя спрашивает у базы, есть ли у него задача в проекте. На клиенте
 * это не проверить, поэтому вместо этого используются эндпоинты списков (уже
 * ограниченные `visibleTo`) и корректная обработка 403.
 */
export function usePermissions() {
    const auth = useAuthStore();

    const currentUser = computed<User | null>(() => auth.user);
    const isAdmin = computed(() => auth.isAdmin);
    const isManager = computed(() => auth.isManager);

    function can(permission: Permission): boolean {
        return auth.can(permission);
    }

    function isMe(userId: number | null | undefined): boolean {
        return userId !== null && userId !== undefined && userId === currentUser.value?.id;
    }

    /** ProjectPolicy::update */
    function canUpdateProject(project: Project): boolean {
        return isAdmin.value || (can('projects.update') && isMe(project.created_by));
    }

    /** ProjectPolicy::delete */
    function canDeleteProject(project: Project): boolean {
        return isAdmin.value || (can('projects.delete') && isMe(project.created_by));
    }

    /** ProjectPolicy::addTask — требуется до того, как задача сможет ссылаться на проект. */
    function canAddTaskToProject(project: Project): boolean {
        return isAdmin.value || (can('tasks.create') && isMe(project.created_by));
    }

    /** TaskPolicy::isRelatedTo */
    function isRelatedToTask(task: Task): boolean {
        return (
            isMe(task.created_by) ||
            isMe(task.assigned_to) ||
            (isManager.value && isMe(task.project?.created_by))
        );
    }

    /** TaskPolicy::update */
    function canUpdateTask(task: Task): boolean {
        return isAdmin.value || (can('tasks.update') && isRelatedToTask(task));
    }

    /** TaskPolicy::delete */
    function canDeleteTask(task: Task): boolean {
        return isAdmin.value || (can('tasks.delete') && isMe(task.created_by));
    }

    /** UserPolicy::view — себе самому доступ разрешён всегда. */
    function canViewUser(user: User): boolean {
        return isAdmin.value || isMe(user.id) || can('users.view');
    }

    /** UserPolicy::update — себе самому доступ разрешён всегда. */
    function canUpdateUser(user: User): boolean {
        return isAdmin.value || isMe(user.id) || can('users.update');
    }

    /** Может ли `status` и `role_id` вообще входить в payload пользователя. */
    const canManageUsers = computed(() => can('users.update'));

    return {
        currentUser,
        isAdmin,
        isManager,
        canManageUsers,
        can,
        isMe,
        canUpdateProject,
        canDeleteProject,
        canAddTaskToProject,
        isRelatedToTask,
        canUpdateTask,
        canDeleteTask,
        canViewUser,
        canUpdateUser,
    };
}
