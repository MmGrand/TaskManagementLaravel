# Архитектура фронтенда

## Клади код в существующий слой, а не в новую папку

`resources/js` разложен по ролям, и роль файла определяет его место. Новых папок верхнего уровня не заводить.

```
resources/js/
  api/          модули запросов на ресурс + http.ts + errors.ts
  components/
    ui/         App*-примитивы, ничего не знают о домене
    layout/     оболочка приложения: AppShell, AppNav, UserMenu, LocaleSwitcher
    domain/     компоненты, знающие о сущностях: projects/, tasks/, users/, statistics/
  composables/  use*.ts — переиспользуемая логика с реактивностью
  i18n/         конфиг, определение локали и messages/{ru,en}.ts
  router/       index.ts, routes.ts, guards.ts
  stores/       Pinia setup-сторы
  tests/        setup.ts, fixtures.ts, ui.ts — общие для всех спеков
  types/        api.ts, models.ts, enums.ts
  utils/        чистые функции без реактивности
  views/        страницы *View.vue, сгруппированные по разделу
```

## Направление зависимостей — сверху вниз

`views` → `components` → `composables` → `stores` → `api` → `utils`/`types`. Обратные импорты создают циклы: `http.ts` не импортирует стор, а получает колбэк через `setSessionEndedHandler`, иначе получилось бы `store → api → store`.

Примитивы из `components/ui` не импортируют ни сторы, ни `api`. Исключение — `AppToastHost.vue`, который по назначению рендерит `ui.toasts`.

## Импортируй через алиас `@/`, всегда

Алиас настроен и в `vite.config.js`, и в `tsconfig.json`. Относительных путей в `resources/js` нет ни одного — включая импорты внутри `__tests__/`.

```ts
import AppButton from '@/components/ui/AppButton.vue';
import { useApiForm } from '@/composables/useApiForm';
```

## API-модули импортируй неймспейсом

Они экспортируют одноимённые функции (`list`, `create`, `update`, `remove`) для каждого ресурса, поэтому именованный импорт превратился бы в мешанину алиасов.

```ts
import * as projectsApi from '@/api/projects';
import * as tasksApi from '@/api/tasks';

const page = await projectsApi.list({ status: 'active' });
```

## Страница — это `views/<раздел>/<Имя>View.vue`, подключённая лениво

Каждый маршрут грузится через `() => import(...)`, чтобы бандл делился по экранам. Страница владеет загрузкой данных, состоянием модалок и вызовами API; дочерние компоненты только эмитят события.

## Чистую логику выноси в `utils/`, реактивную — в `composables/`

Если функции не нужны `ref`, `computed` или жизненный цикл — это `utils/` (`format.ts`, `date.ts`, `boardMove.ts`, `taskPayload.ts`, `taskAccess.ts`). Такую функцию легко покрыть unit-тестом без `mount()`, и это ожидаемо: у каждого файла в `utils/` есть спек в `utils/__tests__/`.

Composable — один экспорт-фабрика `useX()` на файл, возвращает объект с состоянием и функциями.

## Имена

- Компоненты — `PascalCase.vue`; примитивы с префиксом `App`, страницы с суффиксом `View`.
- Всё остальное — `camelCase.ts`.
- Спеки — `__tests__/<ИмяСубъекта>.spec.ts` рядом с исходником.
- Файлы правил-зеркал backend'а (`types/enums.ts`, `usePermissions.ts`, `taskPayload.ts`) несут в комментарии ссылку на PHP-источник, который нужно держать в синхроне.
