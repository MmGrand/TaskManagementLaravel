<?php

namespace App\Http\Requests\Concerns;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\UserStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Query\Builder;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

trait ProvidesTaskRules
{
    /**
     * Rules for the fields only a task manager (author, project owner, admin) may write.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function manageableTaskRules(?int $currentAssigneeId = null): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => ['required', Rule::enum(TaskStatus::class)],
            'priority' => ['required', Rule::enum(TaskPriority::class)],
            'project_id' => 'required|exists:projects,id',
            'assigned_to' => ['required', 'integer', $this->assignableUserRule($currentAssigneeId)],
            'due_date' => 'nullable|date',
        ];
    }

    /**
     * Only users who can sign in may receive a task; the current assignee stays valid
     * so a task can still be edited after its assignee was blocked.
     */
    protected function assignableUserRule(?int $currentAssigneeId): Exists
    {
        return Rule::exists('users', 'id')->where(fn (Builder $users) => $users->where(
            fn (Builder $users) => $users
                ->where('status', UserStatus::Active->value)
                ->when($currentAssigneeId, fn (Builder $users, int $id) => $users->orWhere('id', $id)),
        ));
    }

    /**
     * Rules for the only field an assignee may write.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function assigneeTaskRules(): array
    {
        return [
            'status' => ['required', Rule::enum(TaskStatus::class)],
        ];
    }

    /**
     * Rules for moving a task.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function moveTaskRules(bool $manageable, int $taskId, ?int $currentAssigneeId = null): array
    {
        $neighbour = ['nullable', 'integer', 'exists:tasks,id', Rule::notIn([$taskId])];

        return [
            'status' => ['sometimes', Rule::enum(TaskStatus::class)],
            'priority' => $manageable ? ['sometimes', Rule::enum(TaskPriority::class)] : ['prohibited'],
            'assigned_to' => $manageable
                ? ['sometimes', 'integer', $this->assignableUserRule($currentAssigneeId)]
                : ['prohibited'],
            'after_task_id' => $neighbour,
            'before_task_id' => $neighbour,
        ];
    }
}
