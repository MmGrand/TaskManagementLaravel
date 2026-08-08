<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppField from '@/components/ui/AppField.vue';
import AppInput from '@/components/ui/AppInput.vue';
import type { ApiError } from '@/types/api';
import type { PasswordPayload } from '@/utils/userPayload';

const props = defineProps<{ pending?: boolean; error?: ApiError | null }>();
const emit = defineEmits<{ submit: [payload: PasswordPayload] }>();

const { t } = useI18n();

const form = reactive<PasswordPayload>({
    current_password: '',
    password: '',
    password_confirmation: '',
});

function fieldError(field: string): string | null {
    return props.error?.errors[field]?.[0] ?? null;
}

function onSubmit(): void {
    emit('submit', { ...form });
}
</script>

<template>
    <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
        <AppAlert v-if="error && !error.isValidation">{{ error.message }}</AppAlert>

        <AppField v-slot="field" :label="t('auth.currentPassword')" :error="fieldError('current_password')" required>
            <AppInput
                v-bind="field"
                v-model="form.current_password"
                type="password"
                autocomplete="current-password"
                required
            />
        </AppField>

        <div class="grid gap-4 sm:grid-cols-2">
            <AppField
                v-slot="field"
                :label="t('profile.newPassword')"
                :error="fieldError('password')"
                :hint="t('auth.passwordHint')"
                required
            >
                <AppInput
                    v-bind="field"
                    v-model="form.password"
                    type="password"
                    autocomplete="new-password"
                    required
                />
            </AppField>

            <AppField v-slot="field" :label="t('auth.passwordConfirmation')" required>
                <AppInput
                    v-bind="field"
                    v-model="form.password_confirmation"
                    type="password"
                    autocomplete="new-password"
                    required
                />
            </AppField>
        </div>

        <div class="flex justify-end">
            <AppButton type="submit" :loading="pending">{{ t('profile.changePassword') }}</AppButton>
        </div>
    </form>
</template>
