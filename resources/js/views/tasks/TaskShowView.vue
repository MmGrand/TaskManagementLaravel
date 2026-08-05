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
import TaskSummary from '@/components/domain/tasks/TaskSummary.vue';
import { useApiForm } from '@/composables/useApiForm';
import { usePermissions } from '@/composables/usePermissions';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import type { ApiError } from '@/types/api';
import type { Task } from '@/types/models';
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
                    <h1 class="text-xl font-semibold text-fg">{{ task.title }}</h1>
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

            <TaskSummary :task="task" />

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
