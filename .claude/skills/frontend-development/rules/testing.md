# Тесты фронтенда

Vitest 4 + jsdom + `@vue/test-utils`. Backend-тесты на Pest — это другой скилл (`pest-testing`), сюда они не относятся.

## Спек лежит рядом с исходником

`__tests__/<ИмяСубъекта>.spec.ts` в той же папке, что и субъект. `vitest.config.ts` включает `resources/js/**/*.spec.ts`, поэтому другого расположения быть не может.

Имена тестов английские, ассерты — по русскому тексту интерфейса, потому что локаль в тестах прибита к `ru`.

```ts
describe('ProjectForm', () => {
    it('prefills from the project when editing', () => { /* ... */ });
});
```

## `setup.ts` уже сделал часть работы

`resources/js/tests/setup.ts` регистрирует плагин i18n глобально и ставит `ru` в `beforeEach`. В jsdom `navigator.language === 'en-US'`, и без этого автоопределение выбрало бы английский, уронив все ассерты.

Следствия: не добавляй i18n в `global.plugins` при `mount()` — `@vue/test-utils` конкатенирует глобальный и локальный списки, так что `createTestingPinia` продолжает работать; не оставляй за собой изменённую локаль.

## Мокай модуль `api/*`, а не `http`

```ts
vi.mock('@/api/projects');

const mockedApi = vi.mocked(projectsApi);

mockedApi.list.mockResolvedValue(makePage([makeProject({ name: 'Альфа' })]));
```

`@/api/http` заглушают отдельно, чтобы импорт стора не поднял настоящий axios-инстанс:

```ts
vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));
```

`vue-router` мокается фабрикой с изменяемым объектом `routeQuery` и шпионом `push` — так проверяется, что `useListQuery` записал фильтр в URL.

## Стор — `createTestingPinia` в каждом спеке

```ts
createTestingPinia({
    createSpy: vi.fn,
    stubActions: false,
    initialState: { auth: { token: 'tok', user: makeUser({ id: 1, role: makeRole('manager') }) } },
});
```

`stubActions: false` нужен там, где экран действительно должен выполнять действия стора. Смена роли в `initialState` — стандартный способ проверить, что права скрывают нужные кнопки.

## Данные — из `@/tests/fixtures`

`makeRole`, `makeUser`, `makeProject`, `makeTask`, `makeMeta`, `makePage`, `makeHttpError` принимают `Partial<T>` с переопределениями. Не собирай доменные объекты в спеке руками — фикстуры уже соответствуют форме API-ресурсов.

Наборы прав (`ADMIN_PERMISSIONS`, `MANAGER_PERMISSIONS`, `USER_PERMISSIONS`) скопированы дословно из `RoleSlug::defaultPermissions()`: клиентское зеркало прав проверяется против того, что реально кладёт сидер. Меняя права на бэкенде, поправь и их.

## Взаимодействия — через `@/tests/ui`

`AppSelect` не нативный, поэтому выбор варианта повторяет действия пользователя:

```ts
await chooseOption(wrapper, 0, 'Завершён');   // раскрыть список и кликнуть по подписи
comboboxes(wrapper)[0]!.text();               // что выбрано сейчас
```

Остальное — обычный `@vue/test-utils`: `setValue` для инпутов, `trigger('submit')` на форме, `flushPromises()` после монтирования экрана, который грузит данные, `RouterLinkStub` в `stubs`.

## Что покрывать

- Компонент формы: пустое состояние, предзаполнение из пропа, форма эмитируемого payload (триммирование, `null` вместо пустой строки), рендер ошибки поля и общего баннера, блокировка кнопок при `pending`.
- Экран: рендер строк, пустое состояние, состояние ошибки, реакция на фильтр (что ушло в `router.push`), видимость действий по ролям.
- Composable и util: чистая логика напрямую, без `mount()`.
- Модуль `api/*`: что именно ушло в `http` (особенно вырезание пустых фильтров) и что вернулось после разворачивания обёртки.

Новый компонент без спека не считается готовым. Колокейт-спеки есть почти везде, включая примитивы `ui/`; исключение — презентационные компоненты `domain/statistics/`, которые проверяются через спек экрана, куда они встроены.
