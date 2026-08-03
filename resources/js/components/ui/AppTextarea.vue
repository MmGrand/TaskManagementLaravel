<script setup lang="ts">
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
        class="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset"
        :class="invalid ? 'ring-red-500 focus:ring-red-600' : 'ring-gray-300 focus:ring-indigo-600'"
    />
</template>
