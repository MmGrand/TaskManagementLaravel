<script setup lang="ts">
import { FIELD_BASE_CLASS, FIELD_RING_INVALID, FIELD_RING_VALID } from '@/components/ui/fieldStyle';

withDefaults(
    defineProps<{ id?: string; invalid?: boolean; describedBy?: string; rows?: number; placeholder?: string }>(),
    { invalid: false, rows: 4 },
);

const model = defineModel<string>({ required: true });
</script>

<template>
    <textarea
        :id="id"
        v-model="model"
        :rows="rows"
        :placeholder="placeholder"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedBy"
        :class="[FIELD_BASE_CLASS, invalid ? FIELD_RING_INVALID : FIELD_RING_VALID]"
    />
</template>
