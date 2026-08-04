<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
    caretAfterDigits,
    countDigits,
    dateFieldFormat,
    formatDateField,
    fromIsoDate,
    maskDateField,
    monthGrid,
    monthLabel,
    parseDateField,
    toIsoDate,
    weekdayLabels,
} from '@/utils/date';

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

const model = defineModel<string>({ required: true });

const { t } = useI18n();

const root = ref<HTMLElement | null>(null);
const field = ref<HTMLInputElement | null>(null);
const grid = ref<HTMLElement | null>(null);

const text = ref('');
const open = ref(false);
const cursor = ref(new Date());

const format = computed(dateFieldFormat);
const placeholder = computed(() =>
    format.value.parts.map((part) => t(`datePicker.${part}Mask`)).join(format.value.separator),
);
const weekdays = computed(weekdayLabels);
const days = computed(() => monthGrid(cursor.value.getFullYear(), cursor.value.getMonth()));
const today = computed(() => toIsoDate(new Date()));

watch(
    [model, format],
    ([iso]) => {
        if (document.activeElement !== field.value) {
            text.value = formatDateField(iso, format.value);
        }
    },
    { immediate: true },
);

function onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = countDigits(input.value.slice(0, caret));
    const masked = maskDateField(input.value, format.value);

    text.value = masked;
    model.value = parseDateField(masked, format.value) ?? '';

    void nextTick(() => {
        const position = caretAfterDigits(masked, digitsBeforeCaret);

        input.setSelectionRange(position, position);
    });
}

function onBlur(): void {
    text.value = formatDateField(model.value, format.value);
}

function focusDay(iso: string): void {
    void nextTick(() => {
        grid.value?.querySelector<HTMLElement>(`[data-iso="${iso}"]`)?.focus();
    });
}

function select(date: Date): void {
    model.value = toIsoDate(date);
    text.value = formatDateField(model.value, format.value);
    open.value = false;
    field.value?.focus();
}

function shiftMonth(months: number): void {
    const date = cursor.value;

    cursor.value = new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function onGridKeydown(event: KeyboardEvent): void {
    const steps: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -7,
        ArrowDown: 7,
    };
    const step = steps[event.key];

    if (step === undefined) {
        return;
    }

    event.preventDefault();

    const date = cursor.value;
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + step);

    cursor.value = next;
    focusDay(toIsoDate(next));
}

function toggle(): void {
    open.value = !open.value;
}

function onDocumentClick(event: MouseEvent): void {
    if (root.value !== null && !root.value.contains(event.target as Node)) {
        open.value = false;
    }
}

function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !open.value) {
        return;
    }

    // Иначе тот же Escape закроет и диалог, в котором стоит поле.
    event.stopPropagation();
    open.value = false;
    field.value?.focus();
}

watch(open, (isOpen) => {
    if (isOpen) {
        cursor.value = fromIsoDate(model.value) ?? new Date();
        focusDay(toIsoDate(cursor.value));
        document.addEventListener('click', onDocumentClick);
    } else {
        document.removeEventListener('click', onDocumentClick);
    }
});

onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick);
});

function dayClass(date: Date): string {
    const iso = toIsoDate(date);

    if (iso === model.value) {
        return 'bg-indigo-600 text-white';
    }

    if (date.getMonth() !== cursor.value.getMonth()) {
        return 'text-gray-400 hover:bg-gray-100';
    }

    return iso === today.value ? 'font-semibold text-indigo-600 hover:bg-gray-100' : 'text-gray-900 hover:bg-gray-100';
}
</script>

<template>
    <div ref="root" class="relative" @keydown="onKeydown">
        <div
            class="flex items-center rounded-md bg-white shadow-sm ring-1 ring-inset focus-within:ring-2"
            :class="invalid ? 'ring-red-500 focus-within:ring-red-600' : 'ring-gray-300 focus-within:ring-indigo-600'"
        >
            <input
                :id="id"
                ref="field"
                v-model="text"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                :placeholder="placeholder"
                :required="required"
                :disabled="disabled"
                :aria-invalid="invalid || undefined"
                :aria-describedby="describedBy"
                class="block w-full rounded-md border-0 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:text-gray-500"
                @input="onInput"
                @blur="onBlur"
            />

            <button
                type="button"
                :aria-label="t('datePicker.open')"
                :aria-expanded="open"
                :disabled="disabled"
                class="shrink-0 rounded-r-md px-2 py-2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                @click="toggle"
            >
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
                    <rect x="3" y="4.5" width="14" height="12" rx="2" stroke-width="1.5" />
                    <path d="M3 8.5h14M7 3v3M13 3v3" stroke-width="1.5" stroke-linecap="round" />
                </svg>
            </button>
        </div>

        <div
            v-if="open"
            class="absolute left-0 z-20 mt-1 w-72 rounded-md border border-gray-200 bg-white p-3 shadow-lg"
        >
            <div class="mb-2 flex items-center justify-between gap-2">
                <button
                    type="button"
                    :aria-label="t('datePicker.previousMonth')"
                    class="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
                    @click="shiftMonth(-1)"
                >
                    &#8249;
                </button>
                <span class="text-sm font-medium text-gray-900">{{ monthLabel(cursor) }}</span>
                <button
                    type="button"
                    :aria-label="t('datePicker.nextMonth')"
                    class="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
                    @click="shiftMonth(1)"
                >
                    &#8250;
                </button>
            </div>

            <div class="grid grid-cols-7 gap-0.5 text-center text-xs text-gray-500">
                <span v-for="weekday in weekdays" :key="weekday" class="py-1">{{ weekday }}</span>
            </div>

            <div ref="grid" class="grid grid-cols-7 gap-0.5 text-center" @keydown="onGridKeydown">
                <button
                    v-for="day in days"
                    :key="day.toISOString()"
                    type="button"
                    :data-iso="toIsoDate(day)"
                    :aria-current="toIsoDate(day) === today ? 'date' : undefined"
                    class="rounded py-1.5 text-sm"
                    :class="dayClass(day)"
                    @click="select(day)"
                >
                    {{ day.getDate() }}
                </button>
            </div>
        </div>
    </div>
</template>
