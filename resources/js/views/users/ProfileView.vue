<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import * as usersApi from '@/api/users';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import UserForm from '@/components/domain/users/UserForm.vue';
import { useApiForm } from '@/composables/useApiForm';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import type { ApiError } from '@/types/api';
import type { User } from '@/types/models';
import type { UserPayload } from '@/utils/userPayload';

/**
 * Один экран служит и профилем, и редактором пользователя для админа: `?id=`
 * выбирает другого пользователя, а разрешён ли доступ — решает политика на бэкенде.
 */
const route = useRoute();
const auth = useAuthStore();
const ui = useUiStore();
const form = useApiForm();
const { t } = useI18n();

const user = ref<User | null>(null);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);

const targetId = computed(() => {
    const raw = route.query.id;

    return typeof raw === 'string' && raw !== '' ? Number(raw) : (auth.user?.id ?? null);
});

const isSelf = computed(() => user.value !== null && user.value.id === auth.user?.id);

onMounted(async () => {
    const id = targetId.value;

    if (id === null) {
        loading.value = false;

        return;
    }

    try {
        user.value = await usersApi.show(id);
    } catch (caught) {
        loadError.value = caught as ApiError;
    } finally {
        loading.value = false;
    }
});

async function onSubmit(payload: UserPayload, avatar: File | null): Promise<void> {
    const current = user.value;

    if (current === null) {
        return;
    }

    const result = await form.submit(() => usersApi.save(current.id, payload, avatar));

    if (result !== undefined) {
        user.value = result;
        ui.success(t('profile.saved'));

        // Обновляет аватар и имя в шапке после редактирования собственного профиля.
        if (isSelf.value) {
            auth.setUser(result);
        }
    }
}
</script>

<template>
    <section class="flex max-w-2xl flex-col gap-4">
        <h1 class="text-xl font-semibold text-fg">{{ isSelf ? t('profile.mine') : t('profile.other') }}</h1>

        <AppSpinner v-if="loading" />
        <AppAlert v-else-if="loadError">{{ loadError.message }}</AppAlert>

        <UserForm
            v-else-if="user"
            :user="user"
            :pending="form.pending.value"
            :error="form.error.value"
            @submit="onSubmit"
        />
    </section>
</template>
