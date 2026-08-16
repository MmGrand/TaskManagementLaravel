/**
 * Общая база однострочных полей ввода (input/textarea/телефон) — правка
 * радиуса, тени или фона меняется в одном месте, а не в трёх компонентах.
 */
export const FIELD_BASE_CLASS =
    'block w-full rounded-md border-0 bg-surface px-3 py-2 text-sm text-fg shadow-sm ring-1 ring-inset placeholder:text-fg-faint focus:ring-2 focus:ring-inset';

/** Обводка по состоянию `invalid` для полей с `focus:` (input, textarea, телефон, select). */
export const FIELD_RING_VALID = 'ring-border-strong focus:ring-accent';

/** То же самое, но для составных полей вроде AppDateInput, где обводка на обёртке (`focus-within:`). */
export const FIELD_RING_VALID_WITHIN = 'ring-border-strong focus-within:ring-accent';

export const FIELD_RING_INVALID = 'ring-danger';
