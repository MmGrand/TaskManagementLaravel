# TypeScript

## Компилятор строгий, и это не обсуждается

`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `isolatedModules`, `verbatimModuleSyntax`. `npm run typecheck` (`vue-tsc --noEmit`) обязан быть зелёным — он же ловит недостающие ключи переводов и несуществующие поля `RouteMeta`.

Не глуши ошибки через `@ts-ignore` и не ослабляй `tsconfig.json`. Если тип не сходится — обычно неверна модель данных, а не компилятор.

## `import type` для всего, что является только типом

При `verbatimModuleSyntax` обычный `import` оставляет рантайм-импорт, и смешивать нельзя.

```ts
import { computed } from 'vue';
import type { ComputedRef } from 'vue';
import type { Project, User } from '@/types/models';
```

## Доменные типы — в `types/`, инлайновых дублей нет

- `types/models.ts` — сущности, зеркало API-ресурсов Laravel.
- `types/api.ts` — обёртки (`Envelope`, `PaginatedEnvelope`, `Page`, `PageMeta`) и `ApiError`.
- `types/enums.ts` — значения и типы строковых enum'ов из `app/Enums`.

Типы, специфичные для одного модуля, живут рядом с ним и экспортируются оттуда: `TaskFilters` — в `api/tasks.ts`, `ManageableTaskPayload` и `TaskFormValues` — в `utils/taskPayload.ts`, `SelectOption` — в `AppSelect.vue`.

## Связи опциональны, но не nullable

API-ресурсы отдают связь только при `whenLoaded`: ключ либо есть, либо отсутствует целиком. Поэтому в моделях `project?: Project`, а не `project: Project | null` — обращаться нужно через optional chaining.

```ts
task.project?.created_by
```

## Enum'ы — массив `as const` плюс производный union

`enum` из TypeScript здесь не используется: `as const`-массив даёт и значения для рендера списков, и тип.

```ts
export const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
```

Добавляя значение на бэкенде, добавь его и сюда, и в `enums.*` обоих файлов локалей. Файл несёт список PHP-источников, которые нужно держать в синхроне.

## `any` не используется; из `catch` приходит `unknown`

Сужай через предикат, а не приведением вслепую. `isApiError(value): value is ApiError` существует именно для этого; в страницах, где ошибка гарантированно прошла интерсептор, допустимо `error as ApiError` — как в существующих `load()`.

```ts
error.value = isApiError(caught) ? caught : { /* ... */ };
```

Для неизвестных структур используется `Record<string, unknown>` с ручной проверкой (`readRecord` в `api/errors.ts`), а не `any`.

## Явные возвращаемые типы у функций

Все экспортируемые и локальные функции их объявляют, включая `: void`. Исключение — фабрики composable'ов и сторов: у них тип выводится из возвращаемого объекта, чтобы не дублировать его руками.

```ts
function fieldError(field: string): string | null { /* ... */ }
function reset(): void { /* ... */ }
```

## Дженерик указывай явно, если вывод расширит тип

```ts
const query = useListQuery<{ status: ProjectStatus | '' }>({ status: '' }, load);
```

Без параметра `''` вывелось бы как `string`, и фильтр перестал бы проверяться.

Там, где нужен доступ по индексу с гарантией непустоты, используется non-null assertion (`items[0]!`) — это осознанный приём в местах, где длина уже проверена.
