<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import * as tasksApi from '@/api/tasks';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import TaskForm from '@/components/domain/tasks/TaskForm.vue';
import TaskStatusOnlyForm from '@/components/domain/tasks/TaskStatusOnlyForm.vue';
import TaskStatusBadge from '@/components/domain/tasks/TaskStatusBadge.vue';
import TaskPriorityBadge from '@/components/domain/tasks/TaskPriorityBadge.vue';
import { useApiForm } from '@/composables/useApiForm';
import { usePermissions } from '@/composables/usePermissions';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import type { ApiError } from '@/types/api';
import type { Task } from '@/types/models';
import { formatDate, formatDateTime, fullName } from '@/utils/format';
import { isTaskManageableBy, isTaskOverdue } from '@/utils/taskAccess';
import type { AssigneeTaskPayload, ManageableTaskPayload } from '@/utils/taskPayload';

const route = useRoute();
const auth = useAuthStore();
const ui = useUiStore();
const permissions = usePermissions();
const form = useApiForm();
const { t } = useI18n();

const task = ref<Task | null>(null);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
const formOpen = ref(false);

const isManageable = computed(() => (task.value === null ? false : isTaskManageableBy(task.value, auth.user)));

onMounted(async () => {
    try {
        task.value = await tasksApi.show(Number(route.params.id));
    } catch (caught) {
        loadError.value = caught as ApiError;
    } finally {
        loading.value = false;
    }
});

async function onSubmit(payload: ManageableTaskPayload | AssigneeTaskPayload): Promise<void> {
    const current = task.value;

    if (current === null) {
        return;
    }

    const result = await form.submit(() => tasksApi.update(current.id, payload));

    if (result !== undefined) {
        task.value = result;
        ui.success(t('tasks.updated'));
        formOpen.value = false;
    }
}
</script>

<template>
    <section class="flex flex-col gap-4">
        <AppSpinner v-if="loading" />
        <AppAlert v-else-if="loadError">{{ loadError.message }}</AppAlert>

        <template v-else-if="task">
            <header class="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 class="text-xl font-semibold text-gray-900">{{ task.title }}</h1>
                    <div class="mt-2 flex flex-wrap items-center gap-2">
                        <TaskStatusBadge :status="task.status" />
                        <TaskPriorityBadge :priority="task.priority" />
                        <AppBadge v-if="isTaskOverdue(task)" tone="red">{{ t('tasks.overdue') }}</AppBadge>
                    </div>
                </div>

                <AppButton v-if="permissions.canUpdateTask(task)" @click="form.reset(); formOpen = true">
                    {{ t('common.edit') }}
                </AppButton>
            </header>

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

            <AppModal :open="formOpen" :title="t('tasks.editTitle')" @close="formOpen = false">
                <TaskStatusOnlyForm
                    v-if="!isManageable"
                    :task="task"
                    :pending="form.pending.value"
                    :error="form.error.value"
                    @submit="onSubmit"
                    @cancel="formOpen = false"
                />
                <TaskForm
                    v-else
                    :task="task"
                    :pending="form.pending.value"
                    :error="form.error.value"
                    @submit="onSubmit"
                    @cancel="formOpen = false"
                />
            </AppModal>
        </template>
    </section>
</template>
