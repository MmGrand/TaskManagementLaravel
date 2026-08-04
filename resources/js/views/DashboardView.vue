<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import * as statisticsApi from '@/api/statistics';
import * as tasksApi from '@/api/tasks';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppErrorState from '@/components/ui/AppErrorState.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import StatCard from '@/components/domain/statistics/StatCard.vue';
import StatusBreakdown from '@/components/domain/statistics/StatusBreakdown.vue';
import TaskPriorityBadge from '@/components/domain/tasks/TaskPriorityBadge.vue';
import TaskStatusBadge from '@/components/domain/tasks/TaskStatusBadge.vue';
import TopUsersTable from '@/components/domain/statistics/TopUsersTable.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useAuthStore } from '@/stores/auth';
import type { ApiError } from '@/types/api';
import type { Statistics, Task } from '@/types/models';
import { isTaskOverdue } from '@/utils/taskAccess';
import { formatDate, fullName } from '@/utils/format';

const auth = useAuthStore();
const { can } = usePermissions();
const { t } = useI18n();

const statistics = ref<Statistics | null>(null);
const loading = ref(false);
const loadError = ref<ApiError | null>(null);

const myTasks = ref<Task[]>([]);
const myTasksTotal = ref(0);
const myTasksLoading = ref(false);
const myTasksError = ref<ApiError | null>(null);

async function load(): Promise<void> {
    loading.value = true;
    loadError.value = null;

    try {
        statistics.value = await statisticsApi.summary();
    } catch (error) {
        loadError.value = error as ApiError;
    } finally {
        loading.value = false;
    }
}

async function loadMyTasks(): Promise<void> {
    if (auth.user === null) {
        return;
    }

    myTasksLoading.value = true;
    myTasksError.value = null;

    try {
        const page = await tasksApi.list({
            assigned_to: String(auth.user.id),
            sort_by: 'due_date',
            sort_direction: 'asc',
        });

        myTasks.value = page.items;
        myTasksTotal.value = page.meta.total;
    } catch (error) {
        myTasksError.value = error as ApiError;
    } finally {
        myTasksLoading.value = false;
    }
}

onMounted(() => {
    if (can('statistics.view')) {
        void load();
    } else {
        void loadMyTasks();
    }
});
</script>

<template>
    <section class="flex flex-col gap-4">
        <header class="flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-xl font-semibold text-gray-900">
                {{ t('dashboard.greeting', { name: fullName(auth.user) }) }}
            </h1>
        </header>

        <template v-if="can('statistics.view')">
            <AppErrorState v-if="loadError" :error="loadError" @retry="load" />
            <AppSpinner v-else-if="loading && statistics === null" />

            <template v-else-if="statistics">
                <div class="grid gap-4 sm:grid-cols-3">
                    <StatCard :label="t('dashboard.projectsCount')" :value="statistics.projects_count" />
                    <StatCard :label="t('dashboard.tasksCount')" :value="statistics.tasks_count" />
                    <StatCard
                        :label="t('dashboard.overdueCount')"
                        :value="statistics.overdue_tasks_count"
                        tone="danger"
                    />
                </div>

                <div class="grid gap-4 lg:grid-cols-2">
                    <StatusBreakdown :counts="statistics.tasks_by_status" />
                    <TopUsersTable :users="statistics.top_active_users" />
                </div>
            </template>
        </template>

        <template v-else>
            <AppErrorState v-if="myTasksError" :error="myTasksError" @retry="loadMyTasks" />
            <AppSpinner v-else-if="myTasksLoading && myTasks.length === 0" />

            <template v-else>
                <div class="grid gap-4 sm:grid-cols-2">
                    <StatCard :label="t('dashboard.myTasksCount')" :value="myTasksTotal" />
                    <StatCard
                        :label="t('dashboard.overdueCount')"
                        :value="myTasks.filter((task) => isTaskOverdue(task)).length"
                        tone="danger"
                    />
                </div>

                <div class="rounded-lg bg-white p-4 ring-1 ring-gray-200">
                    <div class="flex items-center justify-between gap-3">
                        <h2 class="text-sm font-semibold text-gray-900">{{ t('dashboard.myTasks') }}</h2>
                        <RouterLink
                            :to="{ name: 'tasks', query: { assigned_to: String(auth.user?.id ?? '') } }"
                            class="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                        >
                            {{ t('dashboard.allMyTasks') }}
                        </RouterLink>
                    </div>

                    <AppEmptyState
                        v-if="myTasks.length === 0"
                        class="mt-3"
                        :title="t('dashboard.noTasksAssigned')"
                    />

                    <div v-else class="mt-3 overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 text-sm">
                            <thead class="text-left text-xs font-semibold text-gray-600 uppercase">
                                <tr>
                                    <th scope="col" class="py-2 pr-4">{{ t('tasks.task') }}</th>
                                    <th scope="col" class="py-2 pr-4">{{ t('tasks.project') }}</th>
                                    <th scope="col" class="py-2 pr-4">{{ t('common.status') }}</th>
                                    <th scope="col" class="py-2 pr-4">{{ t('tasks.priority') }}</th>
                                    <th scope="col" class="py-2 pr-4">{{ t('tasks.dueDate') }}</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                <tr v-for="task in myTasks" :key="task.id">
                                    <td class="py-2 pr-4">
                                        <RouterLink
                                            :to="{ name: 'task', params: { id: task.id } }"
                                            class="font-medium text-indigo-600 hover:text-indigo-500"
                                        >
                                            {{ task.title }}
                                        </RouterLink>
                                    </td>
                                    <td class="py-2 pr-4 text-gray-600">{{ task.project?.name ?? '—' }}</td>
                                    <td class="py-2 pr-4"><TaskStatusBadge :status="task.status" /></td>
                                    <td class="py-2 pr-4"><TaskPriorityBadge :priority="task.priority" /></td>
                                    <td class="py-2 pr-4">
                                        <span class="text-gray-600">{{ formatDate(task.due_date) }}</span>
                                        <AppBadge v-if="isTaskOverdue(task)" tone="red" class="ml-2">
                                            {{ t('tasks.overdue') }}
                                        </AppBadge>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </template>
        </template>
    </section>
</template>
