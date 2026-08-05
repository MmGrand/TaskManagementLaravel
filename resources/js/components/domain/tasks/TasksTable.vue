<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import TaskStatusBadge from '@/components/domain/tasks/TaskStatusBadge.vue';
import TaskPriorityBadge from '@/components/domain/tasks/TaskPriorityBadge.vue';
import { usePermissions } from '@/composables/usePermissions';
import type { Task } from '@/types/models';
import { formatDate, fullName } from '@/utils/format';
import { isTaskOverdue } from '@/utils/taskAccess';

defineProps<{ tasks: Task[] }>();
const emit = defineEmits<{ edit: [Task]; delete: [Task] }>();

const permissions = usePermissions();
const { t } = useI18n();
</script>

<template>
    <div class="relative overflow-x-auto rounded-lg ring-1 ring-border">
        <table class="min-w-full divide-y divide-border bg-surface text-sm">
            <thead class="bg-surface-muted text-left text-xs font-semibold text-fg-muted uppercase">
                <tr>
                    <th scope="col" class="px-4 py-3">{{ t('tasks.task') }}</th>
                    <th scope="col" class="px-4 py-3">{{ t('tasks.project') }}</th>
                    <th scope="col" class="px-4 py-3">{{ t('common.status') }}</th>
                    <th scope="col" class="px-4 py-3">{{ t('tasks.priority') }}</th>
                    <th scope="col" class="px-4 py-3">{{ t('tasks.assignee') }}</th>
                    <th scope="col" class="px-4 py-3">{{ t('tasks.dueDate') }}</th>
                    <th scope="col" class="px-4 py-3"><span class="sr-only">{{ t('common.actions') }}</span></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-border">
                <tr v-for="task in tasks" :key="task.id">
                    <td class="px-4 py-3">
                        <RouterLink
                            :to="{ name: 'task', params: { id: task.id } }"
                            class="font-medium text-accent-fg hover:text-accent-hover"
                        >
                            {{ task.title }}
                        </RouterLink>
                    </td>
                    <td class="px-4 py-3 text-fg-muted">{{ task.project?.name ?? '—' }}</td>
                    <td class="px-4 py-3"><TaskStatusBadge :status="task.status" /></td>
                    <td class="px-4 py-3"><TaskPriorityBadge :priority="task.priority" /></td>
                    <td class="px-4 py-3 text-fg-muted">{{ fullName(task.assigned_user) }}</td>
                    <td class="px-4 py-3">
                        <span class="text-fg-muted">{{ formatDate(task.due_date) }}</span>
                        <AppBadge v-if="isTaskOverdue(task)" tone="red" class="ml-2">
                            {{ t('tasks.overdue') }}
                        </AppBadge>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex justify-end gap-2">
                            <AppButton
                                v-if="permissions.canUpdateTask(task)"
                                variant="ghost"
                                @click="emit('edit', task)"
                            >
                                {{ t('common.edit') }}
                            </AppButton>
                            <AppButton
                                v-if="permissions.canDeleteTask(task)"
                                variant="ghost"
                                @click="emit('delete', task)"
                            >
                                {{ t('common.delete') }}
                            </AppButton>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
