<?php

namespace App\Http\Controllers\api;

use App\Filters\ProjectFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\IndexRequest;
use App\Http\Requests\Project\StoreRequest;
use App\Http\Requests\Project\UpdateRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Services\ProjectService;

class ProjectController extends Controller
{
    public function __construct(private readonly ProjectService $projects) {}

    public function index(IndexRequest $request, ProjectFilter $filter)
    {
        $this->authorize('viewAny', Project::class);

        return ProjectResource::collection(
            $this->projects->list($filter, $request->user(), $request->integer('per_page') ?: null),
        );
    }

    public function store(StoreRequest $request)
    {
        $project = $this->projects->create($request->user(), $request->validated());

        return ProjectResource::make($project->load('creator'))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Project $project)
    {
        $this->authorize('view', $project);

        return ProjectResource::make($project->load('creator'));
    }

    public function update(UpdateRequest $request, Project $project)
    {
        $project = $this->projects->update($project, $request->validated());

        return ProjectResource::make($project->load('creator'));
    }

    public function destroy(Project $project)
    {
        $this->authorize('delete', $project);

        $this->projects->delete($project);

        return response()->json(null, 204);
    }
}
