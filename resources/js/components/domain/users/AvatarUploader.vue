<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppAlert from '@/components/ui/AppAlert.vue';
import { initials } from '@/utils/format';
import { validateAvatar } from '@/utils/userPayload';
import type { User } from '@/types/models';

const props = defineProps<{ user: User }>();
const emit = defineEmits<{ change: [file: File | null] }>();

const { t } = useI18n();

const localError = ref<string | null>(null);
const previewUrl = ref<string | null>(null);
const fileName = ref<string | null>(null);

function revokePreview(): void {
    if (previewUrl.value !== null) {
        URL.revokeObjectURL(previewUrl.value);
        previewUrl.value = null;
    }
}

function onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

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
        input.value = '';
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
            class="flex size-16 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700"
            aria-hidden="true"
        >
            {{ initials(props.user) }}
        </span>

        <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-900">{{ t('users.avatar') }}</span>

            <!--
                Нативный <input type="file"> сам рисует надпись на кнопке и текст
                «файл не выбран» по локали браузера — ни CSS, ни JS их не меняют.
                Поэтому инпут визуально скрыт (но остаётся в потоке фокуса, так что
                Tab + Enter по-прежнему открывают диалог), а роль кнопки играет
                связанный с ним <label>.
            -->
            <div class="flex items-center gap-3">
                <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    class="peer sr-only"
                    @change="onFileSelected"
                />
                <label
                    for="avatar-input"
                    class="cursor-pointer rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-600"
                >
                    {{ t('users.avatarChoose') }}
                </label>
                <span class="max-w-48 truncate text-sm text-gray-600">
                    {{ fileName ?? t('users.avatarNoFile') }}
                </span>
            </div>

            <p class="text-xs text-gray-500">{{ t('users.avatarHint') }}</p>
        </div>
    </div>

    <AppAlert v-if="localError">{{ localError }}</AppAlert>
</template>
