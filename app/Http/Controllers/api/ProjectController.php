<?php

namespace App\Http\Controllers\api;

use App\Filters\ProjectFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(IndexProjectRequest $request, ProjectFilter $filter)
    {
        $projects = Project::query()
            ->with('creator')
            ->filter($filter)
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return ProjectResource::collection($projects);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Project::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,completed,archived',
        ]);

        $project = $request->user()->projects()->create($validated);

        return ProjectResource::make($project->load('creator'))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Project $project)
    {
        $this->authorize('view', $project);

        return ProjectResource::make($project->load('creator'));
    }

    public function update(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,completed,archived',
        ]);

        $project->update($validated);

        return ProjectResource::make($project->load('creator'));
    }

    public function destroy(Project $project)
    {
        $this->authorize('delete', $project);

        $project->delete();

        return response()->json(null, 204);
    }
}
