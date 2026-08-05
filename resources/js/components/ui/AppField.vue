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
        <label :for="controlId" class="text-sm font-medium text-fg">
            {{ label }}
            <span v-if="required" class="text-danger-fg" aria-hidden="true">*</span>
        </label>

        <slot :id="controlId" :invalid="Boolean(error)" :described-by="error ? errorId : undefined" />

        <p v-if="hint && !error" class="text-xs text-fg-subtle">{{ hint }}</p>
        <p v-if="error" :id="errorId" class="text-xs text-danger-fg">{{ error }}</p>
    </div>
</template>
