import { ref } from 'vue';
import type { SelectOption } from '@/components/ui/AppSelect.vue';
import type { ApiError, Page } from '@/types/api';

const MAX_PAGES = 5;

export function useOptionsList<T>(
    fetchPage: (page: number) => Promise<Page<T>>,
    toOption: (item: T) => SelectOption,
) {
    const options = ref<SelectOption[]>([]);
    const loading = ref(false);
    const truncated = ref(false);
    const failed = ref(false);
    const error = ref<ApiError | null>(null);

    let loadToken = 0;

    async function load(): Promise<void> {
        const token = ++loadToken;

        loading.value = true;
        failed.value = false;
        truncated.value = false;
        error.value = null;

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
        } catch (caught) {
            if (token !== loadToken) {
                return;
            }

            failed.value = true;
            options.value = [];
            error.value = caught as ApiError;
        } finally {
            if (token === loadToken) {
                loading.value = false;
            }
        }
    }

    return { options, loading, truncated, failed, error, load };
}
