<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppAlert from '@/components/ui/AppAlert.vue';
import TaskBoardColumn from '@/components/domain/tasks/board/TaskBoardColumn.vue';
import type { SelectOption } from '@/components/ui/AppSelect.vue';
import type { BoardColumn, MoveIntent } from '@/composables/useTaskBoard';
import type { Task } from '@/types/models';
import type { BoardGroupBy } from '@/utils/boardMove';

defineProps<{
    columns: BoardColumn[];
    groupBy: BoardGroupBy;
    dragDisabled: boolean;
    canCreate: boolean;
    createPending: boolean;
    projectId: string;
    projectOptions: SelectOption[];
    truncated: boolean;
}>();

const emit = defineEmits<{
    'drag-start': [];
    move: [MoveIntent];
    'load-more': [string];
    open: [Task];
    'quick-add': [{ columnKey: string; title: string; projectId: string }];
}>();

const { t } = useI18n();
</script>

<template>
    <div class="flex flex-col gap-3">
        <AppAlert v-if="truncated" variant="info">{{ t('tasks.board.columnsTruncated') }}</AppAlert>

        <div class="flex items-start gap-4 overflow-x-auto pb-2">
            <TaskBoardColumn
                v-for="column in columns"
                :key="column.key"
                :column="column"
                :group-by="groupBy"
                :drag-disabled="dragDisabled"
                :can-create="canCreate"
                :create-pending="createPending"
                :project-id="projectId"
                :project-options="projectOptions"
                @drag-start="emit('drag-start')"
                @move="emit('move', $event)"
                @load-more="emit('load-more', $event)"
                @open="emit('open', $event)"
                @quick-add="emit('quick-add', $event)"
            />
        </div>
    </div>
</template>
