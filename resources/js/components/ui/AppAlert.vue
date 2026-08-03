<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'error' | 'warning' | 'info' | 'success' }>(), { variant: 'error' });

const VARIANTS = {
    error: 'bg-red-50 text-red-800 ring-red-200',
    warning: 'bg-amber-50 text-amber-900 ring-amber-200',
    info: 'bg-blue-50 text-blue-800 ring-blue-200',
    success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
} as const;
</script>

<template>
    <div role="alert" class="rounded-md px-3 py-2 text-sm ring-1 ring-inset" :class="VARIANTS[variant]">
        <slot />
    </div>
</template>
