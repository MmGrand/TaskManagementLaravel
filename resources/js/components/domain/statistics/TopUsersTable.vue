<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import type { TopActiveUser } from '@/types/models';
import { fullName } from '@/utils/format';

defineProps<{ users: TopActiveUser[] }>();

const { t } = useI18n();
</script>

<template>
    <div class="rounded-lg bg-surface p-4 ring-1 ring-border">
        <h2 class="text-sm font-semibold text-fg">{{ t('statistics.topUsers') }}</h2>

        <AppEmptyState v-if="users.length === 0" :title="t('statistics.noData')" class="mt-3" />

        <table v-else class="mt-3 min-w-full text-sm">
            <thead class="text-left text-xs font-semibold text-fg-muted uppercase">
                <tr>
                    <th scope="col" class="py-2">{{ t('users.user') }}</th>
                    <th scope="col" class="py-2 text-right">{{ t('statistics.tasksCreated') }}</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-border">
                <tr v-for="user in users" :key="user.id">
                    <td class="py-2">
                        <span class="text-fg">{{ fullName(user) }}</span>
                        <span class="ml-2 text-xs text-fg-subtle">{{ user.email }}</span>
                    </td>
                    <td class="py-2 text-right font-medium text-fg">{{ user.tasks_created_count }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
