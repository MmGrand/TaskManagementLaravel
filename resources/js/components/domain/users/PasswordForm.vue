<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppField from '@/components/ui/AppField.vue';
import AppInput from '@/components/ui/AppInput.vue';
import { useFormValidation } from '@/composables/useFormValidation';
import type { ApiError } from '@/types/api';
import { minLength, PASSWORD_MIN_LENGTH, required, sameAs } from '@/utils/validation';
import type { PasswordPayload } from '@/utils/userPayload';

const props = defineProps<{ pending?: boolean; error?: ApiError | null }>();
const emit = defineEmits<{ submit: [payload: PasswordPayload] }>();

const { t } = useI18n();

const form = reactive<PasswordPayload>({
    current_password: '',
    password: '',
    password_confirmation: '',
});

const validation = useFormValidation(form, {
    current_password: [required()],
    password: [required(), minLength(PASSWORD_MIN_LENGTH)],
    password_confirmation: [required(), sameAs(() => form.password, 'validation.passwordMismatch')],
});

function fieldError(field: string): string | null {
    return validation.fieldError(field) ?? props.error?.errors[field]?.[0] ?? null;
}

function onSubmit(): void {
    if (!validation.validate()) {
        return;
    }

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
                @blur="validation.touch('current_password')"
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
                    @blur="validation.touch('password')"
                />
            </AppField>

            <AppField
                v-slot="field"
                :label="t('auth.passwordConfirmation')"
                :error="fieldError('password_confirmation')"
                required
            >
                <AppInput
                    v-bind="field"
                    v-model="form.password_confirmation"
                    type="password"
                    autocomplete="new-password"
                    required
                    @blur="validation.touch('password_confirmation')"
                />
            </AppField>
        </div>

        <div class="flex justify-end">
            <AppButton type="submit" :loading="pending">{{ t('profile.changePassword') }}</AppButton>
        </div>
    </form>
</template>
