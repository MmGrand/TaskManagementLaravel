import { http } from '@/api/http';
import type { Envelope, Page, PaginatedEnvelope } from '@/types/api';
import type { AssignableUser, User } from '@/types/models';
import { toFormData, type PasswordPayload, type UserPayload } from '@/utils/userPayload';

export async function list(page = 1): Promise<Page<User>> {
    const { data } = await http.get<PaginatedEnvelope<User>>('/users', { params: { page } });

    return { items: data.data, meta: data.meta };
}

export async function listAssignable(page = 1): Promise<Page<AssignableUser>> {
    const { data } = await http.get<PaginatedEnvelope<AssignableUser>>('/users/assignable', {
        params: { page },
    });

    return { items: data.data, meta: data.meta };
}

export async function show(id: number): Promise<User> {
    const { data } = await http.get<Envelope<User>>(`/users/${id}`);

    return data.data;
}

export async function update(id: number, payload: UserPayload): Promise<User> {
    const { data } = await http.put<Envelope<User>>(`/users/${id}`, payload);

    return data.data;
}

/**
 * POST, а не PUT: PHP не заполняет `$_FILES` для тела PUT-запроса, поэтому
 * маршрут зарегистрирован для обоих методов, а путь загрузки использует POST.
 */
export async function updateWithAvatar(id: number, payload: UserPayload, avatar: File): Promise<User> {
    const { data } = await http.post<Envelope<User>>(`/users/${id}`, toFormData(payload, avatar));

    return data.data;
}

/** Выбирает нужный метод и форму тела запроса под текущее состояние формы. */
export function save(id: number, payload: UserPayload, avatar: File | null): Promise<User> {
    return avatar === null ? update(id, payload) : updateWithAvatar(id, payload, avatar);
}

export async function changePassword(id: number, payload: PasswordPayload): Promise<void> {
    await http.put(`/users/${id}/password`, payload);
}
