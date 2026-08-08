<?php

use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

test('a manager can view statistics', function () {
    $manager = User::factory()->manager()->create();

    $response = $this->actingAs($manager)->getJson('/api/statistics');

    $response->assertOk()->assertJsonStructure([
        'projects_count',
        'tasks_count',
        'tasks_by_status',
        'overdue_tasks_count',
        'top_active_users',
    ]);
});

test('a plain user cannot view statistics', function () {
    $user = User::factory()->user()->create();

    $response = $this->actingAs($user)->getJson('/api/statistics');

    $response->assertForbidden();
});

test('an admin sees the totals across the whole system', function () {
    $admin = User::factory()->admin()->create();
    $manager = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();
    $project = Project::factory()->create(['created_by' => $manager->id]);

    Task::factory()->count(3)->withStatus(TaskStatus::Pending)->create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'assigned_to' => $assignee->id,
    ]);

    Task::factory()->overdue()->withStatus(TaskStatus::InProgress)->create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'assigned_to' => $assignee->id,
    ]);

    $this->actingAs($admin)->getJson('/api/statistics')
        ->assertOk()
        ->assertJsonPath('projects_count', 1)
        ->assertJsonPath('tasks_count', 4)
        ->assertJsonPath('tasks_by_status.pending', 3)
        ->assertJsonPath('overdue_tasks_count', 1)
        ->assertJsonPath('top_active_users.0.id', $manager->id)
        ->assertJsonPath('top_active_users.0.tasks_created_count', 4);
});

test('a manager only sees the numbers of their own projects', function () {
    $manager = User::factory()->manager()->create();
    $otherManager = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();

    $ownProject = Project::factory()->create(['created_by' => $manager->id]);
    $foreignProject = Project::factory()->create(['created_by' => $otherManager->id]);

    Task::factory()->count(2)->withStatus(TaskStatus::Completed)->create([
        'project_id' => $ownProject->id,
        'created_by' => $manager->id,
        'assigned_to' => $assignee->id,
    ]);

    Task::factory()->count(5)->withStatus(TaskStatus::Completed)->create([
        'project_id' => $foreignProject->id,
        'created_by' => $otherManager->id,
        'assigned_to' => $assignee->id,
    ]);

    $this->actingAs($manager)->getJson('/api/statistics')
        ->assertOk()
        ->assertJsonPath('projects_count', 1)
        ->assertJsonPath('tasks_count', 2)
        ->assertJsonPath('tasks_by_status.completed', 2)
        ->assertJsonCount(1, 'top_active_users')
        ->assertJsonPath('top_active_users.0.id', $manager->id);
});

test('the summary of one manager is not served from the cache of another', function () {
    $manager = User::factory()->manager()->create();
    $otherManager = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();

    Task::factory()->count(3)->create([
        'project_id' => Project::factory()->create(['created_by' => $otherManager->id])->id,
        'created_by' => $otherManager->id,
        'assigned_to' => $assignee->id,
    ]);

    $this->actingAs($manager)->getJson('/api/statistics')
        ->assertOk()
        ->assertJsonPath('tasks_count', 0);

    $this->actingAs($otherManager)->getJson('/api/statistics')
        ->assertOk()
        ->assertJsonPath('tasks_count', 3);
});

test('the summary reflects a task created right after it was read', function () {
    $manager = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();
    $project = Project::factory()->create(['created_by' => $manager->id]);

    $this->actingAs($manager)->getJson('/api/statistics')
        ->assertOk()
        ->assertJsonPath('tasks_count', 0);

    $this->actingAs($manager)->postJson('/api/tasks', [
        'title' => 'Fresh',
        'status' => TaskStatus::Pending->value,
        'priority' => 'medium',
        'project_id' => $project->id,
        'assigned_to' => $assignee->id,
    ])->assertCreated();

    $this->actingAs($manager)->getJson('/api/statistics')
        ->assertOk()
        ->assertJsonPath('tasks_count', 1)
        ->assertJsonPath('tasks_by_status.pending', 1);
});

test('the summary reflects a deleted task', function () {
    $manager = User::factory()->manager()->create();
    $project = Project::factory()->create(['created_by' => $manager->id]);
    $task = Task::factory()->create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'assigned_to' => User::factory()->user()->create()->id,
    ]);

    $this->actingAs($manager)->getJson('/api/statistics')->assertJsonPath('tasks_count', 1);

    $this->actingAs($manager)->deleteJson("/api/tasks/{$task->id}")->assertNoContent();

    $this->actingAs($manager)->getJson('/api/statistics')->assertJsonPath('tasks_count', 0);
});
