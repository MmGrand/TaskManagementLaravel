<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AppNav from '@/components/layout/AppNav.vue';
import LocaleSwitcher from '@/components/layout/LocaleSwitcher.vue';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher.vue';
import UserMenu from '@/components/layout/UserMenu.vue';
import AppDrawer from '@/components/ui/AppDrawer.vue';
import { useUiStore } from '@/stores/ui';

const ui = useUiStore();
const route = useRoute();
const { t } = useI18n();

const maxWidth = computed(() => (ui.wideContent ? 'max-w-7xl' : 'max-w-6xl'));

const menuOpen = ref(false);

watch(
    () => route.fullPath,
    () => {
        menuOpen.value = false;
    },
);
</script>

<template>
    <div class="flex min-h-full flex-col">
        <header class="border-b border-border bg-surface">
            <div class="mx-auto flex items-center justify-between gap-3 px-4 py-3" :class="maxWidth">
                <div class="flex min-w-0 items-center gap-6">
                    <RouterLink
                        :to="{ name: 'dashboard' }"
                        class="truncate text-sm font-semibold text-fg"
                    >
                        Task Management
                    </RouterLink>
                    <div class="hidden md:block"><AppNav /></div>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                    <ThemeSwitcher />
                    <LocaleSwitcher />
                    <UserMenu />
                    <button
                        type="button"
                        class="rounded-md p-1.5 text-fg-muted hover:bg-surface-hover md:hidden"
                        :aria-label="t('nav.openMenu')"
                        :aria-expanded="menuOpen"
                        @click="menuOpen = true"
                    >
                        <svg
                            class="size-5"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                d="M3 5.5h14M3 10h14M3 14.5h14"
                                stroke-width="1.5"
                                stroke-linecap="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </header>

        <AppDrawer :open="menuOpen" :title="t('nav.menu')" @close="menuOpen = false">
            <AppNav direction="column" />
        </AppDrawer>

        <main class="mx-auto w-full grow px-4 py-6" :class="maxWidth">
            <slot />
        </main>
    </div>
</template>
