<script setup lang="ts">
withDefaults(defineProps<{ label: string; value: number; tone?: 'default' | 'danger' }>(), {
    tone: 'default',
});
</script>

<template>
    <div class="rounded-lg bg-white p-4 ring-1 ring-gray-200">
        <p class="text-xs font-medium text-gray-500 uppercase">{{ label }}</p>
        <p
            class="mt-1 text-2xl font-semibold"
            :class="tone === 'danger' && value > 0 ? 'text-red-600' : 'text-gray-900'"
        >
            {{ value }}
        </p>
    </div>
</template>
