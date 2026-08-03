<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';

/**
 * У `confirmLabel` нет значения по умолчанию: withDefaults принимает только
 * статические выражения, а перевод нужно считать после инициализации i18n.
 */
const props = withDefaults(
    defineProps<{
        open: boolean;
        title: string;
        message: string;
        confirmLabel?: string;
        pending?: boolean;
    }>(),
    { confirmLabel: undefined, pending: false },
);

const emit = defineEmits<{ confirm: []; cancel: [] }>();

const { t } = useI18n();

const confirmText = computed(() => props.confirmLabel ?? t('common.delete'));
</script>

<template>
    <AppModal :open="open" :title="title" @close="emit('cancel')">
        <p class="text-sm text-gray-600">{{ message }}</p>

        <template #footer>
            <AppButton variant="secondary" :disabled="pending" @click="emit('cancel')">
                {{ t('common.cancel') }}
            </AppButton>
            <AppButton variant="danger" :loading="pending" @click="emit('confirm')">{{ confirmText }}</AppButton>
        </template>
    </AppModal>
</template>
