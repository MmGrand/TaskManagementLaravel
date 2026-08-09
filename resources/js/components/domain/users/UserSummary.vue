<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import UserStatusBadge from '@/components/domain/users/UserStatusBadge.vue';
import { useEnumLabel } from '@/composables/useEnumLabel';
import type { User } from '@/types/models';
import { formatPhone, fullName } from '@/utils/format';

const props = defineProps<{ user: User }>();

const { t } = useI18n();
const { enumLabel } = useEnumLabel();

const name = computed(() => fullName(props.user));
</script>

<template>
    <div class="flex flex-col gap-4 rounded-lg bg-surface p-4 ring-1 ring-border">
        <div class="flex items-center gap-3">
            <AppAvatar :user="user" size="md" />
            <span class="text-base font-semibold text-fg">{{ name }}</span>
        </div>

        <dl class="grid gap-3 text-sm sm:grid-cols-2">
            <div class="flex flex-col gap-1">
                <dt class="text-xs font-semibold text-fg-muted uppercase">{{ t('common.email') }}</dt>
                <dd class="text-fg">{{ user.email }}</dd>
            </div>

            <div class="flex flex-col gap-1">
                <dt class="text-xs font-semibold text-fg-muted uppercase">{{ t('common.phone') }}</dt>
                <dd class="text-fg">{{ formatPhone(user.phone) }}</dd>
            </div>

            <div class="flex flex-col items-start gap-1">
                <dt class="text-xs font-semibold text-fg-muted uppercase">{{ t('users.role') }}</dt>
                <dd>
                    <AppBadge v-if="user.role" tone="indigo">{{ enumLabel('role', user.role.slug) }}</AppBadge>
                    <span v-else class="text-fg-faint">—</span>
                </dd>
            </div>

            <div class="flex flex-col items-start gap-1">
                <dt class="text-xs font-semibold text-fg-muted uppercase">{{ t('common.status') }}</dt>
                <dd><UserStatusBadge :status="user.status" /></dd>
            </div>
        </dl>
    </div>
</template>
