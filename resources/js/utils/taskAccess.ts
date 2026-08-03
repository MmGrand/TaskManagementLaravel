import type { Task, User } from '@/types/models';

/**
 * Отражает Task::isManageableBy (app/Models/Task.php).
 *
 * От этого зависит, какой набор правил валидации применит Task\UpdateRequest:
 * полный или только статус. Ошибка здесь приведёт к тому, что UI отрендерит
 * форму с полями, которые сервер молча отбросит, поэтому это намеренно
 * отдельная функция со своими тестами, а не ветвление внутри компонента.
 *
 * `task.project` подгружается сразу и на index, и на show эндпоинтах. Если
 * его вдруг нет, возвращаем false — форма только со статусом, которая
 * работает, лучше полной формы с исчезающими полями.
 */
export function isTaskManageableBy(task: Task, user: User | null): boolean {
    if (user === null) {
        return false;
    }

    if (user.role?.slug === 'admin') {
        return true;
    }

    if (task.created_by === user.id) {
        return true;
    }

    return user.role?.slug === 'manager' && task.project?.created_by === user.id;
}

/** Просрочка отражает StatisticsService: срок прошёл и задача ещё не завершена. */
export function isTaskOverdue(task: Task, today = new Date()): boolean {
    if (task.due_date === null || task.status === 'completed') {
        return false;
    }

    return task.due_date < toDateInput(today);
}

/** Локальное время в формате `YYYY-MM-DD` — так же, как принимает и возвращает API. */
export function toDateInput(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}
