<?php

namespace App\Services;

use App\Filters\ProjectFilter;
use App\Models\Project;
use App\Models\User;
use App\Repositories\Contracts\ProjectRepository;
use Illuminate\Pagination\LengthAwarePaginator;

class ProjectService
{
    public function __construct(private readonly ProjectRepository $projects) {}

    public function list(ProjectFilter $filter): LengthAwarePaginator
    {
        return $this->projects->paginate($filter);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(User $creator, array $attributes): Project
    {
        return $this->projects->create([...$attributes, 'created_by' => $creator->id]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Project $project, array $attributes): Project
    {
        return $this->projects->update($project, $attributes);
    }

    public function delete(Project $project): void
    {
        $this->projects->delete($project);
    }
}
