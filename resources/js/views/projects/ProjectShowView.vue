<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import * as projectsApi from '@/api/projects';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import ProjectStatusBadge from '@/components/domain/projects/ProjectStatusBadge.vue';
import type { ApiError } from '@/types/api';
import type { Project } from '@/types/models';
import { formatDateTime, fullName } from '@/utils/format';

const route = useRoute();
const { t } = useI18n();

const project = ref<Project | null>(null);
const loading = ref(true);
const error = ref<ApiError | null>(null);

const projectId = computed(() => Number(route.params.id));

onMounted(async () => {
    try {
        project.value = await projectsApi.show(projectId.value);
    } catch (caught) {
        error.value = caught as ApiError;
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <section class="flex flex-col gap-4">
        <AppSpinner v-if="loading" />
        <AppAlert v-else-if="error">{{ error.message }}</AppAlert>

        <template v-else-if="project">
            <header class="flex flex-wrap items-center justify-between gap-3">
                <h1 class="text-xl font-semibold text-gray-900">{{ project.name }}</h1>
                <ProjectStatusBadge :status="project.status" />
            </header>

            <dl class="grid gap-4 rounded-lg bg-white p-4 ring-1 ring-gray-200 sm:grid-cols-2">
                <div>
                    <dt class="text-xs font-medium text-gray-500 uppercase">{{ t('common.creator') }}</dt>
                    <dd class="text-sm text-gray-900">{{ fullName(project.creator) }}</dd>
                </div>
                <div>
                    <dt class="text-xs font-medium text-gray-500 uppercase">{{ t('common.createdAt') }}</dt>
                    <dd class="text-sm text-gray-900">{{ formatDateTime(project.created_at) }}</dd>
                </div>
                <div class="sm:col-span-2">
                    <dt class="text-xs font-medium text-gray-500 uppercase">{{ t('common.description') }}</dt>
                    <dd class="text-sm whitespace-pre-line text-gray-900">
                        {{ project.description || t('common.noDescription') }}
                    </dd>
                </div>
            </dl>

            <RouterLink
                :to="{ name: 'tasks', query: { project_id: String(project.id) } }"
                class="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
                {{ t('projects.tasksLink') }}
            </RouterLink>
        </template>
    </section>
</template>
