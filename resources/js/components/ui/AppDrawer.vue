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
    <Transition
        enter-active-class="transition-opacity duration-200 ease-out motion-reduce:transition-none"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150 ease-in motion-reduce:transition-none"
        leave-to-class="opacity-0"
    >
        <div
            v-if="open"
            class="fixed inset-0 z-50 flex justify-end overflow-hidden bg-gray-900/40"
            @click.self="emit('close')"
            @keydown="onKeydown"
        >
            <Transition
                appear
                enter-active-class="transition-transform duration-200 ease-out motion-reduce:transition-none"
                enter-from-class="translate-x-full"
                leave-active-class="transition-transform duration-150 ease-in motion-reduce:transition-none"
                leave-to-class="translate-x-full"
            >
                <div
                    v-if="open"
                    ref="panel"
                    role="dialog"
                    aria-modal="true"
                    :aria-labelledby="titleId"
                    tabindex="-1"
                    class="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl outline-none"
                >
                    <div
                        class="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4"
                    >
                        <h2 :id="titleId" class="text-lg font-semibold text-gray-900">{{ title }}</h2>
                        <button
                            type="button"
                            class="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-md text-2xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            :aria-label="t('common.close')"
                            @click="emit('close')"
                        >
                            &times;
                        </button>
                    </div>

                    <div class="grow px-5 py-4"><slot /></div>

                    <div v-if="$slots.footer" class="border-t border-gray-200 px-5 py-4">
                        <slot name="footer" />
                    </div>
                </div>
            </Transition>
        </div>
    </Transition>
</template>
