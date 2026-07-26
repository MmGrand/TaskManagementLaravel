<?php

namespace App\Repositories\Eloquent;

use App\Filters\TaskFilter;
use App\Models\Task;
use App\Models\User;
use App\Repositories\Contracts\TaskRepository as TaskRepositoryContract;
use Illuminate\Pagination\LengthAwarePaginator;

class TaskRepository implements TaskRepositoryContract
{
    public function paginate(TaskFilter $filter, User $viewer, int $perPage = 15): LengthAwarePaginator
    {
        return Task::query()
            ->with(['project', 'assignedUser', 'createdBy'])
            ->visibleTo($viewer)
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

    public function count(): int
    {
        return Task::count();
    }

    public function countByStatus(): array
    {
        $counts = Task::query()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return collect(['pending', 'in_progress', 'completed'])
            ->mapWithKeys(fn (string $status) => [$status => (int) ($counts[$status] ?? 0)])
            ->all();
    }

    public function countOverdue(): int
    {
        return Task::query()
            ->whereDate('due_date', '<', today())
            ->where('status', '!=', 'completed')
            ->count();
    }
}
