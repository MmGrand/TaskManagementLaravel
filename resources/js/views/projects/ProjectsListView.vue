<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import * as projectsApi from '@/api/projects';
import AppButton from '@/components/ui/AppButton.vue';
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue';
import AppErrorState from '@/components/ui/AppErrorState.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import ProjectForm from '@/components/domain/projects/ProjectForm.vue';
import ProjectStatusBadge from '@/components/domain/projects/ProjectStatusBadge.vue';
import { useApiForm } from '@/composables/useApiForm';
import { useEnumLabel } from '@/composables/useEnumLabel';
import { useListQuery } from '@/composables/useListQuery';
import { usePermissions } from '@/composables/usePermissions';
import { useUiStore } from '@/stores/ui';
import { PROJECT_STATUSES } from '@/types/enums';
import type { ProjectStatus } from '@/types/enums';
import type { ApiError, PageMeta } from '@/types/api';
import type { Project } from '@/types/models';
import { formatDate, fullName } from '@/utils/format';

const ui = useUiStore();
const permissions = usePermissions();
const form = useApiForm();
const { t } = useI18n();
const { enumOptions } = useEnumLabel();

const projects = ref<Project[]>([]);
const meta = ref<PageMeta | null>(null);
const loading = ref(false);
const loadError = ref<ApiError | null>(null);

const editing = ref<Project | null>(null);
const formOpen = ref(false);
const deleting = ref<Project | null>(null);
const deletePending = ref(false);

const statusOptions = enumOptions('projectStatus', PROJECT_STATUSES);

async function load(): Promise<void> {
    loading.value = true;
    loadError.value = null;

    try {
        const page = await projectsApi.list({ status: query.filters.status, page: query.page.value });

        projects.value = page.items;
        meta.value = page.meta;
    } catch (error) {
        loadError.value = error as ApiError;
    } finally {
        loading.value = false;
    }
}

/** Явный дженерик: нетипизированное значение `''` по умолчанию расширило бы тип фильтра до `string`. */
const query = useListQuery<{ status: ProjectStatus | '' }>({ status: '' }, load);

function openCreate(): void {
    editing.value = null;
    form.reset();
    formOpen.value = true;
}

function openEdit(project: Project): void {
    editing.value = project;
    form.reset();
    formOpen.value = true;
}

async function onSubmit(payload: projectsApi.ProjectPayload): Promise<void> {
    const current = editing.value;
    const result = await form.submit(() =>
        current ? projectsApi.update(current.id, payload) : projectsApi.create(payload),
    );

    if (result !== undefined) {
        ui.success(current ? t('projects.updated') : t('projects.created'));
        formOpen.value = false;
        await load();
    }
}

async function onDelete(): Promise<void> {
    const project = deleting.value;

    if (project === null) {
        return;
    }

    deletePending.value = true;

    try {
        await projectsApi.remove(project.id);
        ui.success(t('projects.deleted'));
        deleting.value = null;

        // Переход на предыдущую страницу — чтобы пользователь не остался на несуществующей.
        if (projects.value.length === 1 && query.page.value > 1) {
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
            <h1 class="text-xl font-semibold text-gray-900">{{ t('projects.title') }}</h1>
            <AppButton v-if="permissions.can('projects.create')" @click="openCreate">
                {{ t('projects.create') }}
            </AppButton>
        </header>

        <div class="flex flex-wrap items-end gap-3">
            <label class="flex flex-col gap-1">
                <span class="text-sm font-medium text-gray-900">{{ t('common.status') }}</span>
                <AppSelect
                    v-model="query.filters.status"
                    :options="statusOptions"
                    :placeholder="t('common.all')"
                    @update:model-value="query.applyFilters"
                />
            </label>
        </div>

        <AppErrorState v-if="loadError" :error="loadError" @retry="load" />
        <AppSpinner v-else-if="loading" />
        <AppEmptyState
            v-else-if="projects.length === 0"
            :title="t('projects.emptyTitle')"
            :description="t('projects.emptyDescription')"
        />

        <div v-else class="overflow-x-auto rounded-lg ring-1 ring-gray-200">
            <table class="min-w-full divide-y divide-gray-200 bg-white text-sm">
                <thead class="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase">
                    <tr>
                        <th scope="col" class="px-4 py-3">{{ t('common.name') }}</th>
                        <th scope="col" class="px-4 py-3">{{ t('common.status') }}</th>
                        <th scope="col" class="px-4 py-3">{{ t('common.creator') }}</th>
                        <th scope="col" class="px-4 py-3">{{ t('common.createdAt') }}</th>
                        <th scope="col" class="px-4 py-3"><span class="sr-only">{{ t('common.actions') }}</span></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <tr v-for="project in projects" :key="project.id">
                        <td class="px-4 py-3">
                            <RouterLink
                                :to="{ name: 'project', params: { id: project.id } }"
                                class="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                {{ project.name }}
                            </RouterLink>
                        </td>
                        <td class="px-4 py-3"><ProjectStatusBadge :status="project.status" /></td>
                        <td class="px-4 py-3 text-gray-600">{{ fullName(project.creator) }}</td>
                        <td class="px-4 py-3 text-gray-600">{{ formatDate(project.created_at) }}</td>
                        <td class="px-4 py-3">
                            <div class="flex justify-end gap-2">
                                <AppButton
                                    v-if="permissions.canUpdateProject(project)"
                                    variant="ghost"
                                    @click="openEdit(project)"
                                >
                                    {{ t('common.edit') }}
                                </AppButton>
                                <AppButton
                                    v-if="permissions.canDeleteProject(project)"
                                    variant="ghost"
                                    @click="deleting = project"
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
            :title="editing ? t('projects.editTitle') : t('projects.newTitle')"
            @close="formOpen = false"
        >
            <ProjectForm
                :project="editing"
                :pending="form.pending.value"
                :error="form.error.value"
                @submit="onSubmit"
                @cancel="formOpen = false"
            />
        </AppModal>

        <AppConfirmDialog
            :open="deleting !== null"
            :title="t('projects.deleteTitle')"
            :message="t('projects.deleteMessage', { name: deleting?.name })"
            :pending="deletePending"
            @confirm="onDelete"
            @cancel="deleting = null"
        />
    </section>
</template>
