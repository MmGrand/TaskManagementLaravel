<?php

namespace App\Services;

use App\Filters\TaskFilter;
use App\Jobs\Notifications\TaskAssigned;
use App\Jobs\Notifications\TaskStatusChanged;
use App\Models\Task;
use App\Models\User;
use App\Repositories\Contracts\TaskRepository;
use Illuminate\Pagination\LengthAwarePaginator;

class TaskService
{
    public function __construct(private readonly TaskRepository $tasks) {}

    public function list(TaskFilter $filter): LengthAwarePaginator
    {
        return $this->tasks->paginate($filter);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(User $creator, array $attributes): Task
    {
        $task = $this->tasks->create([...$attributes, 'created_by' => $creator->id]);

        TaskAssigned::dispatch($task);

        return $task;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Task $task, array $attributes): Task
    {
        $originalStatus = $task->status;
        $originalAssignedTo = $task->assigned_to;

        $task = $this->tasks->update($task, $attributes);

        if ($task->assigned_to !== $originalAssignedTo) {
            TaskAssigned::dispatch($task);
        }

        if ($task->status !== $originalStatus) {
            TaskStatusChanged::dispatch($task, $originalStatus);
        }

        return $task;
    }

    public function delete(Task $task): void
    {
        $this->tasks->delete($task);
    }
}
