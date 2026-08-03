<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppShell from '@/components/layout/AppShell.vue';
import LocaleSwitcher from '@/components/layout/LocaleSwitcher.vue';
import AppToastHost from '@/components/ui/AppToastHost.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

/** Экраны авторизации и страницы ошибок рендерятся без обвязки; остальное — внутри shell. */
const useShell = computed(() => route.meta.requiresAuth === true && auth.isAuthenticated);

/**
 * 401 или заблокированный аккаунт могут прийти в середине сессии — в этом случае
 * стор очищается сам, но навигации, которая запустила бы guard роутера, не происходит.
 */
watch(
    () => auth.isAuthenticated,
    (authenticated) => {
        if (!authenticated && route.meta.requiresAuth === true) {
            void router.replace({ name: 'login', query: { redirect: route.fullPath } });
        }
    },
);
</script>

<template>
    <AppShell v-if="useShell">
        <RouterView />
    </AppShell>

    <!-- Экраны вне shell (вход, регистрация, ошибки) своей шапки не имеют. -->
    <template v-else>
        <div class="absolute top-4 right-4 z-10"><LocaleSwitcher /></div>
        <RouterView />
    </template>

    <AppToastHost />
</template>
