<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import * as projectsApi from '@/api/projects';
import * as usersApi from '@/api/users';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppField from '@/components/ui/AppField.vue';
import AppDateInput from '@/components/ui/AppDateInput.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import { useEnumLabel } from '@/composables/useEnumLabel';
import { useOptionsList } from '@/composables/useOptionsList';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/types/enums';
import type { ApiError } from '@/types/api';
import type { Task } from '@/types/models';
import { fullName } from '@/utils/format';
import { buildManageableTaskPayload, type ManageableTaskPayload, type TaskFormValues } from '@/utils/taskPayload';

const props = defineProps<{ task?: Task | null; pending?: boolean; error?: ApiError | null }>();
const emit = defineEmits<{ submit: [payload: ManageableTaskPayload]; cancel: [] }>();

const { t } = useI18n();
const { enumOptions } = useEnumLabel();

const statusOptions = enumOptions('taskStatus', TASK_STATUSES);
const priorityOptions = enumOptions('taskPriority', TASK_PRIORITIES);

const projects = useOptionsList(
    (page) => projectsApi.list({ page }),
    (project) => ({ value: String(project.id), label: project.name }),
);

const assignees = useOptionsList(
    (page) => usersApi.list(page),
    (user) => ({ value: String(user.id), label: `${fullName(user)} (${user.email})` }),
);

const form = reactive<TaskFormValues>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    project_id: '',
    assigned_to: '',
    due_date: '',
});

watch(
    () => props.task,
    (task) => {
        form.title = task?.title ?? '';
        form.description = task?.description ?? '';
        form.status = task?.status ?? 'pending';
        form.priority = task?.priority ?? 'medium';
        form.project_id = task ? String(task.project_id) : '';
        form.assigned_to = task ? String(task.assigned_to) : '';
        form.due_date = task?.due_date ?? '';
    },
    { immediate: true },
);

onMounted(() => {
    void projects.load();
    void assignees.load();
});

function fieldError(field: string): string | null {
    return props.error?.errors[field]?.[0] ?? null;
}

/**
 * Всегда передаёт все поля. PUT — это полная замена, и каждое поле здесь
 * `required`, поэтому отправка только изменённого будет отклонена.
 */
function onSubmit(): void {
    emit('submit', buildManageableTaskPayload(form));
}
</script>

<template>
    <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
        <AppAlert v-if="error && !error.isValidation">{{ error.message }}</AppAlert>

        <AppField v-slot="field" :label="t('common.name')" :error="fieldError('title')" required>
            <AppInput v-bind="field" v-model="form.title" required />
        </AppField>

        <AppField v-slot="field" :label="t('common.description')" :error="fieldError('description')">
            <AppTextarea v-bind="field" v-model="form.description" :rows="3" />
        </AppField>

        <div class="grid gap-4 sm:grid-cols-2">
            <AppField v-slot="field" :label="t('common.status')" :error="fieldError('status')" required>
                <AppSelect v-bind="field" v-model="form.status" :options="statusOptions" />
            </AppField>

            <AppField v-slot="field" :label="t('tasks.priority')" :error="fieldError('priority')" required>
                <AppSelect v-bind="field" v-model="form.priority" :options="priorityOptions" />
            </AppField>

            <AppField
                v-slot="field"
                :label="t('tasks.project')"
                :error="fieldError('project_id')"
                :hint="projects.truncated.value ? t('tasks.projectsTruncated') : undefined"
                required
            >
                <AppSelect
                    v-bind="field"
                    v-model="form.project_id"
                    :options="projects.options.value"
                    :disabled="projects.loading.value"
                    :placeholder="t('tasks.projectPlaceholder')"
                />
            </AppField>

            <AppField
                v-slot="field"
                :label="t('tasks.assignee')"
                :error="fieldError('assigned_to')"
                :hint="assignees.truncated.value ? t('tasks.assigneesTruncated') : undefined"
                required
            >
                <AppSelect
                    v-bind="field"
                    v-model="form.assigned_to"
                    :options="assignees.options.value"
                    :disabled="assignees.loading.value"
                    :placeholder="t('tasks.assigneePlaceholder')"
                />
            </AppField>
        </div>

        <AppField v-slot="field" :label="t('tasks.dueDate')" :error="fieldError('due_date')">
            <AppDateInput v-bind="field" v-model="form.due_date" />
        </AppField>

        <div class="flex justify-end gap-2">
            <AppButton variant="secondary" :disabled="pending" @click="emit('cancel')">
                {{ t('common.cancel') }}
            </AppButton>
            <AppButton type="submit" :loading="pending">{{ t('common.save') }}</AppButton>
        </div>
    </form>
</template>
