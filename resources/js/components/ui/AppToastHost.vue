<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useUiStore } from '@/stores/ui';

const ui = useUiStore();
const { t } = useI18n();

const TONES = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-gray-900 text-white',
} as const;
</script>

<template>
    <div class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4" aria-live="polite">
        <div
            v-for="toast in ui.toasts"
            :key="toast.id"
            class="pointer-events-auto flex w-full max-w-md items-start justify-between gap-3 rounded-md px-4 py-3 text-sm shadow-lg"
            :class="TONES[toast.tone]"
        >
            <span>{{ toast.message }}</span>
            <button
                type="button"
                class="shrink-0 opacity-70 hover:opacity-100"
                :aria-label="t('common.close')"
                @click="ui.dismiss(toast.id)"
            >
                &times;
            </button>
        </div>
    </div>
</template>
