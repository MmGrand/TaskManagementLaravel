<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import * as rolesApi from '@/api/roles';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppField from '@/components/ui/AppField.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AvatarUploader from '@/components/domain/users/AvatarUploader.vue';
import { useEnumLabel } from '@/composables/useEnumLabel';
import { usePermissions } from '@/composables/usePermissions';
import { USER_STATUSES } from '@/types/enums';
import type { ApiError } from '@/types/api';
import type { Role, User } from '@/types/models';
import { buildUserPayload, type UserFormValues, type UserPayload } from '@/utils/userPayload';

const props = defineProps<{ user: User; pending?: boolean; error?: ApiError | null }>();
const emit = defineEmits<{ submit: [payload: UserPayload, avatar: File | null] }>();

const { canManageUsers } = usePermissions();

const { t } = useI18n();
const { enumLabel, enumOptions } = useEnumLabel();

const statusOptions = enumOptions('userStatus', USER_STATUSES);

/**
 * Хранится сырой список ролей, а подписи считаются: иначе они замёрзли бы
 * на языке, активном в момент загрузки.
 */
const roles = ref<Role[]>([]);
const roleOptions = computed(() =>
    roles.value.map((role) => ({ value: String(role.id), label: enumLabel('role', role.slug) })),
);

const avatar = ref<File | null>(null);

const form = reactive<UserFormValues>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'active',
    role_id: '',
});

watch(
    () => props.user,
    (user) => {
        form.first_name = user.first_name;
        form.last_name = user.last_name;
        form.email = user.email;
        form.phone = user.phone;
        form.status = user.status;
        form.role_id = user.role_id === null ? '' : String(user.role_id);
    },
    { immediate: true },
);

onMounted(async () => {
    // Менять роль может только админ, и список ролей доступен только админу.
    if (!canManageUsers.value) {
        return;
    }

    try {
        roles.value = await rolesApi.list();
    } catch {
        roles.value = [];
    }
});

function fieldError(field: string): string | null {
    return props.error?.errors[field]?.[0] ?? null;
}

function onSubmit(): void {
    emit('submit', buildUserPayload(form, canManageUsers.value), avatar.value);
}
</script>

<template>
    <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
        <AppAlert v-if="error && !error.isValidation">{{ error.message }}</AppAlert>

        <AvatarUploader :user="user" @change="avatar = $event" />
        <p v-if="fieldError('avatar')" class="text-xs text-danger-fg">{{ fieldError('avatar') }}</p>

        <div class="grid gap-4 sm:grid-cols-2">
            <AppField v-slot="field" :label="t('auth.firstName')" :error="fieldError('first_name')" required>
                <AppInput v-bind="field" v-model="form.first_name" autocomplete="given-name" required />
            </AppField>

            <AppField v-slot="field" :label="t('auth.lastName')" :error="fieldError('last_name')" required>
                <AppInput v-bind="field" v-model="form.last_name" autocomplete="family-name" required />
            </AppField>

            <AppField v-slot="field" :label="t('common.email')" :error="fieldError('email')" required>
                <AppInput v-bind="field" v-model="form.email" type="email" autocomplete="email" required />
            </AppField>

            <AppField v-slot="field" :label="t('common.phone')" :error="fieldError('phone')" required>
                <AppInput v-bind="field" v-model="form.phone" type="tel" autocomplete="tel" required />
            </AppField>

            <template v-if="canManageUsers">
                <AppField v-slot="field" :label="t('common.status')" :error="fieldError('status')">
                    <AppSelect v-bind="field" v-model="form.status" :options="statusOptions" />
                </AppField>

                <AppField
                    v-slot="field"
                    :label="t('users.role')"
                    :error="fieldError('role_id')"
                    :hint="roleOptions.length === 0 ? t('users.rolesUnavailable') : undefined"
                >
                    <AppSelect
                        v-bind="field"
                        v-model="form.role_id"
                        :options="roleOptions"
                        :disabled="roleOptions.length === 0"
                        :placeholder="t('users.rolePlaceholder')"
                    />
                </AppField>
            </template>
        </div>

        <div class="flex justify-end">
            <AppButton type="submit" :loading="pending">{{ t('common.save') }}</AppButton>
        </div>
    </form>
</template>
