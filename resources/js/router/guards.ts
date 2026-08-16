import { watch } from 'vue';
import type { NavigationGuardWithThis, RouteLocationNormalized, Router } from 'vue-router';
import { i18n } from '@/i18n';
import { activeLocale } from '@/i18n/locale-state';
import { useAuthStore } from '@/stores/auth';
import { APP_NAME } from '@/utils/appName';

/**
 * Восстанавливает сессию до разрешения первого перехода, а затем применяет
 * meta-поля маршрута `guestOnly` / `requiresAuth` / `permission`.
 */
export const authGuard: NavigationGuardWithThis<undefined> = async (to) => {
    const auth = useAuthStore();

    await auth.bootstrap();

    if (to.meta.guestOnly && auth.isAuthenticated) {
        return { name: 'dashboard' };
    }

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        return { name: 'login', query: { redirect: to.fullPath } };
    }

    if (to.meta.permission && !auth.can(to.meta.permission)) {
        return { name: 'forbidden' };
    }

    return true;
};

/**
 * `i18n.global.t`, а не `useI18n()`: гварды регистрируются вне компонента,
 * а в тестах роутер создаётся вообще без Vue-приложения.
 */
function applyTitle(route: RouteLocationNormalized): void {
    document.title = route.meta.titleKey ? `${i18n.global.t(route.meta.titleKey)} — ${APP_NAME}` : APP_NAME;
}

export function registerGuards(router: Router): void {
    router.beforeEach(authGuard);
    router.afterEach(applyTitle);

    // Заголовок вкладки не перерисовывается сам — переставляем его при смене языка.
    watch(activeLocale, () => applyTitle(router.currentRoute.value));
}
