<?php

namespace App\Repositories\Eloquent;

use App\Filters\ProjectFilter;
use App\Models\Project;
use App\Models\User;
use App\Repositories\Contracts\ProjectRepository as ProjectRepositoryContract;
use Illuminate\Pagination\LengthAwarePaginator;

class ProjectRepository implements ProjectRepositoryContract
{
    public function paginate(ProjectFilter $filter, User $viewer, int $perPage = 15): LengthAwarePaginator
    {
        return Project::query()
            ->with('creator')
            ->visibleTo($viewer)
            ->filter($filter)
            ->latest()
            ->orderByDesc('id')
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

    public function countVisibleTo(User $viewer): int
    {
        return Project::query()->visibleTo($viewer)->count();
    }
}
