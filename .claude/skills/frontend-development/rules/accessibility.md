# Доступность

Доступность здесь написана вручную — UI-библиотеки нет, и ломается она молча. Прежде чем собирать интерактивный виджет, посмотри, как это сделано в существующем примитиве.

## Связка label ↔ контрол ↔ ошибка идёт через `AppField`

`AppField` владеет `useId()` и раздаёт `{ id, invalid, describedBy }` scoped-слотом. Контрол принимает их как пропы и превращает в `:id`, `:aria-invalid`, `:aria-describedby`. Не проставляй `for`/`id` руками и не оборачивай контрол в свой `<label>`.

Звёздочка обязательного поля помечена `aria-hidden` — её смысл несёт атрибут `required` на контроле.

## Диалог: `role="dialog"`, ловушка фокуса, Escape, возврат фокуса

`AppModal` реализует полный набор, и любой новый оверлей должен вести себя так же — либо просто использовать `AppModal`/`AppConfirmDialog`/`AppDrawer`.

```html
<div class="fixed inset-0 z-50 ..." @click.self="emit('close')" @keydown="onKeydown">
    <div ref="panel" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1">
```

Что обязательно: `aria-labelledby` на заголовок; Tab и Shift+Tab замыкаются внутри панели; Escape закрывает; при открытии фокус уходит на первый интерактивный элемент (после `nextTick`), при закрытии возвращается на `previouslyFocused`; клик по фону закрывает только через `@click.self`.

## `AppSelect` — кастомный combobox, не нативный `<select>`

Он несёт `role="combobox"`, `aria-haspopup="listbox"`, `aria-controls`, `aria-expanded`, `aria-activedescendant`, а список — `role="listbox"` с `role="option"` и `aria-selected` на каждом варианте.

Клавиатура работает как в нативном списке: Enter / Space / стрелки открывают, стрелки и Home/End двигают активный вариант, Enter выбирает, Escape закрывает, набор букв — typeahead. Escape внутри списка вызывает `stopPropagation`, иначе тот же нажатый Escape закрыл бы и диалог, в котором стоит список.

Практические следствия: не заменяй `AppSelect` на `<select>` ради простоты и не проверяй его в тестах через `setValue` — используй `chooseOption()` из `@/tests/ui`.

## Декоративное скрывается, состояние объявляется

- Иконки, спиннеры, стрелка списка, звёздочка обязательности — `aria-hidden="true"`.
- Кнопка в процессе отправки — `:aria-busy="loading"` и `:disabled`.
- Кнопка-иконка без текста — `:aria-label="t('...')"`, всегда через перевод (`nav.openMenu`, `common.close`).
- Раскрывающий контрол — `:aria-expanded`.
- Поле с ошибкой — `:aria-invalid` и `:aria-describedby` на текст ошибки (даёт `AppField`).

## Тосты — в live-region

Контейнер `AppToastHost` помечен `aria-live="polite"`, поэтому сообщение об успехе или ошибке зачитывается без перевода фокуса. Показывай результат действия через `ui.success` / `ui.error`, а не через самодельный баннер.

## Таблицы и структура

`<th scope="col">` в шапке; действия без видимого заголовка получают `<span class="sr-only">`. Заголовок страницы — один `<h1>`, дальше по иерархии. `sr-only` внутри таблицы держи в потоке — абсолютное позиционирование там уже вызывало горизонтальный сдвиг страницы.

## Фокус видно всегда

`focus-visible:outline-2 focus-visible:outline-offset-2` на кнопках, `focus:ring-2 focus:ring-inset` на полях. Контуры не снимать; если оформление мешает — меняй цвет, а не убирай индикатор.
