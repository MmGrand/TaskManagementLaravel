# Компоненты

## Проверь, есть ли уже готовый примитив

В `components/ui` их 21: `AppAlert`, `AppAvatar`, `AppBadge`, `AppButton`, `AppConfirmDialog`, `AppDateInput`, `AppDrawer`, `AppDropdown`, `AppEmptyState`, `AppErrorState`, `AppField`, `AppFileInput`, `AppInput`, `AppMenuItem`, `AppModal`, `AppPagination`, `AppSegmented`, `AppSelect`, `AppSpinner`, `AppTextarea`, `AppToastHost`. Новый примитив заводится, только когда ни один из них не покрывает случай даже пропом.

## Структура SFC: `<script setup lang="ts">`, потом `<template>`

Блока `<style>` нет ни в одном компоненте и заводить его не нужно — оформление целиком на Tailwind-утилитах в разметке. Порядок импортов, как в существующих файлах: `vue` → сторонние → `@/components` → `@/composables` → `@/stores` → `@/types` → `@/utils`, типы отдельными `import type`.

## Типизируй props и emits дженериками

`defineProps<{}>()` с `withDefaults` для значений по умолчанию, `defineEmits` в tuple-синтаксисе. Объектная форма с `type: String` здесь не используется.

```ts
const props = withDefaults(
    defineProps<{
        variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
        loading?: boolean;
    }>(),
    { variant: 'primary', loading: false },
);

const emit = defineEmits<{ submit: [payload: ProjectPayload]; cancel: [] }>();
```

## Варианты оформления — константа модуля, а не выражение в шаблоне

Карта «вариант → строка классов» лежит рядом с компонентом и индексируется в `:class`. Это держит Tailwind-классы целыми строками (иначе сканер их не найдёт) и делает набор вариантов исчерпывающим для TS. См. `AppButton.vue`, `AppBadge.vue`, `AppToastHost.vue`.

```ts
const VARIANTS: Record<NonNullable<typeof props.variant>, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600',
    ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-600',
};
```

```html
<button class="inline-flex items-center rounded-md px-3 py-2" :class="[VARIANTS[variant], block ? 'w-full' : '']">
```

## Запрос делает страница, компонент только эмитит

Доменные компоненты (`ProjectForm`, `TaskForm`, `UserForm`) не импортируют `api/*`. Они принимают `pending` и `error` пропами и эмитят `submit` с готовым payload; страница вызывает API, показывает тост и перезагружает список. Это позволяет монтировать компонент в тесте без единого мока.

## `ui/` не знает о домене, `domain/` знает

`AppSelect` принимает `options: SelectOption[]` и ничего не знает про статусы задач. Компонент, который знает про `TaskStatus`, живёт в `components/domain/tasks/`. Если примитив начинает импортировать `@/types/models` — он выбран не тем слоем.

## Держи шаблон декларативным

- Производные значения — `computed`, не функция, вызываемая из шаблона.
- `:key` в `v-for` — стабильный идентификатор (`:key="project.id"`), не индекс.
- `v-if` и `v-for` не вешаются на один узел — оберни или отфильтруй в `computed`.
- Условные ветки списка идут цепочкой `v-if` → `v-else-if` → `v-else` (ошибка → загрузка → пусто → данные), как в `ProjectsListView.vue`.

## Реактивность

- `ref` для примитивов и заменяемых целиком массивов; `reactive` — для объекта значений формы.
- Массив в сторе заменяется, а не мутируется (`toasts.value = [...toasts.value, toast]`), чтобы подписчики точно перерисовались.
- Не деструктурируй `props` — потеряется реактивность; читай `props.x` или заводи `computed`.
- Возвращаемое значение `useApiForm()` тоже не деструктурируется на странице: оно передаётся как `form.pending.value` / `form.error.value` в пропы.
- `watch` на проп-источник с `{ immediate: true }` — стандартный способ засеять локальное состояние (см. `forms.md`).

## Слоты вместо пропов для разметки

`AppField` раздаёт `id`, `invalid` и `describedBy` через scoped-slot, `AppModal` — контент и `footer`. Если компоненту нужен произвольный контент, это слот, а не проп со строкой HTML.
