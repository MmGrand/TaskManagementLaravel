<script setup lang="ts">
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
        class="block w-full rounded-md border-0 bg-surface px-3 py-2 text-sm text-fg shadow-sm ring-1 ring-inset placeholder:text-fg-faint focus:ring-2 focus:ring-inset"
        :class="invalid ? 'ring-danger' : 'ring-border-strong focus:ring-accent'"
    />
</template>
