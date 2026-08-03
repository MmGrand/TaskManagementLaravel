import type { RouteRecordRaw } from 'vue-router';
import type { Permission } from '@/types/enums';

declare module 'vue-router' {
    interface RouteMeta {
        /** Перенаправляет авторизованного посетителя прочь (login, register). */
        guestOnly?: boolean;
        requiresAuth?: boolean;
        /** Проверяется через клиентское отражение User::hasPermission. */
        permission?: Permission;
        /** Ключ перевода: заголовок вкладки собирается в guards.ts. */
        titleKey?: string;
    }
}

export const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { guestOnly: true, titleKey: 'routes.login' },
    },
    {
        path: '/register',
        name: 'register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: { guestOnly: true, titleKey: 'routes.register' },
    },
    {
        path: '/',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { requiresAuth: true, titleKey: 'routes.dashboard' },
    },
    {
        path: '/projects',
        name: 'projects',
        component: () => import('@/views/projects/ProjectsListView.vue'),
        meta: { requiresAuth: true, permission: 'projects.viewAny', titleKey: 'routes.projects' },
    },
    {
        path: '/projects/:id(\\d+)',
        name: 'project',
        component: () => import('@/views/projects/ProjectShowView.vue'),
        meta: { requiresAuth: true, permission: 'projects.view', titleKey: 'routes.project' },
    },
    {
        path: '/tasks',
        name: 'tasks',
        component: () => import('@/views/tasks/TasksListView.vue'),
        meta: { requiresAuth: true, permission: 'tasks.viewAny', titleKey: 'routes.tasks' },
    },
    {
        path: '/tasks/:id(\\d+)',
        name: 'task',
        component: () => import('@/views/tasks/TaskShowView.vue'),
        meta: { requiresAuth: true, permission: 'tasks.view', titleKey: 'routes.task' },
    },
    {
        path: '/users',
        name: 'users',
        component: () => import('@/views/users/UsersListView.vue'),
        meta: { requiresAuth: true, permission: 'users.viewAny', titleKey: 'routes.users' },
    },
    {
        path: '/profile',
        name: 'profile',
        component: () => import('@/views/users/ProfileView.vue'),
        meta: { requiresAuth: true, titleKey: 'routes.profile' },
    },
    {
        path: '/403',
        name: 'forbidden',
        component: () => import('@/views/errors/ForbiddenView.vue'),
        meta: { requiresAuth: true, titleKey: 'routes.forbidden' },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/views/errors/NotFoundView.vue'),
        meta: { titleKey: 'routes.notFound' },
    },
];
