<script setup lang="ts">
withDefaults(
    defineProps<{ tone?: 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'indigo' }>(),
    { tone: 'gray' },
);

const TONES = {
    gray: 'bg-gray-100 text-gray-700 ring-gray-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
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
