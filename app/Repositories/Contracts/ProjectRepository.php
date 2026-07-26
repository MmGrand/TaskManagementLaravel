<?php

namespace App\Repositories\Contracts;

use App\Filters\ProjectFilter;
use App\Models\Project;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface ProjectRepository
{
    public function paginate(ProjectFilter $filter, User $viewer, int $perPage = 15): LengthAwarePaginator;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Project;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Project $project, array $attributes): Project;

    public function delete(Project $project): void;

    public function count(): int;
}
