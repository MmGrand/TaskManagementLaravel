import { http } from '@/api/http';
import type { Envelope, Page, PaginatedEnvelope } from '@/types/api';
import type { Task } from '@/types/models';
import type { TaskPriority, TaskStatus } from '@/types/enums';
import type { AssigneeTaskPayload, ManageableTaskPayload } from '@/utils/taskPayload';

export type TaskSortField = 'created_at' | 'due_date' | 'position';
export type SortDirection = 'asc' | 'desc';

/** Отражает Task\IndexRequest — всё остальное игнорируется QueryFilter. */
export interface TaskFilters {
    status?: TaskStatus | '';
    priority?: TaskPriority | '';
    project_id?: string;
    assigned_to?: string;
    due_date_from?: string;
    due_date_to?: string;
    created_from?: string;
    created_to?: string;
    sort_by?: TaskSortField | '';
    sort_direction?: SortDirection | '';
    per_page?: number;
    page?: number;
}

export interface TaskMovePayload {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigned_to?: number;
    after_task_id: number | null;
    before_task_id: number | null;
}

const FILTER_KEYS = [
    'status',
    'priority',
    'project_id',
    'assigned_to',
    'due_date_from',
    'due_date_to',
    'created_from',
    'created_to',
    'sort_by',
    'sort_direction',
    'per_page',
] as const;

/**
 * Пустые значения опускаются, а не отправляются как `''`: `project_id=''`
 * споткнётся о правило `integer|exists` и превратит очищенный фильтр в 422.
 */
function toQuery(filters: TaskFilters): Record<string, string | number> {
    const params: Record<string, string | number> = {};

    for (const key of FILTER_KEYS) {
        const value = filters[key];

        if (value !== undefined && value !== '') {
            params[key] = value;
        }
    }

    if (filters.page && filters.page > 1) {
        params.page = filters.page;
    }

    return params;
}

export async function list(filters: TaskFilters = {}): Promise<Page<Task>> {
    const { data } = await http.get<PaginatedEnvelope<Task>>('/tasks', { params: toQuery(filters) });

    return { items: data.data, meta: data.meta };
}

export async function show(id: number): Promise<Task> {
    const { data } = await http.get<Envelope<Task>>(`/tasks/${id}`);

    return data.data;
}

export async function create(payload: ManageableTaskPayload): Promise<Task> {
    const { data } = await http.post<Envelope<Task>>('/tasks', payload);

    return data.data;
}

/** PATCH не предусмотрен: payload — это та полная форма, которую разрешено отправить вызывающему коду. */
export async function update(
    id: number,
    payload: ManageableTaskPayload | AssigneeTaskPayload,
): Promise<Task> {
    const { data } = await http.put<Envelope<Task>>(`/tasks/${id}`, payload);

    return data.data;
}

export async function move(id: number, payload: TaskMovePayload): Promise<Task> {
    const { data } = await http.patch<Envelope<Task>>(`/tasks/${id}/move`, payload);

    return data.data;
}

export async function remove(id: number): Promise<void> {
    await http.delete(`/tasks/${id}`);
}
