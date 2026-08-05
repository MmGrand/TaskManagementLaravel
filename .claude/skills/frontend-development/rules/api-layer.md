# API-слой

## Все запросы идут через единственный инстанс из `@/api/http`

`axios.create({ baseURL: '/api', headers: { Accept: 'application/json' } })`. Заголовок `Accept` обязателен: без него Laravel редиректит неавторизованного гостя вместо того, чтобы вернуть JSON-контракт ошибки. Прямых вызовов `axios` вне `http.ts` нет и быть не должно.

## Токен подставляет интерсептор

Request-интерсептор читает bearer-токен Sanctum через `readToken()` из `@/utils/tokenStorage`. Не передавай `Authorization` вручную и не таскай токен через пропы.

## Из HTTP-слоя вылетает только `ApiError`

Response-интерсептор прогоняет любую ошибку через `normalizeError` и реджектит нормализованный объект. Значит, в `catch` не бывает `AxiosError` — приведение `error as ApiError` в страницах корректно, а `axios.isAxiosError` не нужен нигде.

`normalizeError` читает ошибку структурно, а не через `axios.isAxiosError`, — чтобы тесты могли кидать обычные объекты и ни один модуль, кроме `http.ts`, не знал о существовании axios.

## Ветвись по флагам `ApiError`, а не по статус-кодам

```ts
export interface ApiError {
    status: number;              // 0 = ответа не было вовсе
    message: string;
    errors: Record<string, string[]>;
    isValidation: boolean;       // 422
    isUnauthenticated: boolean;  // 401
    isForbidden: boolean;        // 403
    isNotFound: boolean;         // 404
    isThrottled: boolean;        // 429
    isNetwork: boolean;
    isAccountDisabled: boolean;  // 403 + известный префикс сообщения
    retryAfter: number | null;   // разобранный Retry-After, в секундах
}
```

`isAccountDisabled` отделяет «сессия мертва» от «это действие запрещено» и определяется по префиксу `Аккаунт недоступен`, который бэкенд отдаёт по-русски независимо от языка UI. Строка намеренно не переведена — вынесение её в локали сломало бы проверку. См. комментарий в `api/errors.ts`.

Сообщение берётся из тела ответа, а при пустом теле — из ключа `errors.*` в локали. Тексты по умолчанию отражают обработчики из `bootstrap/app.php`, чтобы UI говорил то же, что API.

## Реакция на завершённую сессию — через колбэк, не через импорт стора

```ts
setSessionEndedHandler((error) => { /* auth-стор чистит токен и редиректит */ });
```

Прямой импорт Pinia в `http.ts` создал бы цикл `store → api → store`.

## Модуль на ресурс: `list`, `show`, `create`, `update`, `remove`

Функции разворачивают обёртки Laravel и возвращают доменные типы, а не `AxiosResponse`. `Envelope<T>` → `T`, `PaginatedEnvelope<T>` → `Page<T>` (`{ items, meta }`).

```ts
export async function list(filters: TaskFilters = {}): Promise<Page<Task>> {
    const { data } = await http.get<PaginatedEnvelope<Task>>('/tasks', { params: toQuery(filters) });

    return { items: data.data, meta: data.meta };
}

export async function show(id: number): Promise<Task> {
    const { data } = await http.get<Envelope<Task>>(`/tasks/${id}`);

    return data.data;
}
```

Нестандартные действия называются по операции (`move` для `PATCH /tasks/{id}/move`), а не `patchTask`.

## Интерфейс фильтров зеркалит FormRequest, пустые значения выбрасываются

Список разрешённых ключей — константа `FILTER_KEYS`; `toQuery` опускает `undefined` и `''`. Отправка `project_id=''` споткнулась бы о правило `integer|exists` и превратила очищенный фильтр в 422. `page` уходит только начиная со второй.

```ts
function toQuery(filters: TaskFilters): Record<string, string | number> {
    const params: Record<string, string | number> = {};

    for (const key of FILTER_KEYS) {
        const value = filters[key];

        if (value !== undefined && value !== '') {
            params[key] = value;
        }
    }

    return params;
}
```

Добавляя фильтр: расширь интерфейс, добавь ключ в `FILTER_KEYS`, сверься с соответствующим `app/Http/Requests/**/IndexRequest.php` — всё, чего там нет, отбросит `QueryFilter`.

## PUT — полная замена

`update` принимает целый payload, а не диф: серверные правила помечают поля как `required`, поэтому частичное тело провалит валидацию. Payload собирают билдеры из `utils/*Payload.ts` (см. `forms.md`).
