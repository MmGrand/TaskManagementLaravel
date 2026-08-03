<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePermissions } from '@/composables/usePermissions';
import type { Permission } from '@/types/enums';

interface NavItem {
    name: string;
    labelKey: string;
    permission?: Permission;
}

const { can } = usePermissions();
const { t } = useI18n();

const ITEMS: NavItem[] = [
    { name: 'dashboard', labelKey: 'nav.dashboard' },
    { name: 'projects', labelKey: 'nav.projects', permission: 'projects.viewAny' },
    { name: 'tasks', labelKey: 'nav.tasks', permission: 'tasks.viewAny' },
    { name: 'users', labelKey: 'nav.users', permission: 'users.viewAny' },
];

const visibleItems = computed(() => ITEMS.filter((item) => !item.permission || can(item.permission)));
</script>

<template>
    <nav class="flex items-center gap-1" :aria-label="t('nav.label')">
        <RouterLink
            v-for="item in visibleItems"
            :key="item.name"
            :to="{ name: item.name }"
            class="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            active-class="bg-gray-100 text-gray-900"
        >
            {{ t(item.labelKey) }}
        </RouterLink>
    </nav>
</template>
