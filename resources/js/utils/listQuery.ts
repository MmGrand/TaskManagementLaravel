/**
 * Общая сериализация фильтров списка в query-параметры: пустые значения и
 * `undefined` опускаются (иначе, например, `project_id=''` споткнётся о
 * правило `integer|exists`), а `page` уходит только начиная со второй, чтобы
 * ссылка на первую страницу оставалась короткой.
 */
export function buildListQuery<F extends { page?: number }>(
    filters: F,
    keys: readonly (keyof Omit<F, 'page'>)[],
): Record<string, string | number> {
    const params: Record<string, string | number> = {};

    for (const key of keys) {
        const value = filters[key];

        if (value !== undefined && value !== '') {
            params[key as string] = value as string | number;
        }
    }

    if (filters.page !== undefined && filters.page > 1) {
        params.page = filters.page;
    }

    return params;
}
