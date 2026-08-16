export const PHONE_MIN_DIGITS = 8;
export const PHONE_MAX_DIGITS = 15;

const GROUPS: Record<string, number[]> = {
    '1': [3, 3, 4],
    '7': [3, 3, 2, 2],
    '375': [2, 3, 2, 2],
    '380': [2, 3, 2, 2],
    '994': [2, 3, 2, 2],
    '996': [3, 3, 3],
    '998': [2, 3, 2, 2],
};

const FALLBACK_GROUPS = [3, 3, 3, 3];

const SEPARATOR = ' ';

function splitCountryCode(digits: string): { code: string; groups: number[] } {
    for (const length of [3, 2, 1]) {
        const code = digits.slice(0, length);
        const groups = code.length === length ? GROUPS[code] : undefined;

        if (groups !== undefined) {
            return { code, groups };
        }
    }

    return { code: digits.slice(0, 1), groups: FALLBACK_GROUPS };
}

export function phoneDigits(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, PHONE_MAX_DIGITS);

    return digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
}

export function maskPhone(value: string): string {
    const digits = phoneDigits(value);

    if (digits === '') {
        return value.trim() === '' ? '' : '+';
    }

    const { code, groups } = splitCountryCode(digits);
    const chunks = [`+${code}`];

    let rest = digits.slice(code.length);

    for (const size of groups) {
        if (rest === '') {
            break;
        }

        chunks.push(rest.slice(0, size));
        rest = rest.slice(size);
    }

    if (rest !== '') {
        chunks.push(rest);
    }

    return chunks.join(SEPARATOR);
}

/**
 * Хранимая форма — E.164 без разделителей, чтобы один и тот же номер не попадал
 * в базу в нескольких написаниях.
 */
export function normalizePhone(value: string): string {
    const digits = phoneDigits(value);

    return digits === '' ? '' : `+${digits}`;
}

/**
 * Отражает правило `regex` из UpdateRequest и AuthController: код страны не
 * начинается с нуля, всего 8–15 цифр.
 */
export function isValidPhone(value: string): boolean {
    return /^[1-9]\d{7,14}$/.test(value.replace(/\D/g, ''));
}
