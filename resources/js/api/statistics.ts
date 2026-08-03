import { http } from '@/api/http';
import type { Statistics } from '@/types/models';

/**
 * Единственный эндпоинт, который не является API resource: StatisticsController
 * возвращает обычный массив, поэтому в теле нет обёртки `data`.
 *
 * Результат отдаётся из `Cache::flexible` с окном ~60 с, поэтому цифры могут
 * отставать от только что успешно выполненной мутации.
 */
export async function summary(): Promise<Statistics> {
    const { data } = await http.get<Statistics>('/statistics');

    return data;
}
