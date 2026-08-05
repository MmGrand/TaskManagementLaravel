<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppFileInput from '@/components/ui/AppFileInput.vue';
import { initials } from '@/utils/format';
import { validateAvatar } from '@/utils/userPayload';
import type { User } from '@/types/models';

const props = defineProps<{ user: User }>();
const emit = defineEmits<{ change: [file: File | null] }>();

const { t } = useI18n();

const picker = ref<InstanceType<typeof AppFileInput> | null>(null);
const localError = ref<string | null>(null);
const previewUrl = ref<string | null>(null);
const fileName = ref<string | null>(null);

function revokePreview(): void {
    if (previewUrl.value !== null) {
        URL.revokeObjectURL(previewUrl.value);
        previewUrl.value = null;
    }
}

function onFileSelected(file: File | null): void {
    revokePreview();
    localError.value = null;
    fileName.value = null;

    if (file === null) {
        emit('change', null);

        return;
    }

    // Проверяем здесь, чтобы узнать о превышении лимита в 2 МБ не через запрос к серверу.
    const problem = validateAvatar(file);

    if (problem !== null) {
        localError.value = problem;
        picker.value?.clear();
        emit('change', null);

        return;
    }

    previewUrl.value = URL.createObjectURL(file);
    fileName.value = file.name;
    emit('change', file);
}

onBeforeUnmount(revokePreview);
</script>

<template>
    <div class="flex items-center gap-4">
        <img
            v-if="previewUrl"
            :src="previewUrl"
            :alt="t('users.avatarPreview')"
            class="size-16 rounded-full object-cover"
        />
        <img v-else-if="props.user.avatar" :src="props.user.avatar" alt="" class="size-16 rounded-full object-cover" />
        <span
            v-else
            class="flex size-16 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
            aria-hidden="true"
        >
            {{ initials(props.user) }}
        </span>

        <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-fg">{{ t('users.avatar') }}</span>

            <AppFileInput
                ref="picker"
                accept="image/*"
                :button-label="t('users.avatarChoose')"
                :empty-label="t('users.avatarNoFile')"
                :file-name="fileName"
                @select="onFileSelected"
            />

            <p class="text-xs text-fg-subtle">{{ t('users.avatarHint') }}</p>
        </div>
    </div>

    <AppAlert v-if="localError">{{ localError }}</AppAlert>
</template>
