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
    <div class="rounded-lg bg-white p-4 ring-1 ring-gray-200">
        <h2 class="text-sm font-semibold text-gray-900">{{ t('statistics.byStatus') }}</h2>

        <ul class="mt-3 flex flex-col gap-3">
            <li v-for="row in rows" :key="row.status" class="flex flex-col gap-1">
                <div class="flex items-center justify-between gap-2">
                    <TaskStatusBadge :status="row.status" />
                    <span class="text-sm text-gray-900">{{ row.count }}</span>
                </div>
                <div class="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div class="h-full rounded-full bg-indigo-500" :style="{ width: `${share(row.count)}%` }" />
                </div>
            </li>
        </ul>
    </div>
</template>
