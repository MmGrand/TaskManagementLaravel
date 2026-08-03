<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import * as tasksApi from '@/api/tasks';
import AppButton from '@/components/ui/AppButton.vue';
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue';
import AppErrorState from '@/components/ui/AppErrorState.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import TaskForm from '@/components/domain/tasks/TaskForm.vue';
import TaskStatusOnlyForm from '@/components/domain/tasks/TaskStatusOnlyForm.vue';
import TaskStatusBadge from '@/components/domain/tasks/TaskStatusBadge.vue';
import TaskPriorityBadge from '@/components/domain/tasks/TaskPriorityBadge.vue';
import { useApiForm } from '@/composables/useApiForm';
import { useEnumLabel } from '@/composables/useEnumLabel';
import { useListQuery } from '@/composables/useListQuery';
import { usePermissions } from '@/composables/usePermissions';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/types/enums';
import type { TaskPriority, TaskStatus } from '@/types/enums';
import type { ApiError, PageMeta } from '@/types/api';
import type { Task } from '@/types/models';
import { formatDate, fullName } from '@/utils/format';
import { isTaskManageableBy, isTaskOverdue } from '@/utils/taskAccess';
import type { AssigneeTaskPayload, ManageableTaskPayload } from '@/utils/taskPayload';

const auth = useAuthStore();
const ui = useUiStore();
const permissions = usePermissions();
const form = useApiForm();
const { t } = useI18n();
const { enumOptions } = useEnumLabel();

const tasks = ref<Task[]>([]);
const meta = ref<PageMeta | null>(null);
const loading = ref(false);
const loadError = ref<ApiError | null>(null);

const editing = ref<Task | null>(null);
const formOpen = ref(false);
const deleting = ref<Task | null>(null);
const deletePending = ref(false);

const statusOptions = enumOptions('taskStatus', TASK_STATUSES);
const priorityOptions = enumOptions('taskPriority', TASK_PRIORITIES);

// computed, а не const: иначе подписи замёрзнут на языке, активном при setup().
const sortOptions = computed(() => [
    { value: 'created_at', label: t('tasks.sortByCreatedAt') },
    { value: 'due_date', label: t('tasks.sortByDueDate') },
]);
const directionOptions = computed(() => [
    { value: 'desc', label: t('tasks.directionDesc') },
    { value: 'asc', label: t('tasks.directionAsc') },
]);

async function load(): Promise<void> {
    loading.value = true;
    loadError.value = null;

    try {
        const page = await tasksApi.list({ ...query.filters, page: query.page.value });

        tasks.value = page.items;
        meta.value = page.meta;
    } catch (error) {
        loadError.value = error as ApiError;
    } finally {
        loading.value = false;
    }
}

const query = useListQuery<{
    status: TaskStatus | '';
    priority: TaskPriority | '';
    project_id: string;
    assigned_to: string;
    due_date_from: string;
    due_date_to: string;
    sort_by: tasksApi.TaskSortField;
    sort_direction: tasksApi.SortDirection;
}>(
    {
        status: '',
        priority: '',
        project_id: '',
        assigned_to: '',
        due_date_from: '',
        due_date_to: '',
        sort_by: 'created_at',
        sort_direction: 'desc',
    },
    load,
);

/** Меняется только набор редактируемых полей — см. Task::isManageableBy. */
const editingIsManageable = computed(() =>
    editing.value === null ? false : isTaskManageableBy(editing.value, auth.user),
);

function openCreate(): void {
    editing.value = null;
    form.reset();
    formOpen.value = true;
}

function openEdit(task: Task): void {
    editing.value = task;
    form.reset();
    formOpen.value = true;
}

async function onSubmit(payload: ManageableTaskPayload | AssigneeTaskPayload): Promise<void> {
    const current = editing.value;
    const result = await form.submit(() =>
        current ? tasksApi.update(current.id, payload) : tasksApi.create(payload as ManageableTaskPayload),
    );

    if (result !== undefined) {
        ui.success(current ? t('tasks.updated') : t('tasks.created'));
        formOpen.value = false;
        await load();
    }
}

async function onDelete(): Promise<void> {
    const task = deleting.value;

    if (task === null) {
        return;
    }

    deletePending.value = true;

    try {
        await tasksApi.remove(task.id);
        ui.success(t('tasks.deleted'));
        deleting.value = null;

        if (tasks.value.length === 1 && query.page.value > 1) {
            query.goToPage(query.page.value - 1);
        } else {
            await load();
        }
    } catch (error) {
        ui.error((error as ApiError).message);
    } finally {
        deletePending.value = false;
    }
}
</script>

<template>
    <section class="flex flex-col gap-4">
        <header class="flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-xl font-semibold text-gray-900">{{ t('tasks.title') }}</h1>
            <AppButton v-if="permissions.can('tasks.create')" @click="openCreate">{{ t('tasks.create') }}</AppButton>
        </header>

        <div class="grid gap-3 rounded-lg bg-white p-4 ring-1 ring-gray-200 sm:grid-cols-2 lg:grid-cols-4">
            <label class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('common.status') }}</span>
                <AppSelect v-model="query.filters.status" :options="statusOptions" :placeholder="t('common.all')" />
            </label>

            <label class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('tasks.priority') }}</span>
                <AppSelect v-model="query.filters.priority" :options="priorityOptions" :placeholder="t('common.all')" />
            </label>

            <label class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('tasks.dueFrom') }}</span>
                <AppInput v-model="query.filters.due_date_from" type="date" />
            </label>

            <label class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('tasks.dueTo') }}</span>
                <AppInput v-model="query.filters.due_date_to" type="date" />
            </label>

            <label class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('tasks.sort') }}</span>
                <AppSelect v-model="query.filters.sort_by" :options="sortOptions" />
            </label>

            <label class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('tasks.direction') }}</span>
                <AppSelect v-model="query.filters.sort_direction" :options="directionOptions" />
            </label>

            <div class="flex items-end gap-2">
                <AppButton @click="query.applyFilters">{{ t('common.apply') }}</AppButton>
                <AppButton variant="secondary" @click="query.resetFilters">{{ t('common.reset') }}</AppButton>
            </div>
        </div>

        <AppErrorState v-if="loadError" :error="loadError" @retry="load" />
        <AppSpinner v-else-if="loading" />
        <AppEmptyState
            v-else-if="tasks.length === 0"
            :title="t('tasks.emptyTitle')"
            :description="t('tasks.emptyDescription')"
        />

        <div v-else class="overflow-x-auto rounded-lg ring-1 ring-gray-200">
            <table class="min-w-full divide-y divide-gray-200 bg-white text-sm">
                <thead class="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase">
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
                <tbody class="divide-y divide-gray-100">
                    <tr v-for="task in tasks" :key="task.id">
                        <td class="px-4 py-3">
                            <RouterLink
                                :to="{ name: 'task', params: { id: task.id } }"
                                class="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                {{ task.title }}
                            </RouterLink>
                        </td>
                        <td class="px-4 py-3 text-gray-600">{{ task.project?.name ?? '—' }}</td>
                        <td class="px-4 py-3"><TaskStatusBadge :status="task.status" /></td>
                        <td class="px-4 py-3"><TaskPriorityBadge :priority="task.priority" /></td>
                        <td class="px-4 py-3 text-gray-600">{{ fullName(task.assigned_user) }}</td>
                        <td class="px-4 py-3">
                            <span class="text-gray-600">{{ formatDate(task.due_date) }}</span>
                            <AppBadge v-if="isTaskOverdue(task)" tone="red" class="ml-2">
                                {{ t('tasks.overdue') }}
                            </AppBadge>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex justify-end gap-2">
                                <AppButton
                                    v-if="permissions.canUpdateTask(task)"
                                    variant="ghost"
                                    @click="openEdit(task)"
                                >
                                    {{ t('common.edit') }}
                                </AppButton>
                                <AppButton
                                    v-if="permissions.canDeleteTask(task)"
                                    variant="ghost"
                                    @click="deleting = task"
                                >
                                    {{ t('common.delete') }}
                                </AppButton>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <AppPagination v-if="meta" :meta="meta" @update:page="query.goToPage" />

        <AppModal
            :open="formOpen"
            :title="editing ? t('tasks.editTitle') : t('tasks.newTitle')"
            @close="formOpen = false"
        >
            <TaskStatusOnlyForm
                v-if="editing && !editingIsManageable"
                :task="editing"
                :pending="form.pending.value"
                :error="form.error.value"
                @submit="onSubmit"
                @cancel="formOpen = false"
            />
            <TaskForm
                v-else
                :task="editing"
                :pending="form.pending.value"
                :error="form.error.value"
                @submit="onSubmit"
                @cancel="formOpen = false"
            />
        </AppModal>

        <AppConfirmDialog
            :open="deleting !== null"
            :title="t('tasks.deleteTitle')"
            :message="t('tasks.deleteMessage', { title: deleting?.title })"
            :pending="deletePending"
            @confirm="onDelete"
            @cancel="deleting = null"
        />
    </section>
</template>
