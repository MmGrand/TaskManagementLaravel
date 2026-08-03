<script setup lang="ts">
import { useId } from 'vue';

defineProps<{
    label: string;
    error?: string | null;
    hint?: string;
    required?: boolean;
}>();

/**
 * Владеет id, чтобы label, контрол и сообщение об ошибке оставались связаны —
 * без необходимости каждому вызывающему коду придумывать свой.
 */
const controlId = useId();
const errorId = `${controlId}-error`;
</script>

<template>
    <div class="flex flex-col gap-1">
        <label :for="controlId" class="text-sm font-medium text-gray-900">
            {{ label }}
            <span v-if="required" class="text-red-600" aria-hidden="true">*</span>
        </label>

        <slot :id="controlId" :invalid="Boolean(error)" :described-by="error ? errorId : undefined" />

        <p v-if="hint && !error" class="text-xs text-gray-500">{{ hint }}</p>
        <p v-if="error" :id="errorId" class="text-xs text-red-600">{{ error }}</p>
    </div>
</template>
