<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';

const { t } = useI18n();
</script>

<template>
    <main class="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-12 text-center">
        <p class="text-sm font-semibold text-accent-fg">403</p>
        <h1 class="text-2xl font-semibold text-fg">{{ t('errors.forbiddenTitle') }}</h1>
        <p class="max-w-md text-sm text-fg-muted">{{ t('errors.forbiddenText') }}</p>
        <RouterLink :to="{ name: 'dashboard' }" class="text-sm font-semibold text-accent-fg hover:text-accent-hover">
            {{ t('common.backToHome') }}
        </RouterLink>
    </main>
</template>
