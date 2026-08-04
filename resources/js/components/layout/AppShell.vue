<script setup lang="ts">
import { computed } from 'vue';
import AppNav from '@/components/layout/AppNav.vue';
import LocaleSwitcher from '@/components/layout/LocaleSwitcher.vue';
import UserMenu from '@/components/layout/UserMenu.vue';
import { useUiStore } from '@/stores/ui';

const ui = useUiStore();

const maxWidth = computed(() => (ui.wideContent ? 'max-w-7xl' : 'max-w-6xl'));
</script>

<template>
    <div class="flex min-h-full flex-col">
        <header class="border-b border-gray-200 bg-white">
            <div
                class="mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                :class="maxWidth"
            >
                <div class="flex items-center gap-6">
                    <RouterLink :to="{ name: 'dashboard' }" class="text-sm font-semibold text-gray-900">
                        Task Management
                    </RouterLink>
                    <AppNav />
                </div>
                <div class="flex items-center gap-2">
                    <LocaleSwitcher />
                    <UserMenu />
                </div>
            </div>
        </header>

        <main class="mx-auto w-full grow px-4 py-6" :class="maxWidth">
            <slot />
        </main>
    </div>
</template>
