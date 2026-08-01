<?php

namespace App\Http\Requests\Concerns;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ProvidesTaskRules
{
    /**
     * Rules for the fields only a task manager (author, project owner, admin) may write.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function manageableTaskRules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => ['required', Rule::enum(TaskStatus::class)],
            'priority' => ['required', Rule::enum(TaskPriority::class)],
            'project_id' => 'required|exists:projects,id',
            'assigned_to' => 'required|exists:users,id',
            'due_date' => 'nullable|date',
        ];
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
}
