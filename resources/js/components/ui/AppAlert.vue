<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'error' | 'warning' | 'info' | 'success' }>(), { variant: 'error' });

/** Цветным тонам токенов нет: светлая заливка в тёмной теме заменяется прозрачной. */
const VARIANTS = {
    error: 'bg-red-50 text-red-800 ring-red-200 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/30',
    warning: 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30',
    info: 'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/30',
    success: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30',
} as const;
</script>

<template>
    <div role="alert" class="rounded-md px-3 py-2 text-sm ring-1 ring-inset" :class="VARIANTS[variant]">
        <slot />
    </div>
</template>
