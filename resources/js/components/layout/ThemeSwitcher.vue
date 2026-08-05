<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppDropdown from '@/components/ui/AppDropdown.vue';
import AppMenuItem from '@/components/ui/AppMenuItem.vue';
import { useThemeStore } from '@/stores/theme';
import type { ThemeMode } from '@/utils/theme';

const theme = useThemeStore();
const { t } = useI18n();

/** Ключи перечислены литералами: vue-i18n проверяет путь сообщения только на литерале. */
const LABELS: Record<ThemeMode, 'theme.light' | 'theme.dark' | 'theme.system'> = {
    light: 'theme.light',
    dark: 'theme.dark',
    system: 'theme.system',
};

function select(mode: ThemeMode): void {
    if (mode !== theme.mode) {
        theme.set(mode);
    }
}
</script>

<template>
    <AppDropdown :label="t('theme.label')" menu-class="w-44" trigger-class="px-1.5">
        <template #trigger>
            <svg
                class="size-4 text-fg-muted"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                aria-hidden="true"
            >
                <template v-if="theme.mode === 'light'">
                    <circle cx="10" cy="10" r="3.25" />
                    <path
                        d="M10 2.5v1.5M10 16v1.5M17.5 10H16M4 10H2.5M15.3 4.7l-1.05 1.05M5.75 14.25L4.7 15.3M15.3 15.3l-1.05-1.05M5.75 5.75L4.7 4.7"
                    />
                </template>
                <path v-else-if="theme.mode === 'dark'" d="M16.5 12.1A6.5 6.5 0 0 1 7.9 3.5a6.5 6.5 0 1 0 8.6 8.6Z" />
                <template v-else>
                    <rect x="2.75" y="4" width="14.5" height="9.5" rx="1.25" />
                    <path d="M7.5 17h5M10 13.5V17" />
                </template>
            </svg>
        </template>

        <template #default="{ close }">
            <AppMenuItem
                v-for="mode in theme.available"
                :key="mode"
                :selected="mode === theme.mode"
                @click="
                    select(mode);
                    close();
                "
            >
                {{ t(LABELS[mode]) }}
            </AppMenuItem>
        </template>
    </AppDropdown>
</template>
