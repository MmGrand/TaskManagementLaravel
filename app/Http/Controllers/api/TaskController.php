<?php

namespace App\Http\Controllers\api;

use App\Filters\TaskFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Task\IndexRequest;
use App\Http\Requests\Task\StoreRequest;
use App\Http\Requests\Task\UpdateRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Services\TaskService;

class TaskController extends Controller
{
    public function __construct(private readonly TaskService $tasks) {}

    public function index(IndexRequest $request, TaskFilter $filter)
    {
        $this->authorize('viewAny', Task::class);

        return TaskResource::collection($this->tasks->list($filter, $request->user()));
    }

    public function store(StoreRequest $request)
    {
        $task = $this->tasks->create($request->user(), $request->validated());

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
        $task = $this->tasks->update($task, $request->validated());

        return TaskResource::make($task->load(['project', 'assignedUser', 'createdBy']));
    }

    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);

        $this->tasks->delete($task);

        return response()->json(null, 204);
    }
}
