<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import * as usersApi from '@/api/users';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppErrorState from '@/components/ui/AppErrorState.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import UserStatusBadge from '@/components/domain/users/UserStatusBadge.vue';
import { useEnumLabel } from '@/composables/useEnumLabel';
import { useListQuery } from '@/composables/useListQuery';
import { usePermissions } from '@/composables/usePermissions';
import type { ApiError, PageMeta } from '@/types/api';
import type { User } from '@/types/models';
import { formatPhone, fullName, initials } from '@/utils/format';

const permissions = usePermissions();
const { t } = useI18n();
const { enumLabel } = useEnumLabel();

const users = ref<User[]>([]);
const meta = ref<PageMeta | null>(null);
const loading = ref(false);
const loadError = ref<ApiError | null>(null);

let loadToken = 0;

async function load(): Promise<void> {
    const token = ++loadToken;

    loading.value = true;
    loadError.value = null;

    try {
        const page = await usersApi.list(query.page.value);

        if (token !== loadToken) {
            return;
        }

        users.value = page.items;
        meta.value = page.meta;
    } catch (error) {
        if (token === loadToken) {
            loadError.value = error as ApiError;
        }
    } finally {
        if (token === loadToken) {
            loading.value = false;
        }
    }
}

/** У этого эндпоинта нет фильтров — в URL живёт только номер страницы. */
const query = useListQuery<Record<string, string>>({}, load);
</script>

<template>
    <section class="flex flex-col gap-4">
        <h1 class="text-xl font-semibold text-fg">{{ t('users.title') }}</h1>

        <AppErrorState v-if="loadError" :error="loadError" @retry="load" />
        <AppSpinner v-else-if="loading" />
        <AppEmptyState v-else-if="users.length === 0" :title="t('users.emptyTitle')" />

        <div v-else class="relative overflow-x-auto rounded-lg ring-1 ring-border">
            <table class="min-w-full divide-y divide-border bg-surface text-sm">
                <thead class="bg-surface-muted text-left text-xs font-semibold text-fg-muted uppercase">
                    <tr>
                        <th scope="col" class="px-4 py-3">{{ t('users.user') }}</th>
                        <th scope="col" class="px-4 py-3">{{ t('common.email') }}</th>
                        <th scope="col" class="px-4 py-3">{{ t('common.phone') }}</th>
                        <th scope="col" class="px-4 py-3">{{ t('users.role') }}</th>
                        <th scope="col" class="px-4 py-3">{{ t('common.status') }}</th>
                        <th scope="col" class="px-4 py-3"><span class="sr-only">{{ t('common.actions') }}</span></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border">
                    <tr v-for="user in users" :key="user.id">
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <img
                                    v-if="user.avatar"
                                    :src="user.avatar"
                                    alt=""
                                    class="size-8 rounded-full object-cover"
                                />
                                <span
                                    v-else
                                    class="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                                    aria-hidden="true"
                                >
                                    {{ initials(user) }}
                                </span>
                                <span class="font-medium text-fg">{{ fullName(user) }}</span>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-fg-muted">{{ user.email }}</td>
                        <td class="px-4 py-3 text-fg-muted">{{ formatPhone(user.phone) }}</td>
                        <td class="px-4 py-3">
                            <AppBadge v-if="user.role" tone="indigo">
                                {{ enumLabel('role', user.role.slug) }}
                            </AppBadge>
                            <span v-else class="text-fg-faint">—</span>
                        </td>
                        <td class="px-4 py-3"><UserStatusBadge :status="user.status" /></td>
                        <td class="px-4 py-3 text-right">
                            <RouterLink
                                v-if="permissions.canUpdateUser(user)"
                                :to="{ name: 'profile', query: { id: String(user.id) } }"
                                class="text-sm font-semibold text-accent-fg hover:text-accent-hover"
                            >
                                {{ t('common.edit') }}
                            </RouterLink>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <AppPagination v-if="meta" :meta="meta" @update:page="query.goToPage" />
    </section>
</template>
