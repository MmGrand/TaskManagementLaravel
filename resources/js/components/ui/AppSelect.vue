<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';

export interface SelectOption {
    value: string;
    label: string;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(
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

const TYPEAHEAD_TIMEOUT = 700;

const listId = useId();

const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const list = ref<HTMLElement | null>(null);

const open = ref(false);
const activeIndex = ref(0);

let typed = '';
let typedAt = 0;

const items = computed<SelectOption[]>(() =>
    props.placeholder === undefined
        ? props.options
        : [{ value: '', label: props.placeholder }, ...props.options],
);

const selectedIndex = computed(() => items.value.findIndex((item) => item.value === model.value));
const selectedLabel = computed(() => items.value[selectedIndex.value]?.label ?? '');

function optionId(index: number): string {
    return `${listId}-option-${index}`;
}

function close(): void {
    open.value = false;
}

function reveal(): void {
    if (props.disabled) {
        return;
    }

    activeIndex.value = selectedIndex.value === -1 ? 0 : selectedIndex.value;
    open.value = true;
}

function toggle(): void {
    if (open.value) {
        close();
    } else {
        reveal();
    }
}

function choose(index: number): void {
    const item = items.value[index];

    if (item === undefined) {
        return;
    }

    model.value = item.value;
    close();
    trigger.value?.focus();
}

function moveActive(step: number): void {
    activeIndex.value = Math.min(Math.max(activeIndex.value + step, 0), items.value.length - 1);
}

/** Набор букв выбирает вариант по первым символам подписи — как в нативном списке. */
function typeahead(event: KeyboardEvent): void {
    if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) {
        return;
    }

    const now = Date.now();

    typed = now - typedAt > TYPEAHEAD_TIMEOUT ? event.key : typed + event.key;
    typedAt = now;

    const query = typed.toLowerCase();
    const index = items.value.findIndex((item) => item.label.toLowerCase().startsWith(query));

    if (index === -1) {
        return;
    }

    event.preventDefault();

    if (open.value) {
        activeIndex.value = index;
    } else {
        choose(index);
    }
}

function onKeydown(event: KeyboardEvent): void {
    if (props.disabled || event.key === 'Tab') {
        close();

        return;
    }

    if (event.key === 'Escape') {
        if (open.value) {
            event.preventDefault();
            // Иначе тот же Escape закроет и диалог, в котором стоит список.
            event.stopPropagation();
            close();
        }

        return;
    }

    if (!open.value) {
        if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
            event.preventDefault();
            reveal();

            return;
        }

        typeahead(event);

        return;
    }

    switch (event.key) {
        case 'Enter':
        case ' ':
            event.preventDefault();
            choose(activeIndex.value);
            break;
        case 'ArrowDown':
            event.preventDefault();
            moveActive(1);
            break;
        case 'ArrowUp':
            event.preventDefault();
            moveActive(-1);
            break;
        case 'Home':
            event.preventDefault();
            activeIndex.value = 0;
            break;
        case 'End':
            event.preventDefault();
            activeIndex.value = items.value.length - 1;
            break;
        default:
            typeahead(event);
    }
}

function onDocumentClick(event: MouseEvent): void {
    if (root.value !== null && !root.value.contains(event.target as Node)) {
        close();
    }
}

watch(open, (isOpen) => {
    if (isOpen) {
        document.addEventListener('click', onDocumentClick);
    } else {
        document.removeEventListener('click', onDocumentClick);
    }
});

watch([open, activeIndex], ([isOpen, index]) => {
    if (!isOpen) {
        return;
    }

    void nextTick(() => {
        const option = list.value?.children[index] as HTMLElement | undefined;

        option?.scrollIntoView?.({ block: 'nearest' });
    });
});

watch(() => props.disabled, (disabled) => {
    if (disabled) {
        close();
    }
});

onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick);
});

function optionClass(index: number): string {
    const isSelected = items.value[index]?.value === model.value;

    if (index === activeIndex.value) {
        return isSelected ? 'bg-accent text-white' : 'bg-indigo-50 text-fg dark:bg-indigo-500/15';
    }

    return isSelected ? 'font-medium text-accent-fg' : 'text-fg-muted';
}
</script>

<template>
    <div ref="root" class="relative">
        <div class="invisible flex h-0 flex-col overflow-hidden" aria-hidden="true">
            <span v-for="item in items" :key="item.value" class="pl-3 pr-9 text-sm">{{ item.label }}</span>
        </div>

        <button
            :id="id"
            ref="trigger"
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            :aria-controls="listId"
            :aria-expanded="open"
            :aria-activedescendant="open ? optionId(activeIndex) : undefined"
            :aria-invalid="invalid || undefined"
            :aria-describedby="describedBy"
            :disabled="disabled"
            class="flex w-full items-center justify-between gap-2 rounded-md bg-surface px-3 py-2 text-left text-sm shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-subtle"
            :class="[
                invalid ? 'ring-danger' : 'ring-border-strong focus:ring-accent',
                model === '' ? 'text-fg-faint' : 'text-fg',
            ]"
            v-bind="$attrs"
            @click="toggle"
            @keydown="onKeydown"
        >
            <span class="truncate">{{ selectedLabel }}</span>
            <span
                class="shrink-0 text-xs text-fg-faint transition"
                :class="open ? 'rotate-180' : ''"
                aria-hidden="true"
            >
                &#9662;
            </span>
        </button>

        <div
            v-if="open"
            :id="listId"
            ref="list"
            role="listbox"
            class="absolute left-0 z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
            <div
                v-for="(item, index) in items"
                :id="optionId(index)"
                :key="item.value"
                role="option"
                :aria-selected="item.value === model"
                class="cursor-pointer px-3 py-2 text-sm"
                :class="optionClass(index)"
                @click="choose(index)"
                @mousemove="activeIndex = index"
            >
                {{ item.label }}
            </div>
        </div>
    </div>
</template>
