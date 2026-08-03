import { http } from '@/api/http';
import type { Envelope } from '@/types/api';
import type { Role } from '@/types/models';

/** Без пагинации — эндпоинт возвращает все активные роли в одной обёртке. */
export async function list(): Promise<Role[]> {
    const { data } = await http.get<Envelope<Role[]>>('/roles');

    return data.data;
}
