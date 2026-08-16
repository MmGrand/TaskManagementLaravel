<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import type { SelectOption } from '@/components/ui/AppSelect.vue';
import { maxLength } from '@/utils/validation';

const props = defineProps<{
    pending: boolean;
    projectId: string;
    projectOptions: SelectOption[];
}>();

const emit = defineEmits<{ submit: [{ title: string; projectId: string }] }>();

const { t } = useI18n();

const open = ref(false);
const title = ref('');
const project = ref(props.projectId);
const input = ref<InstanceType<typeof AppInput> | null>(null);

const needsProject = computed(() => props.projectId === '');
const titleError = computed(() => maxLength(255)(title.value));
const canSubmit = computed(
    () => title.value.trim() !== '' && project.value !== '' && titleError.value === null && !props.pending,
);

async function start(): Promise<void> {
    open.value = true;
    project.value = props.projectId;
    await nextTick();
    input.value?.$el?.focus();
}

function cancel(): void {
    open.value = false;
    title.value = '';
}

function submit(): void {
    if (!canSubmit.value) {
        return;
    }

    emit('submit', { title: title.value.trim(), projectId: project.value });
    title.value = '';
}
</script>

<template>
    <div class="mt-2">
        <AppButton v-if="!open" variant="ghost" class="w-full justify-start" @click="start">
            {{ t('tasks.board.quickAdd') }}
        </AppButton>

        <form v-else class="flex flex-col gap-2" @submit.prevent="submit">
            <AppInput
                ref="input"
                v-model="title"
                :invalid="titleError !== null"
                :placeholder="t('tasks.board.quickAddPlaceholder')"
                :aria-label="t('tasks.board.quickAdd')"
                @keydown.esc="cancel"
            />
            <p v-if="titleError" class="text-xs text-danger-fg">{{ titleError }}</p>

            <AppSelect
                v-if="needsProject"
                v-model="project"
                :options="projectOptions"
                :placeholder="t('tasks.projectPlaceholder')"
                :aria-label="t('tasks.project')"
            />

            <div class="flex gap-2">
                <AppButton type="submit" :disabled="!canSubmit">{{ t('common.save') }}</AppButton>
                <AppButton type="button" variant="secondary" @click="cancel">{{ t('common.cancel') }}</AppButton>
            </div>
        </form>
    </div>
</template>
