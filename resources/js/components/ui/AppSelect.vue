<script setup lang="ts">
export interface SelectOption {
    value: string;
    label: string;
}

withDefaults(
    defineProps<{
        options: SelectOption[];
        id?: string;
        invalid?: boolean;
        describedBy?: string;
        placeholder?: string;
        disabled?: boolean;
    }>(),
    { invalid: false, disabled: false },
);

const model = defineModel<string>({ required: true });
</script>

<template>
    <select
        :id="id"
        v-model="model"
        :disabled="disabled"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedBy"
        class="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
        :class="invalid ? 'ring-red-500 focus:ring-red-600' : 'ring-gray-300 focus:ring-indigo-600'"
    >
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
        </option>
    </select>
</template>
