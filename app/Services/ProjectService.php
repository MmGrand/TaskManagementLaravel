<?php

namespace App\Services;

use App\Filters\ProjectFilter;
use App\Jobs\Notifications\ProjectStatusChanged;
use App\Models\Project;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class ProjectService
{
    public function __construct(private readonly StatisticsCache $statistics) {}

    public function list(ProjectFilter $filter, User $viewer, ?int $perPage = null): LengthAwarePaginator
    {
        return Project::query()
            ->with('creator')
            ->visibleTo($viewer)
            ->filter($filter)
            ->latest()
            ->orderByDesc('id')
            ->paginate($perPage ?? 15)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(User $creator, array $attributes): Project
    {
        $project = Project::create([...$attributes, 'created_by' => $creator->id]);

        $this->statistics->flush();

        return $project;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Project $project, array $attributes): Project
    {
        $originalStatus = $project->status;

        $project->update($attributes);

        if ($project->wasChanged('status')) {
            ProjectStatusChanged::dispatch($project, $originalStatus);
        }

        return $project;
    }

    public function delete(Project $project): void
    {
        $project->delete();

        $this->statistics->flush();
    }
}
