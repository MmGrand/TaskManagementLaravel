<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppField from '@/components/ui/AppField.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import { useEnumLabel } from '@/composables/useEnumLabel';
import { useFormValidation } from '@/composables/useFormValidation';
import { maxLength, required } from '@/utils/validation';
import { PROJECT_STATUSES } from '@/types/enums';
import type { ProjectStatus } from '@/types/enums';
import type { ApiError } from '@/types/api';
import type { Project } from '@/types/models';
import type { ProjectPayload } from '@/api/projects';

const props = defineProps<{
    project?: Project | null;
    pending?: boolean;
    error?: ApiError | null;
}>();

const emit = defineEmits<{ submit: [payload: ProjectPayload]; cancel: [] }>();

const { t } = useI18n();
const { enumOptions } = useEnumLabel();

const statusOptions = enumOptions('projectStatus', PROJECT_STATUSES);

const form = reactive({ name: '', description: '', status: 'active' as ProjectStatus });

const validation = useFormValidation(form, { name: [required(), maxLength(255)] });

watch(
    () => props.project,
    (project) => {
        form.name = project?.name ?? '';
        form.description = project?.description ?? '';
        form.status = project?.status ?? 'active';
        validation.reset();
    },
    { immediate: true },
);

function fieldError(field: string): string | null {
    return validation.fieldError(field) ?? props.error?.errors[field]?.[0] ?? null;
}

function onSubmit(): void {
    if (!validation.validate()) {
        return;
    }

    emit('submit', {
        name: form.name.trim(),
        // Колонка nullable; пустое textarea означает "без описания".
        description: form.description.trim() === '' ? null : form.description.trim(),
        status: form.status,
    });
}
</script>

<template>
    <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
        <AppAlert v-if="error && !error.isValidation">{{ error.message }}</AppAlert>

        <AppField v-slot="field" :label="t('common.name')" :error="fieldError('name')" required>
            <AppInput v-bind="field" v-model="form.name" required @blur="validation.touch('name')" />
        </AppField>

        <AppField v-slot="field" :label="t('common.description')" :error="fieldError('description')">
            <AppTextarea v-bind="field" v-model="form.description" />
        </AppField>

        <AppField v-slot="field" :label="t('common.status')" :error="fieldError('status')">
            <AppSelect v-bind="field" v-model="form.status" :options="statusOptions" />
        </AppField>

        <div class="flex justify-end gap-2">
            <AppButton variant="secondary" :disabled="pending" @click="emit('cancel')">
                {{ t('common.cancel') }}
            </AppButton>
            <AppButton type="submit" :loading="pending">{{ t('common.save') }}</AppButton>
        </div>
    </form>
</template>
