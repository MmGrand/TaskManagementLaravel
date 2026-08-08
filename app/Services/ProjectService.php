<?php

namespace App\Services;

use App\Filters\ProjectFilter;
use App\Jobs\Notifications\ProjectStatusChanged;
use App\Models\Project;
use App\Models\User;
use App\Repositories\Contracts\ProjectRepository;
use Illuminate\Pagination\LengthAwarePaginator;

class ProjectService
{
    public function __construct(
        private readonly ProjectRepository $projects,
        private readonly StatisticsCache $statistics,
    ) {}

    public function list(ProjectFilter $filter, User $viewer): LengthAwarePaginator
    {
        return $this->projects->paginate($filter, $viewer);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(User $creator, array $attributes): Project
    {
        $project = $this->projects->create([...$attributes, 'created_by' => $creator->id]);

        $this->statistics->flush();

        return $project;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Project $project, array $attributes): Project
    {
        $originalStatus = $project->status;

        $project = $this->projects->update($project, $attributes);

        if ($project->wasChanged('status')) {
            ProjectStatusChanged::dispatch($project, $originalStatus);
        }

        return $project;
    }

    public function delete(Project $project): void
    {
        $this->projects->delete($project);

        $this->statistics->flush();
    }
}
