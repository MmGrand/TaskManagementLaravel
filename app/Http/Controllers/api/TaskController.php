<?php

namespace App\Http\Controllers\api;

use App\Filters\TaskFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Task\IndexRequest;
use App\Http\Requests\Task\StoreRequest;
use App\Http\Requests\Task\UpdateRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;

class TaskController extends Controller
{
    public function index(IndexRequest $request, TaskFilter $filter)
    {
        $this->authorize('viewAny', Task::class);

        $tasks = Task::query()
            ->with(['project', 'assignedUser', 'createdBy'])
            ->filter($filter)
            ->paginate(15)
            ->withQueryString();

        return TaskResource::collection($tasks);
    }

    public function store(StoreRequest $request)
    {
        $task = $request->user()->createdTasks()->create($request->validated());

        return TaskResource::make($task->load(['project', 'assignedUser', 'createdBy']))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Task $task)
    {
        $this->authorize('view', $task);

        $task->load(['project', 'assignedUser', 'createdBy']);

        return TaskResource::make($task);
    }

    public function update(UpdateRequest $request, Task $task)
    {
        $task->update($request->validated());

        return TaskResource::make($task->load(['project', 'assignedUser', 'createdBy']));
    }

    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);

        $task->delete();

        return response()->json(null, 204);
    }
}
