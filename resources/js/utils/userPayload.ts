import { i18n } from '@/i18n';
import type { UserStatus } from '@/types/enums';

export interface UserFormValues {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    status: UserStatus;
    role_id: string;
    current_password: string;
}

/** Присутствуют всегда; `status` и `role_id` — только если вызывающему разрешено их менять. */
export interface UserPayload {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    status?: UserStatus;
    role_id?: number;
    current_password?: string;
}

/** Тело для PUT /api/users/{user}/password. */
export interface PasswordPayload {
    current_password: string;
    password: string;
    password_confirmation: string;
}

/**
 * Собирает тело для PUT|POST /api/users/{user}.
 *
 * `status` и `role_id` объявлены `prohibited` для всех без `users.update`, а
 * Laravel отклоняет запрещённое поле при любом наличии ключа — отправки
 * `undefined` или `''` недостаточно, поэтому ключи полностью опускаются.
 *
 * @see app/Http/Requests/User/UpdateRequest.php
 */
export function buildUserPayload(values: UserFormValues, canManageUsers: boolean): UserPayload {
    const payload: UserPayload = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
    };

    if (canManageUsers) {
        payload.status = values.status;

        if (values.role_id !== '') {
            payload.role_id = Number(values.role_id);
        }
    }

    // Сервер требует его только при смене email, поэтому пустое поле не отправляется.
    if (values.current_password !== '') {
        payload.current_password = values.current_password;
    }

    return payload;
}

/**
 * PHP не разбирает multipart-тело в PUT, поэтому маршрут также принимает
 * POST. Всё приводится к строке, так как FormData не хранит типы.
 */
export function toFormData(payload: UserPayload, avatar: File): FormData {
    const data = new FormData();

    for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined) {
            data.append(key, String(value));
        }
    }

    data.append('avatar', avatar);

    return data;
}

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** Отражает `nullable|image|max:2048`, чтобы пользователь узнал об этом до загрузки. */
export function validateAvatar(file: File): string | null {
    if (!file.type.startsWith('image/')) {
        return i18n.global.t('validation.avatarImage');
    }

    if (file.size > MAX_AVATAR_BYTES) {
        return i18n.global.t('validation.avatarSize');
    }

    return null;
}
