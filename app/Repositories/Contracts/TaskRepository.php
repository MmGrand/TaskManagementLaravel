<?php

namespace App\Repositories\Contracts;

use App\Filters\TaskFilter;
use App\Models\Task;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface TaskRepository
{
    public function paginate(TaskFilter $filter, User $viewer, int $perPage = 15): LengthAwarePaginator;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Task;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Task $task, array $attributes): Task;

    public function delete(Task $task): void;

    public function maxPosition(): int;

    public function shiftPositionsFrom(int $position, int $step): void;

    public function findVisibleTo(User $viewer, int $id, bool $lockForUpdate = false): ?Task;

    public function countVisibleTo(User $viewer): int;

    /**
     * @return array<string, int>
     */
    public function countByStatusVisibleTo(User $viewer): array;

    public function countOverdueVisibleTo(User $viewer): int;
}
