<?php

namespace App\Repositories\Eloquent;

use App\Filters\ProjectFilter;
use App\Models\Project;
use App\Repositories\Contracts\ProjectRepository as ProjectRepositoryContract;
use Illuminate\Pagination\LengthAwarePaginator;

class ProjectRepository implements ProjectRepositoryContract
{
    public function paginate(ProjectFilter $filter, int $perPage = 15): LengthAwarePaginator
    {
        return Project::query()
            ->with('creator')
            ->filter($filter)
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $attributes): Project
    {
        return Project::create($attributes);
    }

    public function update(Project $project, array $attributes): Project
    {
        $project->update($attributes);

        return $project;
    }

    public function delete(Project $project): void
    {
        $project->delete();
    }
}
