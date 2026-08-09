<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import * as usersApi from '@/api/users';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import PasswordForm from '@/components/domain/users/PasswordForm.vue';
import UserForm from '@/components/domain/users/UserForm.vue';
import UserSummary from '@/components/domain/users/UserSummary.vue';
import { useApiForm } from '@/composables/useApiForm';
import { usePermissions } from '@/composables/usePermissions';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import type { ApiError } from '@/types/api';
import type { User } from '@/types/models';
import type { PasswordPayload, UserPayload } from '@/utils/userPayload';

/**
 * Один экран служит и профилем, и редактором пользователя для админа: `?id=`
 * выбирает другого пользователя, а разрешён ли доступ — решает политика на бэкенде.
 */
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const ui = useUiStore();
const form = useApiForm();
const permissions = usePermissions();
const { t } = useI18n();

const passwordForm = useApiForm();

const user = ref<User | null>(null);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
/** Смена ключа перемонтирует форму, очищая поля после удачной смены пароля. */
const passwordFormKey = ref(0);

const targetId = computed(() => {
    const raw = route.query.id;

    return typeof raw === 'string' && raw !== '' ? Number(raw) : (auth.user?.id ?? null);
});

const isSelf = computed(() => user.value !== null && user.value.id === auth.user?.id);

const canEdit = computed(() => user.value !== null && permissions.canUpdateUser(user.value));

onMounted(async () => {
    const id = targetId.value;

    if (id === null) {
        loading.value = false;

        return;
    }

    try {
        user.value = await usersApi.show(id);
    } catch (caught) {
        const error = caught as ApiError;

        if (error.isForbidden && !error.isAccountDisabled) {
            await router.replace({ name: 'forbidden' });

            return;
        }

        loadError.value = error;
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

async function onChangePassword(payload: PasswordPayload): Promise<void> {
    const current = user.value;

    if (current === null) {
        return;
    }

    const result = await passwordForm.submit(async () => {
        await usersApi.changePassword(current.id, payload);

        return true;
    });

    if (result === true) {
        passwordFormKey.value += 1;
        ui.success(t('profile.passwordChanged'));
    }
}
</script>

<template>
    <section class="flex max-w-2xl flex-col gap-4">
        <h1 class="text-xl font-semibold text-fg">{{ isSelf ? t('profile.mine') : t('profile.other') }}</h1>

        <AppSpinner v-if="loading" />
        <AppAlert v-else-if="loadError">{{ loadError.message }}</AppAlert>

        <template v-else-if="user">
            <UserForm
                v-if="canEdit"
                :user="user"
                :pending="form.pending.value"
                :error="form.error.value"
                @submit="onSubmit"
            />
            <UserSummary v-else :user="user" />
        </template>

        <template v-if="isSelf">
            <hr class="border-border" />

            <h2 class="text-lg font-semibold text-fg">{{ t('profile.changePassword') }}</h2>

            <PasswordForm
                :key="passwordFormKey"
                :pending="passwordForm.pending.value"
                :error="passwordForm.error.value"
                @submit="onChangePassword"
            />
        </template>
    </section>
</template>
