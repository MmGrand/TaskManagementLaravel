<?php

use App\Jobs\Notifications\TaskAssigned;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

test('a manager can create a task and the assignee is notified', function () {
    Queue::fake();

    $manager = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();
    $project = Project::factory()->create(['created_by' => $manager->id]);

    $response = $this->actingAs($manager)->postJson('/api/tasks', [
        'title' => 'New Task',
        'status' => 'pending',
        'priority' => 'medium',
        'project_id' => $project->id,
        'assigned_to' => $assignee->id,
    ]);

    $response->assertCreated()->assertJsonPath('data.title', 'New Task');

    Queue::assertPushed(TaskAssigned::class);
});

test('creating a task fails validation without required fields', function () {
    $manager = User::factory()->manager()->create();

    $response = $this->actingAs($manager)->postJson('/api/tasks', []);

    $response->assertUnprocessable()->assertJsonValidationErrors(['title', 'status', 'priority', 'project_id', 'assigned_to']);
});

test('the assignee can only update the status of a task', function () {
    $creator = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();
    $project = Project::factory()->create(['created_by' => $creator->id]);
    $task = Task::factory()->create([
        'created_by' => $creator->id,
        'assigned_to' => $assignee->id,
        'project_id' => $project->id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($assignee)->putJson("/api/tasks/{$task->id}", [
        'status' => 'in_progress',
    ]);

    $response->assertOk()->assertJsonPath('data.status', 'in_progress');
});

test('the creator can update all fields of a task', function () {
    $creator = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();
    $project = Project::factory()->create(['created_by' => $creator->id]);
    $task = Task::factory()->create([
        'created_by' => $creator->id,
        'assigned_to' => $assignee->id,
        'project_id' => $project->id,
    ]);

    $response = $this->actingAs($creator)->putJson("/api/tasks/{$task->id}", [
        'title' => 'Updated Title',
        'status' => 'completed',
        'priority' => 'high',
        'project_id' => $project->id,
        'assigned_to' => $assignee->id,
    ]);

    $response->assertOk()->assertJsonPath('data.title', 'Updated Title');
});

test('the creator can delete their task', function () {
    $creator = User::factory()->manager()->create();
    $project = Project::factory()->create(['created_by' => $creator->id]);
    $task = Task::factory()->create(['created_by' => $creator->id, 'project_id' => $project->id]);

    $response = $this->actingAs($creator)->deleteJson("/api/tasks/{$task->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
});
