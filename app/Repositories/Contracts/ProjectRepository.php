<?php

namespace App\Repositories\Contracts;

use App\Filters\ProjectFilter;
use App\Models\Project;
use Illuminate\Pagination\LengthAwarePaginator;

interface ProjectRepository
{
    public function paginate(ProjectFilter $filter, int $perPage = 15): LengthAwarePaginator;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Project;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Project $project, array $attributes): Project;

    public function delete(Project $project): void;
}
