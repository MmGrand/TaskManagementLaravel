<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';

const { t } = useI18n();
</script>

<template>
    <main class="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-12 text-center">
        <p class="text-sm font-semibold text-indigo-600">403</p>
        <h1 class="text-2xl font-semibold text-gray-900">{{ t('errors.forbiddenTitle') }}</h1>
        <p class="max-w-md text-sm text-gray-600">{{ t('errors.forbiddenText') }}</p>
        <RouterLink :to="{ name: 'dashboard' }" class="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            {{ t('common.backToHome') }}
        </RouterLink>
    </main>
</template>
