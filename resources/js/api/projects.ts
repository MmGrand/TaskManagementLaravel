import { http } from '@/api/http';
import type { Envelope, Page, PaginatedEnvelope } from '@/types/api';
import type { Project } from '@/types/models';
import type { ProjectStatus } from '@/types/enums';

export interface ProjectFilters {
    status?: ProjectStatus | '';
    page?: number;
}

/**
 * Полный payload при каждой записи: API предоставляет только PUT, а `name`
 * там `required`, поэтому частичное обновление стёрло бы поля.
 */
export interface ProjectPayload {
    name: string;
    description: string | null;
    status: ProjectStatus;
}

/** Пустые фильтры отбрасываются: бэкенд и так считает `?status=` отсутствующим. */
function toQuery(filters: ProjectFilters): Record<string, string | number> {
    const params: Record<string, string | number> = {};

    if (filters.status) {
        params.status = filters.status;
    }

    if (filters.page && filters.page > 1) {
        params.page = filters.page;
    }

    return params;
}

export async function list(filters: ProjectFilters = {}): Promise<Page<Project>> {
    const { data } = await http.get<PaginatedEnvelope<Project>>('/projects', { params: toQuery(filters) });

    return { items: data.data, meta: data.meta };
}

export async function show(id: number): Promise<Project> {
    const { data } = await http.get<Envelope<Project>>(`/projects/${id}`);

    return data.data;
}

export async function create(payload: ProjectPayload): Promise<Project> {
    const { data } = await http.post<Envelope<Project>>('/projects', payload);

    return data.data;
}

export async function update(id: number, payload: ProjectPayload): Promise<Project> {
    const { data } = await http.put<Envelope<Project>>(`/projects/${id}`, payload);

    return data.data;
}

export async function remove(id: number): Promise<void> {
    await http.delete(`/projects/${id}`);
}
