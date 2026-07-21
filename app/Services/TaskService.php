<?php

namespace App\Services;

use App\Filters\TaskFilter;
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
        return $this->tasks->create([...$attributes, 'created_by' => $creator->id]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Task $task, array $attributes): Task
    {
        return $this->tasks->update($task, $attributes);
    }

    public function delete(Task $task): void
    {
        $this->tasks->delete($task);
    }
}
