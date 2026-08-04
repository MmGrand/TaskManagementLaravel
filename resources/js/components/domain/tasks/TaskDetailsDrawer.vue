<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppDrawer from '@/components/ui/AppDrawer.vue';
import TaskPriorityBadge from '@/components/domain/tasks/TaskPriorityBadge.vue';
import TaskStatusBadge from '@/components/domain/tasks/TaskStatusBadge.vue';
import TaskSummary from '@/components/domain/tasks/TaskSummary.vue';
import { usePermissions } from '@/composables/usePermissions';
import type { Task } from '@/types/models';
import { isTaskOverdue } from '@/utils/taskAccess';

defineProps<{ open: boolean; task: Task | null }>();
const emit = defineEmits<{ close: []; edit: [Task]; delete: [Task] }>();

const permissions = usePermissions();
const { t } = useI18n();
</script>

<template>
    <AppDrawer :open="open" :title="t('tasks.board.detailsTitle')" @close="emit('close')">
        <div v-if="task" class="flex flex-col gap-4">
            <div>
                <h3 class="text-base font-semibold text-gray-900">{{ task.title }}</h3>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                    <TaskStatusBadge :status="task.status" />
                    <TaskPriorityBadge :priority="task.priority" />
                    <AppBadge v-if="isTaskOverdue(task)" tone="red">{{ t('tasks.overdue') }}</AppBadge>
                </div>
            </div>

            <TaskSummary :task="task" />

            <RouterLink
                :to="{ name: 'task', params: { id: task.id } }"
                class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
                {{ t('tasks.task') }}
            </RouterLink>
        </div>

        <template v-if="task" #footer>
            <div class="flex justify-end gap-2">
                <AppButton
                    v-if="permissions.canDeleteTask(task)"
                    variant="secondary"
                    @click="emit('delete', task)"
                >
                    {{ t('common.delete') }}
                </AppButton>
                <AppButton v-if="permissions.canUpdateTask(task)" @click="emit('edit', task)">
                    {{ t('common.edit') }}
                </AppButton>
            </div>
        </template>
    </AppDrawer>
</template>
