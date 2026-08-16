import { describe, expect, it } from 'vitest';
import { isValidPhone, maskPhone, normalizePhone, phoneDigits } from '@/utils/phone';

describe('phoneDigits', () => {
    it('keeps only digits and never exceeds the E.164 length', () => {
        expect(phoneDigits('+7 (999) 123-45-67')).toBe('79991234567');
        expect(phoneDigits('телефон')).toBe('');
        expect(phoneDigits('1'.repeat(30))).toHaveLength(15);
    });

    it('treats a leading trunk "8" as the +7 country code', () => {
        expect(phoneDigits('89991234567')).toBe('79991234567');
        expect(phoneDigits('8 (999) 123-45-67')).toBe('79991234567');
    });
});

describe('maskPhone', () => {
    it('groups a Russian number the way it is usually written', () => {
        expect(maskPhone('79991234567')).toBe('+7 999 123 45 67');
        expect(maskPhone('+7 999 123 45 67')).toBe('+7 999 123 45 67');
    });

    it('uses the North American grouping for the +1 code', () => {
        expect(maskPhone('+12488628415')).toBe('+1 248 862 8415');
    });

    it('falls back to triples for a code it does not know', () => {
        expect(maskPhone('+491701234567')).toBe('+4 917 012 345 67');
    });

    it('formats what has been typed so far', () => {
        expect(maskPhone('7')).toBe('+7');
        expect(maskPhone('7999')).toBe('+7 999');
        expect(maskPhone('799912')).toBe('+7 999 12');
    });

    it('drops everything that is not a digit, so a pasted number still fits', () => {
        expect(maskPhone('tel: +7-999-123-45-67')).toBe('+7 999 123 45 67');
    });

    it('normalizes a trunk-prefixed Russian number to +7', () => {
        expect(maskPhone('8 (999) 123-45-67')).toBe('+7 999 123 45 67');
    });

    it('leaves an empty field empty but keeps a lone plus visible', () => {
        expect(maskPhone('')).toBe('');
        expect(maskPhone('+')).toBe('+');
    });
});

describe('normalizePhone', () => {
    it('strips the grouping down to what the server stores', () => {
        expect(normalizePhone('+7 999 123 45 67')).toBe('+79991234567');
        expect(normalizePhone('')).toBe('');
    });

    it('stores a trunk-prefixed number under the +7 code, not +8', () => {
        expect(normalizePhone('89991234567')).toBe('+79991234567');
    });
});

describe('isValidPhone', () => {
    it('accepts a number of a plausible international length', () => {
        expect(isValidPhone('+7 999 123 45 67')).toBe(true);
        expect(isValidPhone('+1 248 862 8415')).toBe(true);
        expect(isValidPhone('+41 44 668 18 00')).toBe(true);
    });

    it('rejects what the server rejects too', () => {
        expect(isValidPhone('')).toBe(false);
        expect(isValidPhone('+7 999')).toBe(false);
        expect(isValidPhone('+0 999 123 45 67')).toBe(false);
        expect(isValidPhone('+7 999 123 45 67 89 012')).toBe(false);
    });
});
