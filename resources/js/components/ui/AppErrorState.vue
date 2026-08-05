<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import type { ApiError } from '@/types/api';

defineProps<{ error: ApiError }>();
const emit = defineEmits<{ retry: [] }>();

const { t } = useI18n();
</script>

<template>
    <div
        role="alert"
        class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-red-300 px-4 py-12 text-center dark:border-red-500/40"
    >
        <p class="text-sm font-medium text-red-800 dark:text-red-300">{{ error.message }}</p>
        <p v-if="error.isNetwork" class="text-sm text-fg-muted">{{ t('errors.checkConnection') }}</p>

        <AppButton v-if="!error.isForbidden" variant="secondary" class="mt-2" @click="emit('retry')">
            {{ t('common.retry') }}
        </AppButton>
    </div>
</template>
