<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppField from '@/components/ui/AppField.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppPhoneInput from '@/components/ui/AppPhoneInput.vue';
import { useApiForm } from '@/composables/useApiForm';
import { useFormValidation } from '@/composables/useFormValidation';
import { useAuthStore } from '@/stores/auth';
import { normalizePhone } from '@/utils/phone';
import {
    email,
    maxLength,
    minLength,
    passwordComplexity,
    PASSWORD_MIN_LENGTH,
    phone,
    required,
    sameAs,
} from '@/utils/validation';

const auth = useAuthStore();
const router = useRouter();
const form = useApiForm();
const { t } = useI18n();

const payload = reactive({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
});

const validation = useFormValidation(payload, {
    first_name: [required(), maxLength(255)],
    last_name: [required(), maxLength(255)],
    email: [required(), email(), maxLength(255)],
    phone: [required(), phone()],
    password: [required(), minLength(PASSWORD_MIN_LENGTH), passwordComplexity()],
    password_confirmation: [required(), sameAs(() => payload.password, 'validation.passwordMismatch')],
});

function fieldError(field: string): string | null {
    return validation.fieldError(field) ?? form.fieldError(field);
}

async function onSubmit(): Promise<void> {
    if (!validation.validate()) {
        return;
    }

    const result = await form.submit(async () => {
        await auth.register({
            ...payload,
            first_name: payload.first_name.trim(),
            last_name: payload.last_name.trim(),
            email: payload.email.trim(),
            phone: normalizePhone(payload.phone),
        });

        return true;
    });

    if (result === true) {
        await router.replace({ name: 'dashboard' });
    }
}
</script>

<template>
    <main class="flex min-h-full items-center justify-center px-4 py-12">
        <div class="w-full max-w-sm">
            <h1 class="text-center text-2xl font-semibold text-fg">{{ t('auth.registerTitle') }}</h1>

            <form class="mt-8 flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
                <AppAlert v-if="form.generalMessage()">{{ form.generalMessage() }}</AppAlert>

                <AppField v-slot="field" :label="t('auth.firstName')" :error="fieldError('first_name')" required>
                    <AppInput
                        v-bind="field"
                        v-model="payload.first_name"
                        autocomplete="given-name"
                        required
                        @blur="validation.touch('first_name')"
                    />
                </AppField>

                <AppField v-slot="field" :label="t('auth.lastName')" :error="fieldError('last_name')" required>
                    <AppInput
                        v-bind="field"
                        v-model="payload.last_name"
                        autocomplete="family-name"
                        required
                        @blur="validation.touch('last_name')"
                    />
                </AppField>

                <AppField v-slot="field" :label="t('common.email')" :error="fieldError('email')" required>
                    <AppInput
                        v-bind="field"
                        v-model="payload.email"
                        type="email"
                        autocomplete="email"
                        required
                        @blur="validation.touch('email')"
                    />
                </AppField>

                <AppField v-slot="field" :label="t('common.phone')" :error="fieldError('phone')" required>
                    <AppPhoneInput v-bind="field" v-model="payload.phone" required @blur="validation.touch('phone')" />
                </AppField>

                <AppField
                    v-slot="field"
                    :label="t('auth.password')"
                    :error="fieldError('password')"
                    :hint="t('auth.passwordHint')"
                    required
                >
                    <AppInput
                        v-bind="field"
                        v-model="payload.password"
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
                        v-model="payload.password_confirmation"
                        type="password"
                        autocomplete="new-password"
                        required
                        @blur="validation.touch('password_confirmation')"
                    />
                </AppField>

                <AppButton type="submit" :loading="form.pending.value" block>{{ t('auth.signUp') }}</AppButton>
            </form>

            <p class="mt-6 text-center text-sm text-fg-muted">
                {{ t('auth.haveAccount') }}
                <RouterLink :to="{ name: 'login' }" class="font-semibold text-accent-fg hover:text-accent-hover">
                    {{ t('auth.signIn') }}
                </RouterLink>
            </p>
        </div>
    </main>
</template>
