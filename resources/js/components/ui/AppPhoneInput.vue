<script setup lang="ts">
import { nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { caretAfterDigits, countDigits } from '@/utils/caret';
import { maskPhone } from '@/utils/phone';

withDefaults(
    defineProps<{
        id?: string;
        invalid?: boolean;
        describedBy?: string;
        required?: boolean;
        disabled?: boolean;
    }>(),
    { invalid: false, required: false, disabled: false },
);

/** Хранит уже размеченный номер: отдельного «сырого» значения форме не нужно. */
const model = defineModel<string>({ required: true });

const { t } = useI18n();

watch(
    model,
    (value) => {
        const masked = maskPhone(value);

        if (masked !== value) {
            model.value = masked;
        }
    },
    { immediate: true },
);

function onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = countDigits(input.value.slice(0, caret));
    const masked = maskPhone(input.value);

    model.value = masked;
    input.value = masked;

    void nextTick(() => {
        const position = caretAfterDigits(masked, digitsBeforeCaret);

        input.setSelectionRange(position, position);
    });
}
</script>

<template>
    <input
        :id="id"
        :value="model"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        :placeholder="t('common.phonePlaceholder')"
        :required="required"
        :disabled="disabled"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedBy"
        class="block w-full rounded-md border-0 bg-surface px-3 py-2 text-sm text-fg shadow-sm ring-1 ring-inset placeholder:text-fg-faint focus:ring-2 focus:ring-inset disabled:cursor-not-allowed disabled:text-fg-subtle"
        :class="invalid ? 'ring-danger' : 'ring-border-strong focus:ring-accent'"
        @input="onInput"
    />
</template>
