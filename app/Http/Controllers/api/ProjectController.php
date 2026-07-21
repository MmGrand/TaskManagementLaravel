<?php

namespace App\Http\Controllers\api;

use App\Filters\ProjectFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\IndexRequest;
use App\Http\Requests\Project\StoreRequest;
use App\Http\Requests\Project\UpdateRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;

class ProjectController extends Controller
{
    public function index(IndexRequest $request, ProjectFilter $filter)
    {
        $projects = Project::query()
            ->with('creator')
            ->filter($filter)
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return ProjectResource::collection($projects);
    }

    public function store(StoreRequest $request)
    {
        $project = $request->user()->projects()->create($request->validated());

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
        $project->update($request->validated());

        return ProjectResource::make($project->load('creator'));
    }

    public function destroy(Project $project)
    {
        $this->authorize('delete', $project);

        $project->delete();

        return response()->json(null, 204);
    }
}
