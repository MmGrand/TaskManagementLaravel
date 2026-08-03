/** Обёртка `{"data": ...}`, которую по умолчанию применяют Laravel API resources. */
export interface Envelope<T> {
    data: T;
}

export interface PageMeta {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface PageLinks {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
}

/** Сырая обёртка постраничной коллекции ресурсов. */
export interface PaginatedEnvelope<T> {
    data: T[];
    links: PageLinks;
    meta: PageMeta;
}

/** То, что модули api/* возвращают в сторы и views. */
export interface Page<T> {
    items: T[];
    meta: PageMeta;
}

export interface ApiError {
    /** 0 означает, что запрос не получил ответа вовсе. */
    status: number;
    message: string;
    errors: Record<string, string[]>;
    isValidation: boolean;
    isUnauthenticated: boolean;
    isForbidden: boolean;
    isNotFound: boolean;
    isThrottled: boolean;
    isNetwork: boolean;
    /** Заблокирован сам аккаунт, а не запрещено конкретное действие. */
    isAccountDisabled: boolean;
    /** Разобранный заголовок Retry-After, в секундах. */
    retryAfter: number | null;
}
