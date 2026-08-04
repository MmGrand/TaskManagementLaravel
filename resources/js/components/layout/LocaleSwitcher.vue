<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppDropdown from '@/components/ui/AppDropdown.vue';
import AppMenuItem from '@/components/ui/AppMenuItem.vue';
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
            <AppMenuItem
                v-for="descriptor in locale.available"
                :key="descriptor.code"
                :selected="descriptor.code === locale.current"
                @click="
                    select(descriptor.code);
                    close();
                "
            >
                {{ descriptor.nativeName }}
            </AppMenuItem>
        </template>
    </AppDropdown>
</template>
