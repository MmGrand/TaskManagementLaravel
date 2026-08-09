import { describe, expect, it } from 'vitest';
import { caretAfterDigits, countDigits } from '@/utils/caret';

describe('countDigits', () => {
    it('counts the digits the caret has already passed', () => {
        expect(countDigits('15.07')).toBe(4);
        expect(countDigits('')).toBe(0);
    });
});

describe('caretAfterDigits', () => {
    it('puts the caret back after the same digit once separators shift', () => {
        expect(caretAfterDigits('15.07.2026', 0)).toBe(0);
        expect(caretAfterDigits('15.07.2026', 2)).toBe(2);
        expect(caretAfterDigits('15.07.2026', 3)).toBe(4);
        expect(caretAfterDigits('15.07.2026', 99)).toBe(10);
    });

    it('works for any mask, not only dates', () => {
        expect(caretAfterDigits('+7 999 123 45 67', 1)).toBe(2);
        expect(caretAfterDigits('+7 999 123 45 67', 4)).toBe(6);
    });
});
