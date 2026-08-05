<script setup lang="ts">
withDefaults(defineProps<{ label: string; value: number; tone?: 'default' | 'danger' }>(), {
    tone: 'default',
});
</script>

<template>
    <div class="rounded-lg bg-surface p-4 ring-1 ring-border">
        <p class="text-xs font-medium text-fg-subtle uppercase">{{ label }}</p>
        <p
            class="mt-1 text-2xl font-semibold"
            :class="tone === 'danger' && value > 0 ? 'text-danger-fg' : 'text-fg'"
        >
            {{ value }}
        </p>
    </div>
</template>
