<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Task } from '@/types/models';
import { formatDate, formatDateTime, fullName } from '@/utils/format';

defineProps<{ task: Task }>();

const { t } = useI18n();
</script>

<template>
    <dl class="grid gap-4 rounded-lg bg-white p-4 ring-1 ring-gray-200 sm:grid-cols-2">
        <div>
            <dt class="text-xs font-medium text-gray-500 uppercase">{{ t('tasks.project') }}</dt>
            <dd class="text-sm text-gray-900">
                <RouterLink
                    v-if="task.project"
                    :to="{ name: 'project', params: { id: task.project.id } }"
                    class="text-indigo-600 hover:text-indigo-500"
                >
                    {{ task.project.name }}
                </RouterLink>
                <span v-else>—</span>
            </dd>
        </div>
        <div>
            <dt class="text-xs font-medium text-gray-500 uppercase">{{ t('tasks.dueDate') }}</dt>
            <dd class="text-sm text-gray-900">{{ formatDate(task.due_date) }}</dd>
        </div>
        <div>
            <dt class="text-xs font-medium text-gray-500 uppercase">{{ t('tasks.assignee') }}</dt>
            <dd class="text-sm text-gray-900">{{ fullName(task.assigned_user) }}</dd>
        </div>
        <div>
            <dt class="text-xs font-medium text-gray-500 uppercase">{{ t('tasks.author') }}</dt>
            <dd class="text-sm text-gray-900">{{ fullName(task.created_by_user) }}</dd>
        </div>
        <div>
            <dt class="text-xs font-medium text-gray-500 uppercase">{{ t('tasks.createdAt') }}</dt>
            <dd class="text-sm text-gray-900">{{ formatDateTime(task.created_at) }}</dd>
        </div>
        <div class="sm:col-span-2">
            <dt class="text-xs font-medium text-gray-500 uppercase">{{ t('common.description') }}</dt>
            <dd class="text-sm whitespace-pre-line text-gray-900">
                {{ task.description || t('common.noDescription') }}
            </dd>
        </div>
    </dl>
</template>
