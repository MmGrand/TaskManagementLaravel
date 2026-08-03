<script setup lang="ts">
import { computed } from 'vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import { useEnumLabel } from '@/composables/useEnumLabel';
import type { ProjectStatus } from '@/types/enums';

const props = defineProps<{ status: ProjectStatus }>();

const { enumLabel } = useEnumLabel();

const TONES: Record<ProjectStatus, 'green' | 'blue' | 'gray'> = {
    active: 'green',
    completed: 'blue',
    archived: 'gray',
};

const tone = computed(() => TONES[props.status] ?? 'gray');
const label = computed(() => enumLabel('projectStatus', props.status));
</script>

<template>
    <AppBadge :tone="tone">{{ label }}</AppBadge>
</template>
