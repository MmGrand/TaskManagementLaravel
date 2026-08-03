<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>

<template>
    <div class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-12 text-center">
        <p class="text-sm font-medium text-gray-900">{{ title }}</p>
        <p v-if="description" class="max-w-md text-sm text-gray-500">{{ description }}</p>
        <div class="mt-2"><slot /></div>
    </div>
</template>
