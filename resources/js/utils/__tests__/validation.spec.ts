import { describe, expect, it } from 'vitest';
import { setLocale } from '@/i18n';
import { email, maxLength, minLength, phone, required, sameAs } from '@/utils/validation';

describe('required', () => {
    it('treats whitespace as an empty field', () => {
        expect(required()('Иван')).toBeNull();
        expect(required()('   ')).toBe('Заполните это поле.');
    });
});

describe('maxLength', () => {
    it('measures the trimmed value', () => {
        expect(maxLength(3)('  abc  ')).toBeNull();
        expect(maxLength(3)('abcd')).toBe('Не длиннее 3 символов.');
    });
});

describe('minLength', () => {
    it('measures the password as typed, spaces included', () => {
        expect(minLength(8)('12345678')).toBeNull();
        expect(minLength(8)('1234567')).toBe('Не короче 8 символов.');
    });
});

describe('email', () => {
    it('asks for a domain with a dot', () => {
        expect(email()('user@example.com')).toBeNull();
        expect(email()('user@localhost')).not.toBeNull();
        expect(email()('user example.com')).not.toBeNull();
        expect(email()('@example.com')).not.toBeNull();
    });
});

describe('phone', () => {
    it('mirrors the server rule', () => {
        expect(phone()('+7 999 123 45 67')).toBeNull();
        expect(phone()('+7 999')).toBe('Введите номер в международном формате: от 8 до 15 цифр.');
    });
});

describe('sameAs', () => {
    it('compares against the value the other field holds right now', () => {
        let confirmed = 'secret';
        const validate = sameAs(() => confirmed, 'validation.passwordMismatch');

        expect(validate('secret')).toBeNull();

        confirmed = 'changed';

        expect(validate('secret')).toBe('Пароли не совпадают.');
    });
});

describe('empty values', () => {
    /** Иначе нетронутое поле показывало бы и «заполните», и «неверный формат». */
    it('pass every rule but required', () => {
        expect(email()('')).toBeNull();
        expect(phone()('')).toBeNull();
        expect(minLength(8)('')).toBeNull();
        expect(maxLength(3)('')).toBeNull();
    });
});

describe('messages', () => {
    it('follow the active locale', async () => {
        await setLocale('en');

        expect(required()('')).toBe('This field is required.');

        await setLocale('ru');
    });
});
