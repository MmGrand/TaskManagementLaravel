<?php

use App\Models\Project;
use App\Models\Task;
use App\Models\User;

test('a plain user only sees the tasks assigned to them', function () {
    $manager = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();
    $stranger = User::factory()->user()->create();
    $project = Project::factory()->create(['created_by' => $manager->id]);

    $own = Task::factory()->create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'assigned_to' => $assignee->id,
    ]);

    Task::factory()->count(3)->create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'assigned_to' => $stranger->id,
    ]);

    $response = $this->actingAs($assignee)->getJson('/api/tasks');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $own->id);
});

test('a plain user cannot open a task belonging to someone else', function () {
    $manager = User::factory()->manager()->create();
    $stranger = User::factory()->user()->create();
    $project = Project::factory()->create(['created_by' => $manager->id]);
    $task = Task::factory()->create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'assigned_to' => User::factory()->user()->create()->id,
    ]);

    $this->actingAs($stranger)->getJson("/api/tasks/{$task->id}")->assertForbidden();
});

test('a manager sees every task in their own projects', function () {
    $manager = User::factory()->manager()->create();
    $otherManager = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();

    $ownProject = Project::factory()->create(['created_by' => $manager->id]);
    $foreignProject = Project::factory()->create(['created_by' => $otherManager->id]);

    Task::factory()->count(2)->create([
        'project_id' => $ownProject->id,
        'created_by' => $manager->id,
        'assigned_to' => $assignee->id,
    ]);

    Task::factory()->count(4)->create([
        'project_id' => $foreignProject->id,
        'created_by' => $otherManager->id,
        'assigned_to' => $assignee->id,
    ]);

    $response = $this->actingAs($manager)->getJson('/api/tasks');

    $response->assertOk()->assertJsonCount(2, 'data');
});

test('an admin sees every task', function () {
    $admin = User::factory()->admin()->create();
    $manager = User::factory()->manager()->create();
    $project = Project::factory()->create(['created_by' => $manager->id]);

    Task::factory()->count(5)->create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'assigned_to' => User::factory()->user()->create()->id,
    ]);

    $this->actingAs($admin)->getJson('/api/tasks')
        ->assertOk()
        ->assertJsonCount(5, 'data');
});

test('a manager only sees their own projects', function () {
    $manager = User::factory()->manager()->create();
    Project::factory()->create(['created_by' => $manager->id]);
    Project::factory()->count(2)->create(['created_by' => User::factory()->manager()->create()->id]);

    $this->actingAs($manager)->getJson('/api/projects')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('a plain user only sees the projects they have tasks in', function () {
    $manager = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();

    $visible = Project::factory()->create(['created_by' => $manager->id]);
    $hidden = Project::factory()->create(['created_by' => $manager->id]);

    Task::factory()->create([
        'project_id' => $visible->id,
        'created_by' => $manager->id,
        'assigned_to' => $assignee->id,
    ]);

    $response = $this->actingAs($assignee)->getJson('/api/projects');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $visible->id);

    $this->actingAs($assignee)->getJson("/api/projects/{$hidden->id}")->assertForbidden();
});

test('a manager can manage a task in their own project created by someone else', function () {
    $owner = User::factory()->manager()->create();
    $otherManager = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();
    $project = Project::factory()->create(['created_by' => $owner->id]);
    $task = Task::factory()->create([
        'project_id' => $project->id,
        'created_by' => $otherManager->id,
        'assigned_to' => $assignee->id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($owner)->putJson("/api/tasks/{$task->id}", [
        'title' => 'Reassigned by the project owner',
        'status' => 'in_progress',
        'priority' => 'high',
        'project_id' => $project->id,
        'assigned_to' => $assignee->id,
    ]);

    $response->assertOk()->assertJsonPath('data.title', 'Reassigned by the project owner');
});

test('a manager cannot create a task in a project they do not own', function () {
    $manager = User::factory()->manager()->create();
    $foreignProject = Project::factory()->create(['created_by' => User::factory()->manager()->create()->id]);

    $response = $this->actingAs($manager)->postJson('/api/tasks', [
        'title' => 'Sneaky task',
        'status' => 'pending',
        'priority' => 'low',
        'project_id' => $foreignProject->id,
        'assigned_to' => User::factory()->user()->create()->id,
    ]);

    $response->assertForbidden();
});

test('a manager cannot move a task into a project they do not own', function () {
    $manager = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();
    $ownProject = Project::factory()->create(['created_by' => $manager->id]);
    $foreignProject = Project::factory()->create(['created_by' => User::factory()->manager()->create()->id]);
    $task = Task::factory()->create([
        'project_id' => $ownProject->id,
        'created_by' => $manager->id,
        'assigned_to' => $assignee->id,
    ]);

    $response = $this->actingAs($manager)->putJson("/api/tasks/{$task->id}", [
        'title' => 'Moved',
        'status' => 'pending',
        'priority' => 'low',
        'project_id' => $foreignProject->id,
        'assigned_to' => $assignee->id,
    ]);

    $response->assertForbidden();
});

test('an admin can update a project they did not create', function () {
    $admin = User::factory()->admin()->create();
    $project = Project::factory()->create(['created_by' => User::factory()->manager()->create()->id]);

    $this->actingAs($admin)->putJson("/api/projects/{$project->id}", [
        'name' => 'Renamed by admin',
    ])->assertOk();
});
