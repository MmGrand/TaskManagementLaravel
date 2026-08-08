import { http } from '@/api/http';
import type { Envelope } from '@/types/api';
import type { User } from '@/types/models';

export interface Credentials {
    email: string;
    password: string;
}

export interface RegistrationPayload {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
}

export interface AuthResult {
    user: User;
    token: string;
}

/**
 * Login и register — единственное место, где API НЕ оборачивает ответ в `data`:
 * тело — это `{user, token}`. AuthController сразу подгружает роль, поэтому
 * возвращённый здесь пользователь уже несёт свои разрешения.
 */
interface AuthResponseBody {
    user: User;
    token: string;
}

export async function login(credentials: Credentials): Promise<AuthResult> {
    const { data } = await http.post<AuthResponseBody>('/login', credentials);

    return { user: data.user, token: data.token };
}

export async function register(payload: RegistrationPayload): Promise<AuthResult> {
    const { data } = await http.post<AuthResponseBody>('/register', payload);

    return { user: data.user, token: data.token };
}

export async function logout(): Promise<void> {
    await http.post('/logout');
}

export async function fetchCurrentUser(): Promise<User> {
    const { data } = await http.get<Envelope<User>>('/user');

    return data.data;
}
