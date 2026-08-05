# Формы

## Отправляй через `useApiForm`, свой try/catch не пиши

Composable владеет флагом ожидания и нормализованной ошибкой. `submit()` резолвится значением обработчика при успехе и `undefined` при ошибке — вызывающий код ветвится по результату.

```ts
const form = useApiForm();

async function onSubmit(payload: ProjectPayload): Promise<void> {
    const current = editing.value;
    const result = await form.submit(() =>
        current ? projectsApi.update(current.id, payload) : projectsApi.create(payload),
    );

    if (result !== undefined) {
        ui.success(current ? t('projects.updated') : t('projects.created'));
        formOpen.value = false;
        await load();
    }
}
```

Возвращает `{ pending, error, submit, fieldError, generalMessage, reset }`. `fieldError(name)` даёт первое сообщение 422 для поля, `generalMessage()` — сообщение для всего остального. `reset()` вызывают при открытии формы, чтобы ошибки предыдущей попытки не всплывали.

## Владелец `useApiForm` — страница, форма получает `pending` и `error` пропами

Компонент формы не импортирует `api/*` и не знает про запрос. Он объявляет `pending?: boolean` и `error?: ApiError | null`, показывает баннер для невалидационной ошибки и подписи под полями для 422.

```ts
function fieldError(field: string): string | null {
    return props.error?.errors[field]?.[0] ?? null;
}
```

Страница передаёт refs с `.value`, потому что результат `useApiForm()` не деструктурируется:

```html
<ProjectForm :project="editing" :pending="form.pending.value" :error="form.error.value" @submit="onSubmit" />
```

## Разметка: `novalidate` + `@submit.prevent`, поля через `AppField`

Нативная валидация браузера отключена — единственный источник сообщений об ошибках это сервер, и они локализованы бэкендом.

```html
<form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
    <AppAlert v-if="error && !error.isValidation">{{ error.message }}</AppAlert>

    <AppField v-slot="field" :label="t('common.name')" :error="fieldError('name')" required>
        <AppInput v-bind="field" v-model="form.name" required />
    </AppField>

    <AppField v-slot="field" :label="t('common.status')" :error="fieldError('status')">
        <AppSelect v-bind="field" v-model="form.status" :options="statusOptions" />
    </AppField>

    <div class="flex justify-end gap-2">
        <AppButton variant="secondary" :disabled="pending" @click="emit('cancel')">{{ t('common.cancel') }}</AppButton>
        <AppButton type="submit" :loading="pending">{{ t('common.save') }}</AppButton>
    </div>
</form>
```

`AppField` владеет `useId()` и раздаёт через scoped-slot `{ id, invalid, describedBy }`, поэтому `v-bind="field"` связывает label, контрол и сообщение об ошибке. Не проставляй `for`/`id`/`aria-describedby` руками.

## Локальное состояние — `reactive`, засеваемый `watch(..., { immediate: true })`

Форма переиспользуется для создания и редактирования: `props.project` меняется, когда открывают другую запись, и значения должны перезаписаться.

```ts
const form = reactive({ name: '', description: '', status: 'active' as ProjectStatus });

watch(
    () => props.project,
    (project) => {
        form.name = project?.name ?? '';
        form.description = project?.description ?? '';
        form.status = project?.status ?? 'active';
    },
    { immediate: true },
);
```

## Тело запроса собирает билдер, а не шаблон

Для задач и пользователей это `utils/taskPayload.ts` и `utils/userPayload.ts`: там же живут интерфейсы `*FormValues` (все поля — строки, как их отдают инпуты) и `*Payload` (то, что принимает сервер). Билдер триммит строки, превращает пустые в `null` для nullable-колонок и приводит `id` к числу.

```ts
export function buildManageableTaskPayload(values: TaskFormValues): ManageableTaskPayload {
    return {
        title: values.title.trim(),
        description: nullIfBlank(values.description),
        project_id: Number(values.project_id),
        due_date: nullIfBlank(values.due_date),
        // ...
    };
}
```

Простые формы (проект) собирают payload прямо в `onSubmit`, но по тем же правилам: `.trim()`, пустая строка → `null`.

Разные роли отправляют разные формы: исполнителю разрешён только `{ status }` (`buildAssigneeTaskPayload`), поэтому существует отдельный `TaskStatusOnlyForm.vue`. Отправлять больше бессмысленно — `validated()` на сервере всё равно отбросит лишнее.

## Списки вариантов

Опции для `AppSelect` берутся из `enumOptions(group, VALUES)` (`useEnumLabel`), а списки сущностей — из `useOptionsList`. Хардкод `<option>` в шаблоне не используется.
