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

withDefaults(defineProps<{ direction?: 'row' | 'column' }>(), { direction: 'row' });

const DIRECTIONS = {
    row: 'flex items-center gap-1',
    column: 'flex flex-col gap-1',
} as const;

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
    <nav :class="DIRECTIONS[direction]" :aria-label="t('nav.label')">
        <RouterLink
            v-for="item in visibleItems"
            :key="item.name"
            :to="{ name: item.name }"
            class="rounded-md px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-hover hover:text-fg"
            active-class="bg-surface-hover text-fg"
        >
            {{ t(item.labelKey) }}
        </RouterLink>
    </nav>
</template>
