<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Task } from '@/types/models';
import { formatDate, formatDateTime, fullName } from '@/utils/format';

defineProps<{ task: Task }>();

const { t } = useI18n();
</script>

<template>
    <dl class="grid gap-4 rounded-lg bg-surface p-4 ring-1 ring-border sm:grid-cols-2">
        <div>
            <dt class="text-xs font-medium text-fg-subtle uppercase">{{ t('tasks.project') }}</dt>
            <dd class="text-sm text-fg">
                <RouterLink
                    v-if="task.project"
                    :to="{ name: 'project', params: { id: task.project.id } }"
                    class="text-accent-fg hover:text-accent-hover"
                >
                    {{ task.project.name }}
                </RouterLink>
                <span v-else>—</span>
            </dd>
        </div>
        <div>
            <dt class="text-xs font-medium text-fg-subtle uppercase">{{ t('tasks.dueDate') }}</dt>
            <dd class="text-sm text-fg">{{ formatDate(task.due_date) }}</dd>
        </div>
        <div>
            <dt class="text-xs font-medium text-fg-subtle uppercase">{{ t('tasks.assignee') }}</dt>
            <dd class="text-sm text-fg">{{ fullName(task.assigned_user) }}</dd>
        </div>
        <div>
            <dt class="text-xs font-medium text-fg-subtle uppercase">{{ t('tasks.author') }}</dt>
            <dd class="text-sm text-fg">{{ fullName(task.created_by_user) }}</dd>
        </div>
        <div>
            <dt class="text-xs font-medium text-fg-subtle uppercase">{{ t('tasks.createdAt') }}</dt>
            <dd class="text-sm text-fg">{{ formatDateTime(task.created_at) }}</dd>
        </div>
        <div class="sm:col-span-2">
            <dt class="text-xs font-medium text-fg-subtle uppercase">{{ t('common.description') }}</dt>
            <dd class="text-sm whitespace-pre-line text-fg">
                {{ task.description || t('common.noDescription') }}
            </dd>
        </div>
    </dl>
</template>
