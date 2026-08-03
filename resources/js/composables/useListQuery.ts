import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { LocationQueryRaw } from 'vue-router';

/**
 * Хранит фильтры списка и номер страницы в query-параметрах URL.
 *
 * Бэкенд пагинирует через `withQueryString()`, поэтому дублирование фильтров
 * в URL — это то, что синхронизирует обновление страницы, прямые ссылки и
 * кнопку "назад" браузера с собственным представлением списка на сервере.
 *
 * `per_page` намеренно никогда не отправляется: репозитории захардкожены на
 * 15 и игнорируют этот параметр.
 */
export function useListQuery<F extends Record<string, string>>(defaults: F, load: () => Promise<void>) {
    const route = useRoute();
    const router = useRouter();

    const filters = reactive({ ...defaults }) as F;
    const page = ref(1);

    function readFromRoute(): void {
        for (const key of Object.keys(defaults) as (keyof F)[]) {
            const value = route.query[key as string];

            filters[key] = (typeof value === 'string' ? value : defaults[key]) as F[keyof F];
        }

        const rawPage = Number(route.query.page);

        page.value = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    }

    /** В URL попадают только значения, отличные от дефолтных — чтобы он оставался читаемым. */
    function toQuery(): LocationQueryRaw {
        const query: LocationQueryRaw = {};

        for (const key of Object.keys(defaults) as (keyof F)[]) {
            if (filters[key] !== defaults[key]) {
                query[key as string] = filters[key];
            }
        }

        if (page.value > 1) {
            query.page = String(page.value);
        }

        return query;
    }

    /** Изменение фильтра всегда возвращает на первую страницу. */
    function applyFilters(): void {
        page.value = 1;
        void router.push({ query: toQuery() });
    }

    function goToPage(next: number): void {
        page.value = next;
        void router.push({ query: toQuery() });
    }

    function resetFilters(): void {
        Object.assign(filters, defaults);
        applyFilters();
    }

    watch(
        () => route.query,
        () => {
            readFromRoute();
            void load();
        },
    );

    onMounted(() => {
        readFromRoute();
        void load();
    });

    return { filters, page, applyFilters, goToPage, resetFilters };
}
