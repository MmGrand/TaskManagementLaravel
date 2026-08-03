import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import en from '@/i18n/messages/en';
import ru from '@/i18n/messages/ru';

type Messages = Record<string, unknown>;

function flatten(messages: Messages, prefix = ''): Record<string, string> {
    const flat: Record<string, string> = {};

    for (const [key, value] of Object.entries(messages)) {
        const path = prefix === '' ? key : `${prefix}.${key}`;

        if (typeof value === 'string') {
            flat[path] = value;
        } else if (typeof value === 'object' && value !== null) {
            Object.assign(flat, flatten(value as Messages, path));
        }
    }

    return flat;
}

const flatRu = flatten(ru);
const flatEn = flatten(en as unknown as Messages);

describe('locale parity', () => {
    /**
     * Аннотация типа в en.ts уже ловит недостающие ключи на компиляции. Здесь
     * проверяется то, чего типы не видят: пустые строки и непереведённые
     * копии русского текста.
     */
    it('exposes exactly the same keys in both locales', () => {
        expect(Object.keys(flatEn).sort()).toEqual(Object.keys(flatRu).sort());
    });

    it('leaves no value empty', () => {
        for (const [key, value] of Object.entries({ ...flatRu, ...flatEn })) {
            expect(value.trim(), key).not.toBe('');
        }
    });

    it('has no Cyrillic left in the English locale', () => {
        for (const [key, value] of Object.entries(flatEn)) {
            expect(/[а-яё]/i.test(value), `${key} is still Russian`).toBe(false);
        }
    });

    /** `@` и `|` управляют связанными сообщениями и плюрализацией в vue-i18n. */
    it('keeps the reserved characters out of plain text', () => {
        for (const [key, value] of Object.entries(flatRu)) {
            expect(value.includes('@'), key).toBe(false);
            expect(value.includes('|'), key).toBe(false);
        }
    });

    it('gives every plural form of a message the same placeholders', () => {
        for (const [key, value] of Object.entries(flatEn)) {
            const forms = value.split('|');

            if (forms.length > 1) {
                const placeholders = forms.map((form) => [...form.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort());

                for (const set of placeholders) {
                    expect(set, key).toEqual(placeholders[0]);
                }
            }
        }
    });
});

/**
 * Заменяет проверку типов, которую vue-i18n дать не может: все перегрузки
 * `t` объявлены как `key: Key | ResourceKeys`, где `Key extends string`,
 * поэтому опечатка в ключе компилируется молча и всплывает уже в UI.
 */
describe('keys used in the source', () => {
    // process.cwd(), а не import.meta.url: под jsdom это не file:-URL.
    const root = join(process.cwd(), 'resources', 'js');

    const KEY_PATTERNS = [
        /(?<![\w$.])\$?t\(\s*'([\w.]+)'/g, // t('...') и $t('...')
        /\b(?:titleKey|labelKey):\s*'([\w.]+)'/g, // ключи в routes.ts и AppNav.vue
    ];

    /** Собственный обход вместо glob-пакета: лишняя зависимость ради теста не нужна. */
    function sourceFiles(dir: string, base = ''): string[] {
        return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
            const relative = base === '' ? entry.name : `${base}/${entry.name}`;

            if (entry.isDirectory()) {
                return entry.name === '__tests__' || entry.name === 'tests'
                    ? []
                    : sourceFiles(join(dir, entry.name), relative);
            }

            return /\.(ts|vue)$/.test(entry.name) ? [relative] : [];
        });
    }

    const files = sourceFiles(root).filter((file) => !file.startsWith('i18n/messages/'));

    function keysIn(file: string, pattern: RegExp): string[] {
        return [...readFileSync(join(root, file), 'utf8').matchAll(pattern)].map((match) => match[1]!);
    }

    it('resolves every literal translation key against the ru catalogue', () => {
        const missing = files.flatMap((file) =>
            KEY_PATTERNS.flatMap((pattern) =>
                keysIn(file, pattern)
                    .filter((key) => !(key in flatRu))
                    .map((key) => `${file}: ${key}`),
            ),
        );

        expect(missing).toEqual([]);
    });

    it('actually finds keys, so a broken scan cannot pass silently', () => {
        expect(files.length).toBeGreaterThan(40);

        const found = files.flatMap((file) => keysIn(file, KEY_PATTERNS[0]!));

        expect(found.length).toBeGreaterThan(100);
    });
});
