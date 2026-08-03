<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/** Без дефолта в withDefaults: перевод нельзя вычислить в статическом выражении. */
const props = defineProps<{ label?: string }>();

const { t } = useI18n();

const text = computed(() => props.label ?? t('common.loading'));
</script>

<template>
    <div role="status" class="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
        <span
            class="size-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"
            aria-hidden="true"
        />
        <span>{{ text }}</span>
    </div>
</template>
