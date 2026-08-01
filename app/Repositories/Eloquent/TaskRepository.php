<?php

namespace App\Repositories\Eloquent;

use App\Enums\TaskStatus;
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

    public function countVisibleTo(User $viewer): int
    {
        return Task::query()->visibleTo($viewer)->count();
    }

    public function countByStatusVisibleTo(User $viewer): array
    {
        $counts = Task::query()
            ->visibleTo($viewer)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return collect(TaskStatus::cases())
            ->mapWithKeys(fn (TaskStatus $status) => [
                $status->value => (int) ($counts[$status->value] ?? 0),
            ])
            ->all();
    }

    public function countOverdueVisibleTo(User $viewer): int
    {
        return Task::query()
            ->visibleTo($viewer)
            ->whereDate('due_date', '<', today())
            ->whereNot('status', TaskStatus::Completed)
            ->count();
    }
}
