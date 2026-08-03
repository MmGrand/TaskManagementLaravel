<script setup lang="ts">
import { computed } from 'vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import { useEnumLabel } from '@/composables/useEnumLabel';
import type { TaskStatus } from '@/types/enums';

const props = defineProps<{ status: TaskStatus }>();

const { enumLabel } = useEnumLabel();

const TONES: Record<TaskStatus, 'gray' | 'blue' | 'green'> = {
    pending: 'gray',
    in_progress: 'blue',
    completed: 'green',
};

const tone = computed(() => TONES[props.status] ?? 'gray');
const label = computed(() => enumLabel('taskStatus', props.status));
</script>

<template>
    <AppBadge :tone="tone">{{ label }}</AppBadge>
</template>
