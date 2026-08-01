<?php

use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Mail\ProjectStatusChangedMail;
use App\Mail\TaskAssignedMail;
use App\Mail\TaskStatusChangedMail;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

test('changing a project status notifies the author and every assignee', function () {
    Mail::fake();

    $manager = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();
    $project = Project::factory()->withStatus(ProjectStatus::Active)->create(['created_by' => $manager->id]);

    Task::factory()->count(2)->create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'assigned_to' => $assignee->id,
    ]);

    $this->actingAs($manager)->putJson("/api/projects/{$project->id}", [
        'name' => $project->name,
        'status' => ProjectStatus::Completed->value,
    ])->assertOk();

    Mail::assertSent(ProjectStatusChangedMail::class, fn ($mail) => $mail->hasTo($manager->email));
    Mail::assertSent(ProjectStatusChangedMail::class, fn ($mail) => $mail->hasTo($assignee->email));

    Mail::assertSent(ProjectStatusChangedMail::class, 2);
});

test('an unchanged project status sends nothing', function () {
    Mail::fake();

    $manager = User::factory()->manager()->create();
    $project = Project::factory()->withStatus(ProjectStatus::Active)->create(['created_by' => $manager->id]);

    $this->actingAs($manager)->putJson("/api/projects/{$project->id}", [
        'name' => 'Renamed but not restatused',
        'status' => ProjectStatus::Active->value,
    ])->assertOk();

    Mail::assertNothingSent();
});

test('changing a task status notifies its author and its assignee', function () {
    Mail::fake();

    $manager = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();
    $project = Project::factory()->create(['created_by' => $manager->id]);
    $task = Task::factory()->withStatus(TaskStatus::Pending)->create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'assigned_to' => $assignee->id,
    ]);

    $this->actingAs($assignee)->putJson("/api/tasks/{$task->id}", [
        'status' => TaskStatus::InProgress->value,
    ])->assertOk();

    Mail::assertSent(TaskStatusChangedMail::class, 2);
});

test('reassigning a task notifies the new assignee', function () {
    Mail::fake();

    $manager = User::factory()->manager()->create();
    $original = User::factory()->user()->create();
    $replacement = User::factory()->user()->create();
    $project = Project::factory()->create(['created_by' => $manager->id]);
    $task = Task::factory()->withStatus(TaskStatus::Pending)->create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'assigned_to' => $original->id,
    ]);

    $this->actingAs($manager)->putJson("/api/tasks/{$task->id}", [
        'title' => $task->title,
        'status' => TaskStatus::Pending->value,
        'priority' => $task->priority->value,
        'project_id' => $project->id,
        'assigned_to' => $replacement->id,
    ])->assertOk();

    Mail::assertSent(TaskAssignedMail::class, fn ($mail) => $mail->hasTo($replacement->email));
});

test('every notification template renders', function () {
    $manager = User::factory()->manager()->create();
    $assignee = User::factory()->user()->create();
    $project = Project::factory()->withStatus(ProjectStatus::Completed)->create(['created_by' => $manager->id]);
    $task = Task::factory()->withStatus(TaskStatus::Completed)->create([
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'assigned_to' => $assignee->id,
        'due_date' => '2026-05-01',
    ]);

    expect((new TaskAssignedMail($task))->render())
        ->toContain($task->title)
        ->toContain($task->priority->label())
        ->toContain('01.05.2026');

    expect((new TaskStatusChangedMail($task, TaskStatus::Pending))->render())
        ->toContain(TaskStatus::Pending->label())
        ->toContain(TaskStatus::Completed->label());

    expect((new ProjectStatusChangedMail($project, ProjectStatus::Active))->render())
        ->toContain(ProjectStatus::Active->label())
        ->toContain(ProjectStatus::Completed->label());
});
