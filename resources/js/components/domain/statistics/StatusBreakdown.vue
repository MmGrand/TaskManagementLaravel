<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import TaskStatusBadge from '@/components/domain/tasks/TaskStatusBadge.vue';
import { TASK_STATUSES } from '@/types/enums';
import type { TaskStatus } from '@/types/enums';

const props = defineProps<{ counts: Record<TaskStatus, number> }>();

const { t } = useI18n();

/** API заполняет нулями все статусы, но при отсутствующем ключе не должно рендериться пусто. */
const rows = computed(() =>
    TASK_STATUSES.map((status) => ({ status, count: props.counts[status] ?? 0 })),
);

const total = computed(() => rows.value.reduce((sum, row) => sum + row.count, 0));

function share(count: number): number {
    return total.value === 0 ? 0 : Math.round((count / total.value) * 100);
}
</script>

<template>
    <div class="rounded-lg bg-surface p-4 ring-1 ring-border">
        <h2 class="text-sm font-semibold text-fg">{{ t('statistics.byStatus') }}</h2>

        <ul class="mt-3 flex flex-col gap-3">
            <li v-for="row in rows" :key="row.status" class="flex flex-col gap-1">
                <div class="flex items-center justify-between gap-2">
                    <TaskStatusBadge :status="row.status" />
                    <span class="text-sm text-fg">{{ row.count }}</span>
                </div>
                <div class="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                    <div class="h-full rounded-full bg-accent" :style="{ width: `${share(row.count)}%` }" />
                </div>
            </li>
        </ul>
    </div>
</template>
