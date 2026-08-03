import type {
    Permission,
    ProjectStatus,
    RoleSlug,
    TaskPriority,
    TaskStatus,
    UserStatus,
} from '@/types/enums';

/**
 * Связи, защищённые `whenLoaded` в API resources, опциональны, но никогда не
 * nullable: ключ полностью отсутствует, если связь не была подгружена.
 * Всегда обращайтесь к ним через optional chaining.
 */

export interface Role {
    id: number;
    slug: RoleSlug;
    name: string;
    permissions: (Permission | '*')[] | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: UserStatus;
    avatar: string | null;
    phone: string;
    role_id: number | null;
    role?: Role;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: number;
    name: string;
    description: string | null;
    status: ProjectStatus;
    created_by: number;
    creator?: User;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: number;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    project_id: number;
    assigned_to: number;
    created_by: number;
    /** Только дата, "YYYY-MM-DD". */
    due_date: string | null;
    project?: Project;
    assigned_user?: User;
    created_by_user?: User;
    created_at: string;
    updated_at: string;
}

export interface TopActiveUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    tasks_created_count: number;
}

export interface Statistics {
    projects_count: number;
    tasks_count: number;
    tasks_by_status: Record<TaskStatus, number>;
    overdue_tasks_count: number;
    top_active_users: TopActiveUser[];
}
