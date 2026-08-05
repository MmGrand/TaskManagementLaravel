<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppField from '@/components/ui/AppField.vue';
import AppInput from '@/components/ui/AppInput.vue';
import { useApiForm } from '@/composables/useApiForm';
import { useRetryAfter } from '@/composables/useRetryAfter';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const form = useApiForm();
const throttle = useRetryAfter(form.error);
const { t } = useI18n();

const credentials = reactive({ email: '', password: '' });

async function onSubmit(): Promise<void> {
    const result = await form.submit(async () => {
        await auth.login({ email: credentials.email.trim(), password: credentials.password });

        return true;
    });

    if (result === true) {
        const redirect = route.query.redirect;

        await router.replace(typeof redirect === 'string' ? redirect : { name: 'dashboard' });
    }
}
</script>

<template>
    <main class="flex min-h-full items-center justify-center px-4 py-12">
        <div class="w-full max-w-sm">
            <h1 class="text-center text-2xl font-semibold text-fg">{{ t('auth.loginTitle') }}</h1>

            <form class="mt-8 flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
                <AppAlert v-if="auth.sessionEndedMessage" variant="warning">
                    {{ auth.sessionEndedMessage }}
                </AppAlert>

                <AppAlert v-if="throttle.isWaiting.value" variant="warning">{{ throttle.message.value }}</AppAlert>
                <AppAlert v-else-if="form.generalMessage()">{{ form.generalMessage() }}</AppAlert>

                <AppField v-slot="field" :label="t('common.email')" :error="form.fieldError('email')" required>
                    <AppInput
                        v-bind="field"
                        v-model="credentials.email"
                        type="email"
                        autocomplete="email"
                        required
                    />
                </AppField>

                <AppField v-slot="field" :label="t('auth.password')" :error="form.fieldError('password')" required>
                    <AppInput
                        v-bind="field"
                        v-model="credentials.password"
                        type="password"
                        autocomplete="current-password"
                        required
                    />
                </AppField>

                <AppButton
                    type="submit"
                    :loading="form.pending.value"
                    :disabled="throttle.isWaiting.value"
                    block
                >
                    {{ t('auth.signIn') }}
                </AppButton>
            </form>

            <p class="mt-6 text-center text-sm text-fg-muted">
                {{ t('auth.noAccount') }}
                <RouterLink :to="{ name: 'register' }" class="font-semibold text-accent-fg hover:text-accent-hover">
                    {{ t('auth.signUp') }}
                </RouterLink>
            </p>
        </div>
    </main>
</template>
