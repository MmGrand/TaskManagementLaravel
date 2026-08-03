<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';

withDefaults(
    defineProps<{
        /** Подпись кнопки для скринридера: видимое содержимое триггера бывает одним значком. */
        label: string;
        menuClass?: string;
        triggerClass?: string;
    }>(),
    { menuClass: 'w-56', triggerClass: '' },
);

const open = ref(false);
const root = ref<HTMLElement | null>(null);

function close(): void {
    open.value = false;
}

function onDocumentClick(event: MouseEvent): void {
    if (root.value !== null && !root.value.contains(event.target as Node)) {
        close();
    }
}

function onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        close();
    }
}

/** Слушатели живут только пока меню открыто, чтобы не висеть на документе всю сессию. */
watch(open, (isOpen) => {
    if (isOpen) {
        document.addEventListener('click', onDocumentClick);
        document.addEventListener('keydown', onDocumentKeydown);
    } else {
        document.removeEventListener('click', onDocumentClick);
        document.removeEventListener('keydown', onDocumentKeydown);
    }
});

onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onDocumentKeydown);
});

defineExpose({ close });
</script>

<template>
    <div ref="root" class="relative">
        <button
            type="button"
            :aria-label="label"
            :aria-expanded="open"
            aria-haspopup="menu"
            class="flex items-center gap-2 rounded-md p-1 hover:bg-gray-100"
            :class="triggerClass"
            @click="open = !open"
        >
            <slot name="trigger" />
            <span
                class="inline-block text-xs text-gray-400 transition"
                :class="open ? 'rotate-180' : ''"
                aria-hidden="true"
            >
                &#9662;
            </span>
        </button>

        <div
            v-if="open"
            role="menu"
            class="absolute right-0 z-20 mt-2 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            :class="menuClass"
        >
            <slot :close="close" />
        </div>
    </div>
</template>
