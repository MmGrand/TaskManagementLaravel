<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import TaskPriorityBadge from '@/components/domain/tasks/TaskPriorityBadge.vue';
import TaskStatusBadge from '@/components/domain/tasks/TaskStatusBadge.vue';
import type { Task } from '@/types/models';
import type { BoardGroupBy } from '@/utils/boardMove';
import { formatDate } from '@/utils/format';
import { isTaskOverdue } from '@/utils/taskAccess';

const CLICK_SLOP = 5;

const props = defineProps<{ task: Task; groupBy: BoardGroupBy; movable: boolean }>();
const emit = defineEmits<{ open: [Task] }>();

const { t } = useI18n();

const overdue = computed(() => isTaskOverdue(props.task));

let pressedAt: { x: number; y: number } | null = null;

function onPointerDown(event: PointerEvent): void {
    pressedAt = { x: event.clientX, y: event.clientY };
}

function onClick(event: MouseEvent): void {
    const origin = pressedAt;
    pressedAt = null;

    if (origin !== null && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > CLICK_SLOP) {
        return;
    }

    emit('open', props.task);
}

const showsStatus = computed(() => props.groupBy !== 'status');
const showsPriority = computed(() => props.groupBy !== 'priority');
const showsAssignee = computed(() => props.groupBy !== 'assigned_to');
</script>

<template>
    <article
        :data-task-id="task.id"
        :data-movable="movable"
        role="button"
        tabindex="0"
        class="cursor-pointer rounded-lg bg-surface p-3 text-left shadow-sm ring-1 ring-border hover:ring-border-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        :class="{ 'active:cursor-grabbing': movable }"
        @pointerdown="onPointerDown"
        @click="onClick"
        @keydown.enter.prevent="emit('open', task)"
        @keydown.space.prevent="emit('open', task)"
    >
        <h3 class="text-sm font-medium text-fg">{{ task.title }}</h3>

        <p v-if="task.project" class="mt-1 truncate text-xs text-fg-subtle">{{ task.project.name }}</p>

        <div class="mt-3 flex flex-wrap items-center gap-1.5">
            <TaskPriorityBadge v-if="showsPriority" :priority="task.priority" />
            <TaskStatusBadge v-if="showsStatus" :status="task.status" />
            <AppBadge v-if="overdue" tone="red">{{ t('tasks.overdue') }}</AppBadge>
        </div>

        <div class="mt-3 flex items-center justify-between gap-2">
            <span class="text-xs" :class="overdue ? 'font-medium text-danger-fg' : 'text-fg-subtle'">
                {{ formatDate(task.due_date) }}
            </span>
            <AppAvatar v-if="showsAssignee" :user="task.assigned_user" />
        </div>
    </article>
</template>
