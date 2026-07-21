<?php

namespace App\Repositories\Eloquent;

use App\Filters\TaskFilter;
use App\Models\Task;
use App\Repositories\Contracts\TaskRepository as TaskRepositoryContract;
use Illuminate\Pagination\LengthAwarePaginator;

class TaskRepository implements TaskRepositoryContract
{
    public function paginate(TaskFilter $filter, int $perPage = 15): LengthAwarePaginator
    {
        return Task::query()
            ->with(['project', 'assignedUser', 'createdBy'])
            ->filter($filter)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $attributes): Task
    {
        return Task::create($attributes);
    }

    public function update(Task $task, array $attributes): Task
    {
        $task->update($attributes);

        return $task;
    }

    public function delete(Task $task): void
    {
        $task->delete();
    }
}
