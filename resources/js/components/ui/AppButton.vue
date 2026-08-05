<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
        type?: 'button' | 'submit';
        loading?: boolean;
        disabled?: boolean;
        block?: boolean;
    }>(),
    {
        variant: 'primary',
        type: 'button',
        loading: false,
        disabled: false,
        block: false,
    },
);

const VARIANTS: Record<NonNullable<typeof props.variant>, string> = {
    primary: 'bg-accent text-white hover:bg-accent-hover focus-visible:outline-accent',
    secondary:
        'bg-surface text-fg ring-1 ring-inset ring-border-strong hover:bg-surface-muted focus-visible:outline-fg-muted',
    danger: 'bg-danger text-white hover:bg-danger-hover focus-visible:outline-danger',
    ghost: 'text-fg-muted hover:bg-surface-hover focus-visible:outline-fg-muted',
};

const isDisabled = computed(() => props.disabled || props.loading);
</script>

<template>
    <button
        :type="type"
        :disabled="isDisabled"
        :aria-busy="loading"
        class="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        :class="[VARIANTS[variant], block ? 'w-full' : '']"
    >
        <span
            v-if="loading"
            class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
        />
        <slot />
    </button>
</template>
