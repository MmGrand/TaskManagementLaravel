<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>

<template>
    <div class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong px-4 py-12 text-center">
        <p class="text-sm font-medium text-fg">{{ title }}</p>
        <p v-if="description" class="max-w-md text-sm text-fg-subtle">{{ description }}</p>
        <div class="mt-2"><slot /></div>
    </div>
</template>
