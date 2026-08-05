<script setup lang="ts">
import { nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { VueDraggable } from 'vue-draggable-plus';
import AppButton from '@/components/ui/AppButton.vue';
import AppErrorState from '@/components/ui/AppErrorState.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import TaskCard from '@/components/domain/tasks/board/TaskCard.vue';
import TaskQuickAdd from '@/components/domain/tasks/board/TaskQuickAdd.vue';
import type { SelectOption } from '@/components/ui/AppSelect.vue';
import type { BoardColumn, MoveIntent } from '@/composables/useTaskBoard';
import { usePermissions } from '@/composables/usePermissions';
import { useAuthStore } from '@/stores/auth';
import type { Task } from '@/types/models';
import type { BoardGroupBy } from '@/utils/boardMove';
import { neighboursAt } from '@/utils/boardMove';
import { isTaskManageableBy } from '@/utils/taskAccess';

const props = defineProps<{
    column: BoardColumn;
    groupBy: BoardGroupBy;
    dragDisabled: boolean;
    canCreate: boolean;
    createPending: boolean;
    projectId: string;
    projectOptions: SelectOption[];
}>();

const emit = defineEmits<{
    'drag-start': [];
    move: [MoveIntent];
    'load-more': [string];
    open: [Task];
    'quick-add': [{ columnKey: string; title: string; projectId: string }];
}>();

const auth = useAuthStore();
const permissions = usePermissions();
const { t } = useI18n();

function canDrag(task: Task): boolean {
    return permissions.canUpdateTask(task);
}

function onMove(event: { to: HTMLElement; from: HTMLElement; dragged: HTMLElement }): boolean {
    if (event.to === event.from) {
        return true;
    }

    const id = Number(event.dragged.dataset.taskId);
    const task = props.column.tasks.find((candidate) => candidate.id === id);

    if (task === undefined) {
        return true;
    }

    return props.groupBy === 'status' ? canDrag(task) : isTaskManageableBy(task, auth.user);
}

async function onEnd(event: { newIndex?: number }): Promise<void> {
    await nextTick();

    const index = event.newIndex ?? 0;
    const task = props.column.tasks[index];

    if (task === undefined) {
        return;
    }

    emit('move', {
        task,
        columnKey: props.column.key,
        ...neighboursAt(props.column.tasks, index),
    });
}
</script>

<template>
    <section class="flex w-80 shrink-0 flex-col rounded-lg bg-surface-hover p-3">
        <header class="mb-3 flex items-center justify-between gap-2">
            <h2 class="text-sm font-semibold text-fg">{{ column.label }}</h2>
            <span class="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-fg-muted ring-1 ring-border">
                {{ column.total }}
            </span>
        </header>

        <AppErrorState v-if="column.error" :error="column.error" />

        <template v-else>
            <VueDraggable
                v-model="column.tasks"
                :group="{ name: 'tasks' }"
                :data-column-key="column.key"
                :disabled="dragDisabled"
                draggable="[data-movable='true']"
                :move="onMove"
                :animation="150"
                :delay="150"
                :delay-on-touch-only="true"
                ghost-class="opacity-40"
                class="flex min-h-24 flex-col gap-2"
                @start="emit('drag-start')"
                @end="onEnd"
            >
                <TaskCard
                    v-for="task in column.tasks"
                    :key="task.id"
                    :task="task"
                    :group-by="groupBy"
                    :movable="canDrag(task)"
                    @open="emit('open', $event)"
                />
            </VueDraggable>

            <AppSpinner v-if="column.loading" />

            <AppButton
                v-else-if="column.page < column.lastPage"
                variant="ghost"
                class="mt-2 w-full"
                @click="emit('load-more', column.key)"
            >
                {{ t('tasks.board.loadMore') }}
            </AppButton>

            <TaskQuickAdd
                v-if="canCreate"
                :pending="createPending"
                :project-id="projectId"
                :project-options="projectOptions"
                @submit="emit('quick-add', { columnKey: column.key, ...$event })"
            />
        </template>
    </section>
</template>
