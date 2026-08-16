import { ref } from 'vue';
import type { Page } from '@/types/api';
import type { SelectOption } from '@/components/ui/AppSelect.vue';

/** 5 страниц по 15 строк — у API нет эндпоинта поиска, и `per_page` игнорируется. */
const MAX_PAGES = 5;

/**
 * Заполняет select данными с постраничного эндпоинта.
 *
 * Размер страницы захардкожен на бэкенде в 15, и `?search=` не существует,
 * поэтому единственный способ наполнить список — пройти по страницам.
 * Ограничение не даёт большому набору данных вызвать десятки запросов;
 * `truncated` позволяет UI сообщить об этом.
 */
export function useOptionsList<T>(
    fetchPage: (page: number) => Promise<Page<T>>,
    toOption: (item: T) => SelectOption,
) {
    const options = ref<SelectOption[]>([]);
    const loading = ref(false);
    const truncated = ref(false);
    const failed = ref(false);

    let loadToken = 0;

    async function load(): Promise<void> {
        const token = ++loadToken;

        loading.value = true;
        failed.value = false;
        truncated.value = false;

        const collected: SelectOption[] = [];

        try {
            let currentPage = 1;
            let lastPage = 1;

            do {
                const page = await fetchPage(currentPage);

                collected.push(...page.items.map(toOption));
                lastPage = page.meta.last_page;
                currentPage += 1;
            } while (currentPage <= lastPage && currentPage <= MAX_PAGES);

            if (token !== loadToken) {
                return;
            }

            truncated.value = lastPage > MAX_PAGES;
            options.value = collected;
        } catch {
            // 403 здесь — норма: обычный пользователь не может получить список
            // пользователей. Вызывающий код покажет пустое/отключённое состояние, а не ошибку.
            if (token === loadToken) {
                failed.value = true;
                options.value = [];
            }
        } finally {
            if (token === loadToken) {
                loading.value = false;
            }
        }
    }

    return { options, loading, truncated, failed, load };
}
