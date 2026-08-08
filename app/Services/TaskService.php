<?php

namespace App\Services;

use App\Filters\TaskFilter;
use App\Jobs\Notifications\TaskAssigned;
use App\Jobs\Notifications\TaskStatusChanged;
use App\Models\Task;
use App\Models\User;
use App\Repositories\Contracts\TaskRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskService
{
    public function __construct(
        private readonly TaskRepository $tasks,
        private readonly TaskPositionService $positions,
        private readonly StatisticsCache $statistics,
    ) {}

    public function list(TaskFilter $filter, User $viewer, ?int $perPage = null): LengthAwarePaginator
    {
        return $this->tasks->paginate($filter, $viewer, $perPage ?? 15);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(User $creator, array $attributes): Task
    {
        $task = $this->tasks->create([
            ...$attributes,
            'created_by' => $creator->id,
            'position' => $this->positions->next(),
        ]);

        TaskAssigned::dispatch($task);

        $this->statistics->flush();

        return $task;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Task $task, array $attributes): Task
    {
        $originalStatus = $task->status;

        $task = $this->tasks->update($task, $attributes);

        if ($task->wasChanged('assigned_to')) {
            TaskAssigned::dispatch($task);
        }

        if ($task->wasChanged('status')) {
            TaskStatusChanged::dispatch($task, $originalStatus);
        }

        if ($task->wasChanged(['status', 'due_date', 'assigned_to', 'project_id'])) {
            $this->statistics->flush();
        }

        return $task;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function move(Task $task, User $actor, array $attributes): Task
    {
        return DB::transaction(function () use ($task, $actor, $attributes): Task {
            $after = $this->neighbour($actor, 'after_task_id', $attributes['after_task_id'] ?? null);
            $before = $this->neighbour($actor, 'before_task_id', $attributes['before_task_id'] ?? null);

            $this->assertNeighboursAreOrdered($after, $before);

            $columnFields = array_intersect_key(
                $attributes,
                array_flip(['status', 'priority', 'assigned_to']),
            );

            return $this->update($task, [
                ...$columnFields,
                'position' => $this->positions->between($after, $before),
            ]);
        });
    }

    public function delete(Task $task): void
    {
        $this->tasks->delete($task);

        $this->statistics->flush();
    }

    private function neighbour(User $actor, string $field, ?int $id): ?Task
    {
        if ($id === null) {
            return null;
        }

        return $this->tasks->findVisibleTo($actor, $id, lockForUpdate: true)
            ?? throw ValidationException::withMessages([
                $field => 'Соседняя задача недоступна.',
            ]);
    }

    private function assertNeighboursAreOrdered(?Task $after, ?Task $before): void
    {
        if ($after !== null && $before !== null && $after->position >= $before->position) {
            throw ValidationException::withMessages([
                'after_task_id' => 'Порядок задач на доске устарел. Обновите страницу.',
            ]);
        }
    }
}
