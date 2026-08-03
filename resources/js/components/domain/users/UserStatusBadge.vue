<script setup lang="ts">
import { computed } from 'vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import { useEnumLabel } from '@/composables/useEnumLabel';
import type { UserStatus } from '@/types/enums';

const props = defineProps<{ status: UserStatus }>();

const { enumLabel } = useEnumLabel();

const TONES: Record<UserStatus, 'green' | 'gray' | 'red'> = {
    active: 'green',
    inactive: 'gray',
    blocked: 'red',
};

const tone = computed(() => TONES[props.status] ?? 'gray');
const label = computed(() => enumLabel('userStatus', props.status));
</script>

<template>
    <AppBadge :tone="tone">{{ label }}</AppBadge>
</template>
