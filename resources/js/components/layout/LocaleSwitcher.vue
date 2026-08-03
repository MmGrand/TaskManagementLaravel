<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppDropdown from '@/components/ui/AppDropdown.vue';
import type { LocaleCode } from '@/i18n/locale-state';
import { useLocaleStore } from '@/stores/locale';

const locale = useLocaleStore();
const { t } = useI18n();

/** В шапке виден только код активного языка; полные названия — в меню. */
const activeShortName = computed(
    () => locale.available.find((descriptor) => descriptor.code === locale.current)?.shortName ?? '',
);

function select(code: LocaleCode): void {
    if (code !== locale.current) {
        void locale.set(code);
    }
}
</script>

<template>
    <AppDropdown :label="t('locale.label')" menu-class="w-44" trigger-class="px-1.5">
        <template #trigger>
            <span class="text-xs font-semibold text-gray-700">{{ activeShortName }}</span>
        </template>

        <template #default="{ close }">
            <button
                v-for="descriptor in locale.available"
                :key="descriptor.code"
                type="button"
                role="menuitemradio"
                :aria-checked="descriptor.code === locale.current"
                class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                :class="descriptor.code === locale.current ? 'font-medium text-gray-900' : 'text-gray-700'"
                @click="
                    select(descriptor.code);
                    close();
                "
            >
                {{ descriptor.nativeName }}
                <span v-if="descriptor.code === locale.current" class="text-indigo-600" aria-hidden="true">
                    &check;
                </span>
            </button>
        </template>
    </AppDropdown>
</template>
