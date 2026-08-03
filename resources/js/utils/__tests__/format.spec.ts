import { describe, expect, it } from 'vitest';
import { setLocale } from '@/i18n';
import { formatDate, formatDateTime, fullName, initials } from '@/utils/format';
import { makeUser } from '@/tests/fixtures';

describe('formatDate', () => {
    it('renders an API date as dd.MM.yyyy', () => {
        expect(formatDate('2026-07-15')).toBe('15.07.2026');
    });

    it('renders a dash for a missing date', () => {
        expect(formatDate(null)).toBe('—');
        expect(formatDate(undefined)).toBe('—');
    });

    it('passes unparseable input through unchanged', () => {
        expect(formatDate('не дата')).toBe('не дата');
    });

    /** Локаль читается из реактивного intlLocale, поэтому дата следует за языком. */
    it('reformats for the active locale', async () => {
        await setLocale('en');

        expect(formatDate('2026-07-15')).toBe('15/07/2026');
        expect(formatDateTime('2026-07-15T10:30:00Z')).toContain('15/07/2026');
    });
});

describe('fullName / initials', () => {
    it('joins the name parts', () => {
        expect(fullName(makeUser({ first_name: 'Иван', last_name: 'Петров' }))).toBe('Иван Петров');
        expect(initials(makeUser({ first_name: 'Иван', last_name: 'Петров' }))).toBe('ИП');
    });

    it('degrades gracefully without a user', () => {
        expect(fullName(null)).toBe('—');
        expect(initials(null)).toBe('?');
    });
});
