import { computed, ref } from 'vue';
import type { Validator } from '@/utils/validation';

export type ValidationRules<T> = Partial<Record<keyof T & string, Validator[]>>;

export function useFormValidation<T extends object>(values: T, rules: ValidationRules<T>) {
    type Field = keyof T & string;

    const touched = ref(new Set<string>());
    const submitted = ref(false);

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

    function fieldError(field: string): string | null {
        return submitted.value || touched.value.has(field) ? (failures.value[field as Field] ?? null) : null;
    }

    function touch(field: string): void {
        touched.value = new Set([...touched.value, field]);
    }

    function validate(): boolean {
        submitted.value = true;

        return isValid.value;
    }

    function reset(): void {
        submitted.value = false;
        touched.value = new Set();
    }

    return { fieldError, touch, validate, reset, isValid };
}
