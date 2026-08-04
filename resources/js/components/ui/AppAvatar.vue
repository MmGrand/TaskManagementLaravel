<script setup lang="ts">
import { computed } from 'vue';
import type { User } from '@/types/models';
import { fullName, initials } from '@/utils/format';

const props = withDefaults(
    defineProps<{ user?: User | null; size?: 'sm' | 'md' }>(),
    { user: null, size: 'sm' },
);

const SIZES = {
    sm: 'size-6 text-[0.625rem]',
    md: 'size-9 text-xs',
} as const;

const label = computed(() => fullName(props.user));
</script>

<template>
    <span
        class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 font-semibold text-indigo-700 ring-1 ring-indigo-200"
        :class="SIZES[size]"
        :title="label"
        :aria-label="label"
    >
        <img v-if="user?.avatar" :src="user.avatar" :alt="label" class="size-full object-cover" />
        <template v-else>{{ initials(user) }}</template>
    </span>
</template>
