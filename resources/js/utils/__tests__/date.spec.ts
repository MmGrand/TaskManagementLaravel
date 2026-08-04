import { describe, expect, it } from 'vitest';
import { setLocale } from '@/i18n';
import {
    caretAfterDigits,
    countDigits,
    dateFieldFormat,
    formatDateField,
    fromIsoDate,
    maskDateField,
    monthGrid,
    monthLabel,
    parseDateField,
    toIsoDate,
    weekdayLabels,
} from '@/utils/date';

describe('dateFieldFormat', () => {
    it('takes the order and the separator from the locale', async () => {
        expect(dateFieldFormat()).toEqual({ parts: ['day', 'month', 'year'], separator: '.' });

        await setLocale('en');

        expect(dateFieldFormat()).toEqual({ parts: ['day', 'month', 'year'], separator: '/' });
    });
});

describe('fromIsoDate', () => {
    it('reads a valid date without shifting the day across time zones', () => {
        const date = fromIsoDate('2026-07-15')!;

        expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 6, 15]);
    });

    it('rejects a date the calendar does not have', () => {
        expect(fromIsoDate('2026-02-31')).toBeNull();
        expect(fromIsoDate('15.07.2026')).toBeNull();
    });
});

describe('formatDateField', () => {
    it('prints the ISO value the way the locale writes it', () => {
        expect(formatDateField('2026-07-05', dateFieldFormat())).toBe('05.07.2026');
    });

    it('prints nothing for an empty or broken value', () => {
        expect(formatDateField('', dateFieldFormat())).toBe('');
        expect(formatDateField('nonsense', dateFieldFormat())).toBe('');
    });
});

describe('parseDateField', () => {
    it('accepts the locale format', () => {
        expect(parseDateField('15.07.2026', dateFieldFormat())).toBe('2026-07-15');
    });

    it('accepts any separator and unpadded numbers', () => {
        expect(parseDateField('5/7/2026', dateFieldFormat())).toBe('2026-07-05');
        expect(parseDateField('5-7-2026', dateFieldFormat())).toBe('2026-07-05');
    });

    it('rejects an incomplete or impossible date', () => {
        expect(parseDateField('15.07', dateFieldFormat())).toBeNull();
        expect(parseDateField('15.07.26', dateFieldFormat())).toBeNull();
        expect(parseDateField('31.02.2026', dateFieldFormat())).toBeNull();
    });

    it('follows the locale order rather than a fixed one', async () => {
        await setLocale('en');

        expect(parseDateField('15/07/2026', dateFieldFormat())).toBe('2026-07-15');
    });
});

describe('maskDateField', () => {
    it('turns a run of digits into a date instead of a number', () => {
        expect(maskDateField('15072026', dateFieldFormat())).toBe('15.07.2026');
    });

    it('inserts the separators while the date is still being typed', () => {
        const format = dateFieldFormat();

        expect(maskDateField('1', format)).toBe('1');
        expect(maskDateField('15', format)).toBe('15');
        expect(maskDateField('150', format)).toBe('15.0');
        expect(maskDateField('1507', format)).toBe('15.07');
        expect(maskDateField('150720', format)).toBe('15.07.20');
    });

    it('pads a day or a month that cannot grow into two digits', () => {
        const format = dateFieldFormat();

        expect(maskDateField('4', format)).toBe('04');
        expect(maskDateField('45', format)).toBe('04.05');
        expect(maskDateField('152', format)).toBe('15.02');
    });

    it('keeps an out of range day or month inside the calendar', () => {
        const format = dateFieldFormat();

        expect(maskDateField('39', format)).toBe('31');
        expect(maskDateField('1519', format)).toBe('15.12');
        expect(maskDateField('0000', format)).toBe('01.01');
    });

    it('ignores whatever separators were typed and never overruns the year', () => {
        const format = dateFieldFormat();

        expect(maskDateField('15/7-2026', format)).toBe('15.07.2026');
        expect(maskDateField('150720261', format)).toBe('15.07.2026');
    });

    it('follows the locale order and separator', async () => {
        await setLocale('en');

        expect(maskDateField('15072026', dateFieldFormat())).toBe('15/07/2026');
    });
});

describe('caret helpers', () => {
    it('counts the digits the caret has already passed', () => {
        expect(countDigits('15.07')).toBe(4);
        expect(countDigits('')).toBe(0);
    });

    it('puts the caret back after the same digit once separators shift', () => {
        expect(caretAfterDigits('15.07.2026', 0)).toBe(0);
        expect(caretAfterDigits('15.07.2026', 2)).toBe(2);
        expect(caretAfterDigits('15.07.2026', 3)).toBe(4);
        expect(caretAfterDigits('15.07.2026', 99)).toBe(10);
    });
});

describe('monthGrid', () => {
    it('always spans six weeks starting on Monday', () => {
        const grid = monthGrid(2026, 6);

        expect(grid).toHaveLength(42);
        expect(grid[0]!.getDay()).toBe(1);
        expect(toIsoDate(grid[0]!)).toBe('2026-06-29');
        expect(toIsoDate(grid[41]!)).toBe('2026-08-09');
    });
});

describe('labels', () => {
    it('translates the weekday row and the month heading', async () => {
        expect(weekdayLabels()[0]).toMatch(/пн/i);
        expect(monthLabel(new Date(2026, 6, 1))).toBe('Июль 2026');

        await setLocale('en');

        expect(weekdayLabels()[0]).toMatch(/mon/i);
        expect(monthLabel(new Date(2026, 6, 1))).toBe('July 2026');
    });
});
