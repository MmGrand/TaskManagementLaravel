<?php

namespace App\Http\Controllers\api;

use App\Filters\TaskFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(IndexTaskRequest $request, TaskFilter $filter)
    {
        $this->authorize('viewAny', Task::class);

        $tasks = Task::query()
            ->with(['project', 'assignedUser', 'createdBy'])
            ->filter($filter)
            ->paginate(15)
            ->withQueryString();

        return TaskResource::collection($tasks);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Task::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:pending,in_progress,completed',
            'priority' => 'required|in:low,medium,high',
            'project_id' => 'required|exists:projects,id',
            'assigned_to' => 'required|exists:users,id',
            'due_date' => 'nullable|date',
        ]);

        $task = $request->user()->createdTasks()->create($validated);

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

    public function update(Request $request, Task $task)
    {
        $this->authorize('update', $task);

        if ($this->canManageTask($request->user(), $task)) {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'status' => 'required|in:pending,in_progress,completed',
                'priority' => 'required|in:low,medium,high',
                'project_id' => 'required|exists:projects,id',
                'assigned_to' => 'required|exists:users,id',
                'due_date' => 'nullable|date',
            ]);
        } else {
            $validated = $request->validate([
                'status' => 'required|in:pending,in_progress,completed',
            ]);
        }

        $task->update($validated);

        return TaskResource::make($task->load(['project', 'assignedUser', 'createdBy']));
    }

    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);

        $task->delete();

        return response()->json(null, 204);
    }

    private function canManageTask(User $user, Task $task): bool
    {
        return $user->isAdmin()
            || $user->isManager()
            || $task->created_by === $user->id;
    }
}
