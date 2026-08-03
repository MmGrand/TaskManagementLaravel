<script setup lang="ts">
import AppNav from '@/components/layout/AppNav.vue';
import LocaleSwitcher from '@/components/layout/LocaleSwitcher.vue';
import UserMenu from '@/components/layout/UserMenu.vue';
</script>

<template>
    <div class="flex min-h-full flex-col">
        <header class="border-b border-gray-200 bg-white">
            <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
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

        <main class="mx-auto w-full max-w-6xl grow px-4 py-6">
            <slot />
        </main>
    </div>
</template>
