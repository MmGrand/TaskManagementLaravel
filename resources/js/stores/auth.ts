import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import * as authApi from '@/api/auth';
import * as usersApi from '@/api/users';
import { setSessionEndedHandler } from '@/api/http';
import type { ApiError } from '@/types/api';
import type { User } from '@/types/models';
import { PERMISSION_WILDCARD, type Permission } from '@/types/enums';
import { clearSession, readToken, readUser, writeToken, writeUser } from '@/utils/tokenStorage';

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(readToken());
    const user = ref<User | null>(readUser());
    const bootstrapped = ref(false);
    /** Сообщение на экране входа после завершения сессии. */
    const sessionEndedMessage = ref<string | null>(null);

    const isAuthenticated = computed(() => token.value !== null);
    const role = computed(() => user.value?.role ?? null);
    const isAdmin = computed(() => role.value?.slug === 'admin');
    const isManager = computed(() => role.value?.slug === 'manager');

    /** Отражает User::hasPermission — см. app/Models/User.php. */
    function can(permission: Permission): boolean {
        const current = role.value;

        if (!current || current.is_active !== true) {
            return false;
        }

        const permissions = current.permissions ?? [];

        return permissions.includes(PERMISSION_WILDCARD) || permissions.includes(permission);
    }

    function setSession(nextUser: User, nextToken: string): void {
        user.value = nextUser;
        token.value = nextToken;
        sessionEndedMessage.value = null;
        writeToken(nextToken);
        writeUser(nextUser);
    }

    function setUser(nextUser: User): void {
        user.value = nextUser;
        writeUser(nextUser);
    }

    function clear(message: string | null = null): void {
        user.value = null;
        token.value = null;
        sessionEndedMessage.value = message;
        clearSession();
    }

    async function login(credentials: authApi.Credentials): Promise<void> {
        const result = await authApi.login(credentials);

        setSession(result.user, result.token);
        bootstrapped.value = true;
    }

    async function register(payload: authApi.RegistrationPayload): Promise<void> {
        const result = await authApi.register(payload);

        setSession(result.user, result.token);
        bootstrapped.value = true;
    }

    async function logout(): Promise<void> {
        try {
            await authApi.logout();
        } catch {
            // Токен на сервере мог уже исчезнуть; локальная сессия в любом
            // случае будет очищена.
        } finally {
            clear();
        }
    }

    /**
     * Восстанавливает сессию при холодном старте.
     *
     * Закэшированный пользователь приходит из login/register, где роль
     * загружается сразу, поэтому его безопасно рендерить немедленно. Затем он
     * обновляется через `users.show(id)`, так как только этот эндпоинт
     * возвращает пользователя и с ролью, и с рабочей ссылкой на аватар —
     * `GET /api/user` отдаёт сырую модель и используется только для получения
     * id, когда кэш пуст.
     */
    async function bootstrap(): Promise<void> {
        if (bootstrapped.value) {
            return;
        }

        if (token.value === null) {
            bootstrapped.value = true;

            return;
        }

        try {
            const id = user.value?.id ?? (await authApi.fetchCurrentUserId());

            setUser(await usersApi.show(id));
        } catch (error) {
            const apiError = error as ApiError;

            if (apiError.isUnauthenticated || apiError.isAccountDisabled) {
                clear(apiError.message);
            }
            // Любая другая ошибка (офлайн, 500) оставляет закэшированную сессию,
            // чтобы приложением можно было пользоваться, а следующий запрос повторить.
        } finally {
            bootstrapped.value = true;
        }
    }

    setSessionEndedHandler((error) => {
        if (token.value !== null) {
            clear(error.message);
        }
    });

    return {
        token,
        user,
        bootstrapped,
        sessionEndedMessage,
        isAuthenticated,
        role,
        isAdmin,
        isManager,
        can,
        setUser,
        login,
        register,
        logout,
        bootstrap,
        clear,
    };
});
