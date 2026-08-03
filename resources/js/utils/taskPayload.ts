import type { TaskPriority, TaskStatus } from '@/types/enums';

/**
 * Payload, который принимает Task\UpdateRequest, когда вызывающий проходит
 * Task::isManageableBy — каждое из полей `required` на сервере, а PUT — это
 * полная замена, поэтому частичное тело не пройдёт валидацию.
 *
 * @see app/Http/Requests/Concerns/ProvidesTaskRules.php
 */
export interface ManageableTaskPayload {
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    project_id: number;
    assigned_to: number;
    due_date: string | null;
}

/** Всё, что разрешено менять исполнителю. */
export interface AssigneeTaskPayload {
    status: TaskStatus;
}

export interface TaskFormValues {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    project_id: string;
    assigned_to: string;
    due_date: string;
}

/** Пустые строки становятся null, чтобы nullable-колонки очищались, а не превращались в ''. */
function nullIfBlank(value: string): string | null {
    const trimmed = value.trim();

    return trimmed === '' ? null : trimmed;
}

export function buildManageableTaskPayload(values: TaskFormValues): ManageableTaskPayload {
    return {
        title: values.title.trim(),
        description: nullIfBlank(values.description),
        status: values.status,
        priority: values.priority,
        project_id: Number(values.project_id),
        assigned_to: Number(values.assigned_to),
        due_date: nullIfBlank(values.due_date),
    };
}

/**
 * Единственная форма, которую может отправить исполнитель. Всё остальное
 * отбрасывается `validated()` на сервере, поэтому отправка большего просто ничего не даст.
 */
export function buildAssigneeTaskPayload(status: TaskStatus): AssigneeTaskPayload {
    return { status };
}
