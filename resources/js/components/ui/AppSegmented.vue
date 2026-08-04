<script setup lang="ts">
import type { SelectOption } from '@/components/ui/AppSelect.vue';

defineProps<{ options: SelectOption[]; label: string }>();

const model = defineModel<string>({ required: true });
</script>

<template>
    <div class="flex rounded-md ring-1 ring-gray-300" role="group" :aria-label="label">
        <button
            v-for="option in options"
            :key="option.value"
            type="button"
            :aria-pressed="option.value === model"
            class="px-3 py-1.5 text-sm font-medium first:rounded-l-md last:rounded-r-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            :class="option.value === model ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'"
            @click="model = option.value"
        >
            {{ option.label }}
        </button>
    </div>
</template>
