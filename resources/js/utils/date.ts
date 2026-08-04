import { intlLocale } from '@/i18n/locale-state';

export type DatePart = 'day' | 'month' | 'year';

export interface DateFieldFormat {
    parts: DatePart[];
    separator: string;
}

const SAMPLE = new Date(2026, 11, 31);

const FIRST_WEEKDAY = new Date(2026, 0, 5);

const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const GRID_LENGTH = 42;

const PART_WIDTH: Record<DatePart, number> = { day: 2, month: 2, year: 4 };

const PART_MAX: Record<DatePart, number> = { day: 31, month: 12, year: 9999 };

function isDatePart(type: string): type is DatePart {
    return type === 'day' || type === 'month' || type === 'year';
}

export function dateFieldFormat(): DateFieldFormat {
    const formatted = new Intl.DateTimeFormat(intlLocale.value, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).formatToParts(SAMPLE);

    return {
        parts: formatted.map((part) => part.type).filter(isDatePart),
        separator: formatted.find((part) => part.type === 'literal')?.value ?? '.',
    };
}

export function toIsoDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(value: string): Date | null {
    const match = ISO_PATTERN.exec(value.trim());

    if (match === null) {
        return null;
    }

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

    return toIsoDate(date) === value.trim() ? date : null;
}

export function formatDateField(iso: string, format: DateFieldFormat): string {
    const date = fromIsoDate(iso);

    if (date === null) {
        return '';
    }

    const values: Record<DatePart, string> = {
        day: String(date.getDate()).padStart(2, '0'),
        month: String(date.getMonth() + 1).padStart(2, '0'),
        year: String(date.getFullYear()),
    };

    return format.parts.map((part) => values[part]).join(format.separator);
}

export function parseDateField(text: string, format: DateFieldFormat): string | null {
    const chunks = text.split(/\D+/).filter((chunk) => chunk !== '');

    if (chunks.length !== format.parts.length) {
        return null;
    }

    const values: Record<DatePart, string> = { day: '', month: '', year: '' };

    format.parts.forEach((part, index) => {
        values[part] = chunks[index]!;
    });

    if (values.year.length !== 4) {
        return null;
    }

    const iso = `${values.year}-${values.month.padStart(2, '0')}-${values.day.padStart(2, '0')}`;

    return fromIsoDate(iso) === null ? null : iso;
}

function maskDatePart(digits: string, part: DatePart): { text: string; consumed: number } {
    const width = PART_WIDTH[part];
    const max = PART_MAX[part];

    if (part === 'year') {
        return { text: digits.slice(0, width), consumed: Math.min(digits.length, width) };
    }

    if (Number(digits[0]) * 10 > max) {
        return { text: `0${digits[0]}`, consumed: 1 };
    }

    if (digits.length === 1) {
        return { text: digits, consumed: 1 };
    }

    const value = Math.min(Math.max(Number(digits.slice(0, width)), 1), max);

    return { text: String(value).padStart(width, '0'), consumed: width };
}

/**
 * Собирает набранные цифры в дату локального формата: раскладывает их по дню,
 * месяцу и году, сам расставляет разделители и дополняет нулём часть, которая
 * уже не может стать двузначной, — иначе в поле остаётся числовая строка.
 */
export function maskDateField(text: string, format: DateFieldFormat): string {
    let digits = text.replace(/\D/g, '');
    const chunks: string[] = [];

    for (const part of format.parts) {
        if (digits === '') {
            break;
        }

        const masked = maskDatePart(digits, part);

        chunks.push(masked.text);
        digits = digits.slice(masked.consumed);
    }

    return chunks.join(format.separator);
}

export function countDigits(text: string): number {
    return text.replace(/\D/g, '').length;
}

export function caretAfterDigits(text: string, count: number): number {
    if (count === 0) {
        return 0;
    }

    let seen = 0;

    for (let index = 0; index < text.length; index += 1) {
        if (/\d/.test(text[index]!)) {
            seen += 1;

            if (seen === count) {
                return index + 1;
            }
        }
    }

    return text.length;
}

export function monthGrid(year: number, month: number): Date[] {
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;

    return Array.from({ length: GRID_LENGTH }, (_, index) => new Date(year, month, index + 1 - offset));
}

export function weekdayLabels(): string[] {
    const formatter = new Intl.DateTimeFormat(intlLocale.value, { weekday: 'short' });

    return Array.from({ length: 7 }, (_, index) =>
        formatter.format(new Date(2026, 0, FIRST_WEEKDAY.getDate() + index)),
    );
}

export function monthLabel(date: Date): string {
    const month = new Intl.DateTimeFormat(intlLocale.value, { month: 'long' }).format(date);

    return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}
