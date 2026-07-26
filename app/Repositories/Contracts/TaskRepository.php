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

    public function count(): int;

    /**
     * @return array<string, int>
     */
    public function countByStatus(): array;

    public function countOverdue(): int;
}
