<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppField from '@/components/ui/AppField.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import { useEnumLabel } from '@/composables/useEnumLabel';
import { TASK_STATUSES } from '@/types/enums';
import type { TaskStatus } from '@/types/enums';
import type { ApiError } from '@/types/api';
import type { Task } from '@/types/models';
import { buildAssigneeTaskPayload, type AssigneeTaskPayload } from '@/utils/taskPayload';

/**
 * Рендерится, когда текущий пользователь НЕ проходит Task::isManageableBy. В
 * этом случае Task\UpdateRequest валидирует только `status` и отбрасывает все
 * остальные поля, поэтому полная форма молча потеряла бы правки пользователя.
 */
const props = defineProps<{ task: Task; pending?: boolean; error?: ApiError | null }>();
const emit = defineEmits<{ submit: [payload: AssigneeTaskPayload]; cancel: [] }>();

const { t } = useI18n();
const { enumOptions } = useEnumLabel();

const statusOptions = enumOptions('taskStatus', TASK_STATUSES);

const status = ref<TaskStatus>(props.task.status);

watch(
    () => props.task.status,
    (next) => {
        status.value = next;
    },
);
</script>

<template>
    <form class="flex flex-col gap-4" novalidate @submit.prevent="emit('submit', buildAssigneeTaskPayload(status))">
        <AppAlert v-if="error && !error.isValidation">{{ error.message }}</AppAlert>

        <p class="text-sm text-gray-600">{{ t('tasks.statusOnlyNotice') }}</p>

        <AppField v-slot="field" :label="t('common.status')" :error="error?.errors.status?.[0] ?? null" required>
            <AppSelect v-bind="field" v-model="status" :options="statusOptions" />
        </AppField>

        <div class="flex justify-end gap-2">
            <AppButton variant="secondary" :disabled="pending" @click="emit('cancel')">
                {{ t('common.cancel') }}
            </AppButton>
            <AppButton type="submit" :loading="pending">{{ t('common.save') }}</AppButton>
        </div>
    </form>
</template>
