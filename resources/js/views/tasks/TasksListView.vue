<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import * as projectsApi from '@/api/projects';
import * as tasksApi from '@/api/tasks';
import * as usersApi from '@/api/users';
import AppButton from '@/components/ui/AppButton.vue';
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue';
import AppDateInput from '@/components/ui/AppDateInput.vue';
import AppErrorState from '@/components/ui/AppErrorState.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import TaskBoard from '@/components/domain/tasks/board/TaskBoard.vue';
import TaskDetailsDrawer from '@/components/domain/tasks/TaskDetailsDrawer.vue';
import TaskForm from '@/components/domain/tasks/TaskForm.vue';
import TaskStatusOnlyForm from '@/components/domain/tasks/TaskStatusOnlyForm.vue';
import TasksTable from '@/components/domain/tasks/TasksTable.vue';
import { useApiForm } from '@/composables/useApiForm';
import { useEnumLabel } from '@/composables/useEnumLabel';
import { useListQuery } from '@/composables/useListQuery';
import { useOptionsList } from '@/composables/useOptionsList';
import { usePermissions } from '@/composables/usePermissions';
import { useTaskBoard } from '@/composables/useTaskBoard';
import type { BoardColumnSpec, MoveIntent } from '@/composables/useTaskBoard';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/types/enums';
import type { TaskPriority, TaskStatus } from '@/types/enums';
import type { ApiError, PageMeta } from '@/types/api';
import type { Task } from '@/types/models';
import { fullName } from '@/utils/format';
import type { BoardGroupBy } from '@/utils/boardMove';
import { isTaskManageableBy } from '@/utils/taskAccess';
import type { AssigneeTaskPayload, ManageableTaskPayload } from '@/utils/taskPayload';

const MAX_ASSIGNEE_COLUMNS = 12;

const auth = useAuthStore();
const ui = useUiStore();
const permissions = usePermissions();
const form = useApiForm();
const { t } = useI18n();
const { enumLabel, enumOptions } = useEnumLabel();

const tasks = ref<Task[]>([]);
const meta = ref<PageMeta | null>(null);
const loading = ref(false);
const loadError = ref<ApiError | null>(null);

const editing = ref<Task | null>(null);
const formOpen = ref(false);
const deleting = ref<Task | null>(null);
const deletePending = ref(false);
const viewing = ref<Task | null>(null);
const quickAddPending = ref(false);

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

const canGroupByAssignee = computed(() => permissions.can('users.viewAny'));

const groupByOptions = computed(() => [
    { value: 'status', label: t('tasks.board.groupByStatus') },
    { value: 'priority', label: t('tasks.board.groupByPriority') },
    ...(canGroupByAssignee.value
        ? [{ value: 'assigned_to', label: t('tasks.board.groupByAssignee') }]
        : []),
]);

const projectOptions = useOptionsList(
    (page) => projectsApi.list({ page }),
    (project) => ({ value: String(project.id), label: project.name }),
);

const assigneeOptions = useOptionsList(
    (page) => usersApi.list(page),
    (user) => ({ value: String(user.id), label: fullName(user) }),
);

const isBoard = computed(() => query.filters.view === 'board');

const groupBy = computed<BoardGroupBy>(() => {
    const value = query.filters.group_by;

    if (value === 'priority') {
        return 'priority';
    }

    return value === 'assigned_to' && canGroupByAssignee.value ? 'assigned_to' : 'status';
});

const assigneeColumnsTruncated = computed(
    () => groupBy.value === 'assigned_to' && assigneeOptions.options.value.length > MAX_ASSIGNEE_COLUMNS,
);

const apiFilters = computed(() => ({
    status: query.filters.status,
    priority: query.filters.priority,
    project_id: query.filters.project_id,
    assigned_to: query.filters.assigned_to,
    due_date_from: query.filters.due_date_from,
    due_date_to: query.filters.due_date_to,
    sort_by: query.filters.sort_by,
    sort_direction: query.filters.sort_direction,
}));

function boardFilters(): tasksApi.TaskFilters {
    const { [groupBy.value]: _grouped, ...rest } = apiFilters.value;

    return rest;
}

function columnSpecs(): BoardColumnSpec[] {
    if (groupBy.value === 'priority') {
        return TASK_PRIORITIES.map((value) => ({ value, label: enumLabel('taskPriority', value) })).map(
            ({ value, label }) => ({ key: value, label }),
        );
    }

    if (groupBy.value === 'assigned_to') {
        return assigneeOptions.options.value
            .slice(0, MAX_ASSIGNEE_COLUMNS)
            .map((option) => ({ key: option.value, label: option.label }));
    }

    return TASK_STATUSES.map((value) => ({ key: value, label: enumLabel('taskStatus', value) }));
}

const board = useTaskBoard({ groupBy, columnSpecs, filters: boardFilters });

async function loadTable(): Promise<void> {
    loading.value = true;
    loadError.value = null;

    try {
        const page = await tasksApi.list({ ...apiFilters.value, page: query.page.value });

        tasks.value = page.items;
        meta.value = page.meta;
    } catch (error) {
        loadError.value = error as ApiError;
    } finally {
        loading.value = false;
    }
}

async function load(): Promise<void> {
    if (!isBoard.value) {
        return loadTable();
    }

    if (groupBy.value === 'assigned_to' && assigneeOptions.options.value.length === 0) {
        await assigneeOptions.load();
    }

    await board.load();
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
    view: string;
    group_by: string;
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
        view: 'table',
        group_by: 'status',
    },
    load,
);

watch(isBoard, (board) => {
    ui.wideContent = board;
}, { immediate: true });

onUnmounted(() => {
    ui.wideContent = false;
});

watch(
    [isBoard, () => permissions.can('tasks.create')],
    ([boardOn, canCreate]) => {
        if (boardOn && canCreate && projectOptions.options.value.length === 0) {
            void projectOptions.load();
        }
    },
    { immediate: true },
);

function setView(next: string): void {
    query.filters.view = next;
    query.applyFilters();
}

function setGroupBy(next: string): void {
    query.filters.group_by = next;
    query.applyFilters();
}

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

    if (result === undefined) {
        return;
    }

    ui.success(current ? t('tasks.updated') : t('tasks.created'));
    formOpen.value = false;
    viewing.value = null;

    if (!isBoard.value) {
        await load();

        return;
    }

    if (current) {
        board.applyTask(result);
    } else {
        board.addTask(result);
    }
}

async function onQuickAdd(intent: { columnKey: string; title: string; projectId: string }): Promise<void> {
    const user = auth.user;

    if (user === null) {
        return;
    }

    quickAddPending.value = true;

    try {
        const created = await tasksApi.create({
            title: intent.title,
            description: null,
            status: groupBy.value === 'status' ? (intent.columnKey as TaskStatus) : 'pending',
            priority: groupBy.value === 'priority' ? (intent.columnKey as TaskPriority) : 'medium',
            project_id: Number(intent.projectId),
            assigned_to: groupBy.value === 'assigned_to' ? Number(intent.columnKey) : user.id,
            due_date: null,
        });

        ui.success(t('tasks.created'));
        board.addTask(created);
    } catch (error) {
        ui.error((error as ApiError).message);
    } finally {
        quickAddPending.value = false;
    }
}

async function onMove(intent: MoveIntent): Promise<void> {
    await board.move(intent);
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
        viewing.value = null;

        if (isBoard.value) {
            board.removeTask(task.id);
        } else if (tasks.value.length === 1 && query.page.value > 1) {
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

            <div class="flex items-center gap-2">
                <div class="flex rounded-md ring-1 ring-gray-300" role="group">
                    <button
                        type="button"
                        class="rounded-l-md px-3 py-1.5 text-sm font-medium"
                        :class="isBoard ? 'text-gray-600 hover:bg-gray-50' : 'bg-gray-100 text-gray-900'"
                        :aria-pressed="!isBoard"
                        @click="setView('table')"
                    >
                        {{ t('tasks.board.viewTable') }}
                    </button>
                    <button
                        type="button"
                        class="rounded-r-md px-3 py-1.5 text-sm font-medium"
                        :class="isBoard ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'"
                        :aria-pressed="isBoard"
                        @click="setView('board')"
                    >
                        {{ t('tasks.board.viewBoard') }}
                    </button>
                </div>

                <AppButton v-if="permissions.can('tasks.create')" @click="openCreate">
                    {{ t('tasks.create') }}
                </AppButton>
            </div>
        </header>

        <div class="grid gap-3 rounded-lg bg-white p-4 ring-1 ring-gray-200 sm:grid-cols-2 lg:grid-cols-4">
            <label v-show="!isBoard || groupBy !== 'status'" class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('common.status') }}</span>
                <AppSelect v-model="query.filters.status" :options="statusOptions" :placeholder="t('common.all')" />
            </label>

            <label v-show="!isBoard || groupBy !== 'priority'" class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('tasks.priority') }}</span>
                <AppSelect v-model="query.filters.priority" :options="priorityOptions" :placeholder="t('common.all')" />
            </label>

            <label class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('tasks.dueFrom') }}</span>
                <AppDateInput v-model="query.filters.due_date_from" />
            </label>

            <label class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('tasks.dueTo') }}</span>
                <AppDateInput v-model="query.filters.due_date_to" />
            </label>

            <label v-show="!isBoard" class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('tasks.sort') }}</span>
                <AppSelect v-model="query.filters.sort_by" :options="sortOptions" />
            </label>

            <label v-show="!isBoard" class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('tasks.direction') }}</span>
                <AppSelect v-model="query.filters.sort_direction" :options="directionOptions" />
            </label>

            <label v-if="isBoard" class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('tasks.board.groupBy') }}</span>
                <AppSelect
                    :model-value="groupBy"
                    :options="groupByOptions"
                    @update:model-value="setGroupBy"
                />
            </label>

            <div class="flex items-end gap-2">
                <AppButton @click="query.applyFilters">{{ t('common.apply') }}</AppButton>
                <AppButton variant="secondary" @click="query.resetFilters">{{ t('common.reset') }}</AppButton>
            </div>
        </div>

        <TaskBoard
            v-if="isBoard"
            :columns="board.columns.value"
            :group-by="groupBy"
            :drag-disabled="board.dragging.value"
            :can-create="permissions.can('tasks.create')"
            :create-pending="quickAddPending"
            :project-id="query.filters.project_id"
            :project-options="projectOptions.options.value"
            :truncated="assigneeColumnsTruncated"
            @drag-start="board.beginDrag"
            @move="onMove"
            @load-more="board.loadMore"
            @open="viewing = $event"
            @quick-add="onQuickAdd"
        />

        <template v-else>
            <AppErrorState v-if="loadError" :error="loadError" @retry="load" />
            <AppSpinner v-else-if="loading" />
            <AppEmptyState
                v-else-if="tasks.length === 0"
                :title="t('tasks.emptyTitle')"
                :description="t('tasks.emptyDescription')"
            />

            <TasksTable v-else :tasks="tasks" @edit="openEdit" @delete="deleting = $event" />

            <AppPagination v-if="meta" :meta="meta" @update:page="query.goToPage" />
        </template>

        <TaskDetailsDrawer
            :open="viewing !== null"
            :task="viewing"
            @close="viewing = null"
            @edit="openEdit"
            @delete="deleting = $event"
        />

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
