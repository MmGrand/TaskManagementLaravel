<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import AppDropdown from '@/components/ui/AppDropdown.vue';
import { useEnumLabel } from '@/composables/useEnumLabel';
import { fullName, initials } from '@/utils/format';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const { t } = useI18n();
const { enumLabel } = useEnumLabel();

const name = computed(() => fullName(auth.user));
const roleName = computed(() => (auth.role ? enumLabel('role', auth.role.slug) : t('auth.noRole')));

async function onLogout(): Promise<void> {
    await auth.logout();
    await router.replace({ name: 'login' });
}
</script>

<template>
    <!-- Имя, роль и выход живут в меню: в строке шапки они занимали слишком много места. -->
    <AppDropdown :label="name">
        <template #trigger>
            <img
                v-if="auth.user?.avatar"
                :src="auth.user.avatar"
                alt=""
                class="size-8 rounded-full object-cover"
            />
            <span
                v-else
                class="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700"
                aria-hidden="true"
            >
                {{ initials(auth.user) }}
            </span>
            <span class="hidden max-w-32 truncate text-sm font-medium text-gray-900 sm:block">{{ name }}</span>
        </template>

        <template #default="{ close }">
            <div class="border-b border-gray-100 px-3 pt-1 pb-2">
                <p class="truncate text-sm font-medium text-gray-900">{{ name }}</p>
                <p class="truncate text-xs text-gray-500">{{ roleName }}</p>
            </div>

            <RouterLink
                :to="{ name: 'profile' }"
                role="menuitem"
                class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                @click="close"
            >
                {{ t('routes.profile') }}
            </RouterLink>

            <button
                type="button"
                role="menuitem"
                class="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                @click="onLogout"
            >
                {{ t('auth.logout') }}
            </button>
        </template>
    </AppDropdown>
</template>
