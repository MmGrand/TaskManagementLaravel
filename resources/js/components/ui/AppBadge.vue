<script setup lang="ts">
withDefaults(
    defineProps<{ tone?: 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'indigo' }>(),
    { tone: 'gray' },
);

/** Цветным тонам токенов нет: светлая заливка в тёмной теме заменяется прозрачной. */
const TONES = {
    gray: 'bg-surface-hover text-fg-muted ring-border',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/25',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25',
    red: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/25',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/25',
} as const;
</script>

<template>
    <span
        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset"
        :class="TONES[tone]"
    >
        <slot />
    </span>
</template>
