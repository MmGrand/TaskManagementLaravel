import { i18n } from '@/i18n';
import { isValidPhone, PHONE_MAX_DIGITS, PHONE_MIN_DIGITS } from '@/utils/phone';

export type Validator = (value: string) => string | null;

export const PASSWORD_MIN_LENGTH = 8;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function whenFilled(check: Validator): Validator {
    return (value) => (value.trim() === '' ? null : check(value));
}

export function required(): Validator {
    return (value) => (value.trim() === '' ? i18n.global.t('validation.required') : null);
}

export function maxLength(max: number): Validator {
    return whenFilled((value) => (value.trim().length > max ? i18n.global.t('validation.maxLength', { max }) : null));
}

export function minLength(min: number): Validator {
    return whenFilled((value) => (value.length < min ? i18n.global.t('validation.minLength', { min }) : null));
}

const PASSWORD_LETTER = /\p{L}/u;
const PASSWORD_NUMBER = /\p{N}/u;

export function passwordComplexity(): Validator {
    return whenFilled((value) =>
        PASSWORD_LETTER.test(value) && PASSWORD_NUMBER.test(value)
            ? null
            : i18n.global.t('validation.passwordComplexity'),
    );
}

export function email(): Validator {
    return whenFilled((value) => (EMAIL.test(value.trim()) ? null : i18n.global.t('validation.email')));
}

export function phone(): Validator {
    return whenFilled((value) =>
        isValidPhone(value)
            ? null
            : i18n.global.t('validation.phone', { min: PHONE_MIN_DIGITS, max: PHONE_MAX_DIGITS }),
    );
}

export function sameAs(other: () => string, messageKey: string): Validator {
    return whenFilled((value) => (value === other() ? null : i18n.global.t(messageKey)));
}
