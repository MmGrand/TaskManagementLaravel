<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ open: boolean; title: string }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();

const panel = ref<HTMLElement | null>(null);
const titleId = useId();
let previouslyFocused: HTMLElement | null = null;

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableElements(): HTMLElement[] {
    return panel.value ? Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
}

/** Удерживает Tab внутри диалога, чтобы страница под ним оставалась недоступной. */
function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        emit('close');

        return;
    }

    if (event.key !== 'Tab') {
        return;
    }

    const elements = focusableElements();

    if (elements.length === 0) {
        event.preventDefault();

        return;
    }

    const first = elements[0]!;
    const last = elements[elements.length - 1]!;
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === panel.value)) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
    }
}

watch(
    () => props.open,
    async (open) => {
        if (open) {
            previouslyFocused = document.activeElement as HTMLElement | null;
            await nextTick();
            (focusableElements()[0] ?? panel.value)?.focus();
        } else {
            previouslyFocused?.focus();
            previouslyFocused = null;
        }
    },
);

onBeforeUnmount(() => {
    previouslyFocused = null;
});
</script>

<template>
    <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 dark:bg-gray-950/70 p-4"
        @click.self="emit('close')"
        @keydown="onKeydown"
    >
        <div
            ref="panel"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            tabindex="-1"
            class="w-full max-w-lg rounded-lg bg-surface p-5 shadow-xl outline-none"
        >
            <div class="flex items-start justify-between gap-4">
                <h2 :id="titleId" class="text-lg font-semibold text-fg">{{ title }}</h2>
                <button
                    type="button"
                    class="rounded p-1 text-fg-faint hover:bg-surface-hover hover:text-fg-muted"
                    :aria-label="t('common.close')"
                    @click="emit('close')"
                >
                    &times;
                </button>
            </div>

            <div class="mt-4"><slot /></div>

            <div v-if="$slots.footer" class="mt-6 flex justify-end gap-2"><slot name="footer" /></div>
        </div>
    </div>
</template>
