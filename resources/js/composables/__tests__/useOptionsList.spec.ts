import { describe, expect, it, vi } from 'vitest';
import { useOptionsList } from '@/composables/useOptionsList';
import { makePage } from '@/tests/fixtures';
import type { Page } from '@/types/api';

interface Item {
    id: number;
    name: string;
}

function toOption(item: Item) {
    return { value: String(item.id), label: item.name };
}

describe('useOptionsList', () => {
    it('collects options across pages until the last one', async () => {
        const fetchPage = vi
            .fn<(page: number) => Promise<Page<Item>>>()
            .mockResolvedValueOnce(makePage([{ id: 1, name: 'Один' }], { last_page: 2, current_page: 1 }))
            .mockResolvedValueOnce(makePage([{ id: 2, name: 'Два' }], { last_page: 2, current_page: 2 }));

        const list = useOptionsList(fetchPage, toOption);
        await list.load();

        expect(list.options.value).toEqual([
            { value: '1', label: 'Один' },
            { value: '2', label: 'Два' },
        ]);
        expect(list.truncated.value).toBe(false);
        expect(list.failed.value).toBe(false);
    });

    it('discards a stale response instead of overwriting a newer one', async () => {
        let resolveFirst: (page: Page<Item>) => void = () => {};
        const fetchPage = vi
            .fn<(page: number) => Promise<Page<Item>>>()
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirst = resolve;
                    }),
            )
            .mockResolvedValueOnce(makePage([{ id: 2, name: 'Свежий' }]));

        const list = useOptionsList(fetchPage, toOption);

        const first = list.load();
        const second = list.load();

        resolveFirst(makePage([{ id: 1, name: 'Устаревший' }]));
        await first;
        await second;

        expect(list.options.value).toEqual([{ value: '2', label: 'Свежий' }]);
    });

    it('marks a genuine failure without leaking a stale success into it', async () => {
        let resolveFirst: (page: Page<Item>) => void = () => {};
        const fetchPage = vi
            .fn<(page: number) => Promise<Page<Item>>>()
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirst = resolve;
                    }),
            )
            .mockRejectedValueOnce({ status: 500, message: 'Внутренняя ошибка сервера.' });

        const list = useOptionsList(fetchPage, toOption);

        const first = list.load();
        const second = list.load();

        resolveFirst(makePage([{ id: 1, name: 'Устаревший' }]));
        await first;
        await second;

        expect(list.failed.value).toBe(true);
        expect(list.options.value).toEqual([]);
    });

    it('keeps the underlying error so callers can tell a 403 apart from a real failure', async () => {
        const list = useOptionsList(
            vi
                .fn<(page: number) => Promise<Page<Item>>>()
                .mockRejectedValue({ status: 500, message: 'Внутренняя ошибка сервера.', isForbidden: false }),
            toOption,
        );

        await list.load();

        expect(list.failed.value).toBe(true);
        expect(list.error.value).toMatchObject({ isForbidden: false, message: 'Внутренняя ошибка сервера.' });
    });
});
