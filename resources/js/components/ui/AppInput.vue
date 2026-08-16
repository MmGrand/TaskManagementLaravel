<script setup lang="ts">
import { FIELD_BASE_CLASS, FIELD_RING_INVALID, FIELD_RING_VALID } from '@/components/ui/fieldStyle';

withDefaults(
    defineProps<{
        id?: string;
        type?: string;
        invalid?: boolean;
        describedBy?: string;
        placeholder?: string;
        autocomplete?: string;
        required?: boolean;
    }>(),
    { type: 'text', invalid: false },
);

const model = defineModel<string>({ required: true });
</script>

<template>
    <input
        :id="id"
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedBy"
        :class="[FIELD_BASE_CLASS, invalid ? FIELD_RING_INVALID : FIELD_RING_VALID]"
    />
</template>
