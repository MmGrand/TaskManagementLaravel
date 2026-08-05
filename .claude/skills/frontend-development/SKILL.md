---
name: frontend-development
description: "Apply this skill whenever writing, reviewing, or refactoring frontend code in this application. This includes Vue single-file components, composables, Pinia stores, the axios API layer, vue-router routes and guards, vue-i18n messages, Tailwind markup, TypeScript types, and Vitest specs — everything under resources/js and resources/css. Triggers for adding a screen, a form, a list filter, an API call, a UI primitive, a translation key, or a frontend test, and for reviewing or debugging existing frontend code."
---

# Frontend Development

Конвенции фронтенда этого приложения, оформленные как индекс файлов правил. Каждый файл объясняет, что делать и почему. За синтаксисом Tailwind v4 — скилл `tailwindcss-development`; за backend-контрактами — `laravel-best-practices`.

## Стек

Vue 3 (`<script setup>`, Composition API) + TypeScript в strict-режиме. SPA целиком на клиенте: Laravel отдаёт единственный blade-шаблон `resources/views/app.blade.php`, всё остальное — `resources/js`.

| Слой | Чем сделано |
| --- | --- |
| Роутинг | vue-router 4, ленивые компоненты, guard'ы по meta |
| Состояние | Pinia 4, только setup-сторы (`auth`, `ui`, `locale`) |
| HTTP | axios, один инстанс с интерсепторами, токены Sanctum |
| Локализация | vue-i18n 11, русский первичный, английский лениво |
| Стили | Tailwind CSS v4 CSS-first, конфиг-файла нет |
| Сборка | Vite 8 + `@vitejs/plugin-vue` + `laravel-vite-plugin` |
| Тесты | Vitest 4 + jsdom + `@vue/test-utils` |
| Прочее | vue-draggable-plus (только доска задач) |

Чего здесь **нет**: Inertia, Livewire, Alpine, UI-библиотеки, стейт-менеджера кроме Pinia, ESLint/Prettier. 21 UI-примитив в `components/ui` написан вручную — включая `AppSelect`, который является кастомным combobox, а не нативным `<select>`.

## Consistency First

Прежде чем применять любое правило, посмотри, как уже сделано рядом. Соседний компонент, соседний модуль `api/`, соседний спек — сильнее любого правила ниже. Правила описывают дефолт для случаев, когда паттерна ещё нет, и не являются поводом переписывать работающий код.

Если приходится отступить от правила ради корректности — сделай это и назови отступление явно.

## How to Apply

1. Сопоставь задачу с индексом ниже. Кросс-задачи почти всегда затрагивают несколько файлов правил: новая форма — это `forms` + `components` + `i18n` + `testing`.
2. Прочитай сопоставленные файлы правил до правки. Несвязанные — пропусти.
3. Открой файл-образец, на который ссылается правило, и следуй ему, а не пересказу.
4. Сделай минимальное связное изменение. Не заводи второй способ делать то, что уже делается одним.
5. Прогони `npm run typecheck` и `npm run test`. Оба обязаны быть зелёными — CI гоняет их до сборки.
6. Перечитай диф по каждому сопоставленному правилу.

## Индекс правил

| Концерн | Читать |
| --- | --- |
| Куда положить новый файл, слои, алиасы, импорты | [`rules/architecture.md`](rules/architecture.md) |
| SFC, props/emits, варианты оформления, UI-примитивы | [`rules/components.md`](rules/components.md) |
| Запросы, `ApiError`, фильтры, пагинация, токен | [`rules/api-layer.md`](rules/api-layer.md) |
| Формы, отправка, ошибки полей, сборка payload | [`rules/forms.md`](rules/forms.md) |
| Pinia-сторы, маршруты, guard'ы, права, списки в URL | [`rules/state-routing.md`](rules/state-routing.md) |
| Переводы, плюрализация, подписи enum, даты | [`rules/i18n.md`](rules/i18n.md) |
| Tailwind v4, палитра, адаптивность, тема | [`rules/styling.md`](rules/styling.md) |
| ARIA, фокус, клавиатура, live-region | [`rules/accessibility.md`](rules/accessibility.md) |
| Vitest, моки, фикстуры, хелперы, что покрывать | [`rules/testing.md`](rules/testing.md) |
| Типы, `strict`, `import type`, union вместо enum | [`rules/typescript.md`](rules/typescript.md) |

## Команды

```bash
npm run dev        # Vite dev-сервер (или composer run dev — всё разом)
npm run build      # прод-сборка, нужна если UI не обновляется
npm run test       # vitest run
npm run test:watch # vitest в watch-режиме
npm run typecheck  # vue-tsc --noEmit
```

CI (`.github/workflows/frontend.yml`) выполняет `npm ci` → `typecheck` → `test` → `build`. Изменение, роняющее `typecheck`, не считается готовым: он же ловит недостающие ключи переводов.

## Комментарии

Комментарии здесь объясняют **почему**, а не что. Их ставят там, где решение неочевидно: обход поведения библиотеки, развязка циклической зависимости, привязка строки к бэкенду, кламп в правиле плюрализации. Пояснительных комментариев к самоочевидному коду не добавлять — имена должны говорить сами за себя. Формат — JSDoc-блок над экспортируемой функцией, язык — русский, как в остальном коде.
