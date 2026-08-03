<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import type { PageMeta } from '@/types/api';

const props = defineProps<{ meta: PageMeta }>();
const emit = defineEmits<{ 'update:page': [page: number] }>();

const { t } = useI18n();

const isFirst = computed(() => props.meta.current_page <= 1);
const isLast = computed(() => props.meta.current_page >= props.meta.last_page);

function go(page: number): void {
    if (page >= 1 && page <= props.meta.last_page && page !== props.meta.current_page) {
        emit('update:page', page);
    }
}
</script>

<template>
    <nav v-if="meta.last_page > 1" class="flex items-center justify-between gap-4" :aria-label="t('pagination.label')">
        <p class="text-sm text-gray-600">
            <span v-if="meta.from !== null && meta.to !== null">
                {{ t('pagination.range', { from: meta.from, to: meta.to, total: meta.total }) }}
            </span>
            <span v-else>{{ t('pagination.empty') }}</span>
        </p>

        <div class="flex items-center gap-2">
            <AppButton variant="secondary" :disabled="isFirst" @click="go(meta.current_page - 1)">
                {{ t('pagination.previous') }}
            </AppButton>
            <span class="text-sm text-gray-600">{{ meta.current_page }} / {{ meta.last_page }}</span>
            <AppButton variant="secondary" :disabled="isLast" @click="go(meta.current_page + 1)">
                {{ t('pagination.next') }}
            </AppButton>
        </div>
    </nav>
</template>
