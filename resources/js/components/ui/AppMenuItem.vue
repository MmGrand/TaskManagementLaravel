<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

const props = defineProps<{ to?: RouteLocationRaw; selected?: boolean }>();

const itemClass = computed(() => [
    'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted',
    props.selected === true ? 'font-medium text-fg' : 'text-fg-muted',
]);

const role = computed(() => (props.selected === undefined ? 'menuitem' : 'menuitemradio'));
</script>

<template>
    <RouterLink v-if="to" :to="to" :role="role" :class="itemClass">
        <slot />
    </RouterLink>

    <button v-else type="button" :role="role" :aria-checked="selected" :class="itemClass">
        <slot />
        <span v-if="selected" class="text-accent-fg" aria-hidden="true">&check;</span>
    </button>
</template>
