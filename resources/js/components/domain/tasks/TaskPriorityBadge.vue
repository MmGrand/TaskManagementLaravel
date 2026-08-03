<script setup lang="ts">
import { computed } from 'vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import { useEnumLabel } from '@/composables/useEnumLabel';
import type { TaskPriority } from '@/types/enums';

const props = defineProps<{ priority: TaskPriority }>();

const { enumLabel } = useEnumLabel();

const TONES: Record<TaskPriority, 'gray' | 'amber' | 'red'> = {
    low: 'gray',
    medium: 'amber',
    high: 'red',
};

const tone = computed(() => TONES[props.priority] ?? 'gray');
const label = computed(() => enumLabel('taskPriority', props.priority));
</script>

<template>
    <AppBadge :tone="tone">{{ label }}</AppBadge>
</template>
