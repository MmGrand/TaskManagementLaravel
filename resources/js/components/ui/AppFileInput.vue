<script setup lang="ts">
import { ref } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';

defineProps<{
    buttonLabel: string;
    emptyLabel: string;
    fileName?: string | null;
    accept?: string;
    disabled?: boolean;
}>();

const emit = defineEmits<{ select: [file: File | null] }>();

const input = ref<HTMLInputElement | null>(null);

function onChange(event: Event): void {
    emit('select', (event.target as HTMLInputElement).files?.[0] ?? null);
}

/**
 * Без сброса значения повторный выбор того же файла не поднимет change,
 * и отклонённый файл нельзя было бы выбрать снова после исправления.
 */
function clear(): void {
    if (input.value !== null) {
        input.value.value = '';
    }
}

defineExpose({ clear });
</script>

<template>
    <div class="flex items-center gap-3">
        <input
            ref="input"
            type="file"
            tabindex="-1"
            aria-hidden="true"
            class="sr-only"
            :accept="accept"
            :disabled="disabled"
            @change="onChange"
        />

        <AppButton variant="secondary" :disabled="disabled" @click="input?.click()">
            {{ buttonLabel }}
        </AppButton>

        <span class="max-w-48 truncate text-sm text-gray-600">{{ fileName ?? emptyLabel }}</span>
    </div>
</template>
