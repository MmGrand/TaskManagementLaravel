import { http } from '@/api/http';
import type { Envelope, Page, PaginatedEnvelope } from '@/types/api';
import type { Project } from '@/types/models';
import type { ProjectStatus } from '@/types/enums';
import { buildListQuery } from '@/utils/listQuery';

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

const FILTER_KEYS = ['status'] as const;

function toQuery(filters: ProjectFilters): Record<string, string | number> {
    return buildListQuery(filters, FILTER_KEYS);
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
