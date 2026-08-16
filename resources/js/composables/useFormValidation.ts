import { computed, ref } from 'vue';
import type { Validator } from '@/utils/validation';

export type ValidationRules<T> = Partial<Record<keyof T & string, Validator[]>>;

export function useFormValidation<T extends object>(values: T, rules: ValidationRules<T>) {
    type Field = keyof T & string;

    const touched = ref(new Set<string>());
    const submitted = ref(false);
    const touchedSinceSubmit = ref(new Set<string>());

    const failures = computed<Partial<Record<Field, string>>>(() => {
        const found: Partial<Record<Field, string>> = {};

        for (const [field, validators] of Object.entries(rules) as [Field, Validator[]][]) {
            const value = String(values[field] ?? '');

            for (const validate of validators) {
                const message = validate(value);

                if (message !== null) {
                    found[field] = message;
                    break;
                }
            }
        }

        return found;
    });

    const isValid = computed(() => Object.keys(failures.value).length === 0);

    function fieldError(field: string, serverMessage: string | null = null): string | null {
        const clientMessage =
            submitted.value || touched.value.has(field) ? (failures.value[field as Field] ?? null) : null;

        if (clientMessage !== null) {
            return clientMessage;
        }

        return touchedSinceSubmit.value.has(field) ? null : serverMessage;
    }

    function touch(field: string): void {
        touched.value = new Set([...touched.value, field]);

        if (submitted.value) {
            touchedSinceSubmit.value = new Set([...touchedSinceSubmit.value, field]);
        }
    }

    function validate(): boolean {
        submitted.value = true;

        if (isValid.value) {
            touchedSinceSubmit.value = new Set();
        }

        return isValid.value;
    }

    function reset(): void {
        submitted.value = false;
        touched.value = new Set();
        touchedSinceSubmit.value = new Set();
    }

    return { fieldError, touch, validate, reset, isValid };
}
