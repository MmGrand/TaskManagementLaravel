<?php

use App\Models\Project;
use App\Models\Task;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->project = Project::factory()->create([
        'created_by' => $this->admin->id,
        'status' => 'active',
    ]);
    $this->assignee = User::factory()->user()->create();
});

/**
 * @param  array<string, mixed>  $attributes
 */
function taskFor(array $attributes = []): Task
{
    return Task::factory()->create([
        'project_id' => test()->project->id,
        'created_by' => test()->admin->id,
        'assigned_to' => test()->assignee->id,
        ...$attributes,
    ]);
}

test('tasks can be filtered by status', function () {
    taskFor(['status' => 'pending']);
    taskFor(['status' => 'completed']);
    taskFor(['status' => 'completed']);

    $this->actingAs($this->admin)->getJson('/api/tasks?status=completed')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

test('tasks can be filtered by priority', function () {
    taskFor(['priority' => 'low']);
    taskFor(['priority' => 'high']);

    $this->actingAs($this->admin)->getJson('/api/tasks?priority=high')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('tasks can be filtered by project', function () {
    $other = Project::factory()->create(['created_by' => $this->admin->id]);
    taskFor();
    taskFor(['project_id' => $other->id]);

    $this->actingAs($this->admin)->getJson("/api/tasks?project_id={$other->id}")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.project_id', $other->id);
});

test('tasks can be filtered by assignee', function () {
    $otherAssignee = User::factory()->user()->create();
    taskFor();
    taskFor(['assigned_to' => $otherAssignee->id]);
    taskFor(['assigned_to' => $otherAssignee->id]);

    $this->actingAs($this->admin)->getJson("/api/tasks?assigned_to={$otherAssignee->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

test('filters can be combined', function () {
    taskFor(['status' => 'completed', 'priority' => 'high']);
    taskFor(['status' => 'completed', 'priority' => 'low']);
    taskFor(['status' => 'pending', 'priority' => 'high']);

    $this->actingAs($this->admin)->getJson('/api/tasks?status=completed&priority=high')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('tasks can be sorted by due date ascending', function () {
    taskFor(['due_date' => '2026-03-01']);
    taskFor(['due_date' => '2026-01-01']);
    taskFor(['due_date' => '2026-02-01']);

    $response = $this->actingAs($this->admin)->getJson('/api/tasks?sort_by=due_date&sort_direction=asc');

    $response->assertOk();
    expect(array_column($response->json('data'), 'due_date'))
        ->toBe(['2026-01-01', '2026-02-01', '2026-03-01']);
});

test('tasks are sorted by newest first by default', function () {
    $older = taskFor(['created_at' => now()->subDay()]);
    $newer = taskFor(['created_at' => now()]);

    $this->actingAs($this->admin)->getJson('/api/tasks')
        ->assertOk()
        ->assertJsonPath('data.0.id', $newer->id)
        ->assertJsonPath('data.1.id', $older->id);
});

test('tasks can be filtered by a deadline window', function () {
    taskFor(['due_date' => '2026-01-10']);
    taskFor(['due_date' => '2026-02-10']);
    taskFor(['due_date' => '2026-03-10']);

    $response = $this->actingAs($this->admin)
        ->getJson('/api/tasks?due_date_from=2026-02-01&due_date_to=2026-02-28');

    $response->assertOk()->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.due_date', '2026-02-10');
});

test('tasks can be filtered by an open ended deadline', function () {
    taskFor(['due_date' => '2026-01-10']);
    taskFor(['due_date' => '2026-02-10']);
    taskFor(['due_date' => '2026-03-10']);

    $this->actingAs($this->admin)->getJson('/api/tasks?due_date_from=2026-02-01')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

test('tasks can be filtered by creation date', function () {
    taskFor(['created_at' => now()->subDays(10)]);
    taskFor(['created_at' => now()->subDay()]);

    $this->actingAs($this->admin)
        ->getJson('/api/tasks?created_from='.now()->subDays(3)->toDateString())
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('a reversed date window is rejected', function () {
    $this->actingAs($this->admin)
        ->getJson('/api/tasks?due_date_from=2026-03-01&due_date_to=2026-01-01')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['due_date_to']);
});

test('an unknown filter value is rejected', function () {
    $this->actingAs($this->admin)->getJson('/api/tasks?status=nope')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

test('an unknown sort column is rejected', function () {
    $this->actingAs($this->admin)->getJson('/api/tasks?sort_by=password')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['sort_by']);
});

test('tasks are paginated 15 per page', function () {
    Task::factory()->count(20)->create([
        'project_id' => $this->project->id,
        'created_by' => $this->admin->id,
        'assigned_to' => $this->assignee->id,
    ]);

    $this->actingAs($this->admin)->getJson('/api/tasks')
        ->assertOk()
        ->assertJsonCount(15, 'data')
        ->assertJsonPath('meta.per_page', 15)
        ->assertJsonPath('meta.total', 20);

    $this->actingAs($this->admin)->getJson('/api/tasks?page=2')
        ->assertOk()
        ->assertJsonCount(5, 'data');
});

test('the board can ask for a bigger page', function () {
    Task::factory()->count(20)->create([
        'project_id' => $this->project->id,
        'created_by' => $this->admin->id,
        'assigned_to' => $this->assignee->id,
    ]);

    $this->actingAs($this->admin)->getJson('/api/tasks?per_page=50')
        ->assertOk()
        ->assertJsonCount(20, 'data')
        ->assertJsonPath('meta.per_page', 50);
});

test('an out of range page size is rejected', function (int $perPage) {
    $this->actingAs($this->admin)->getJson("/api/tasks?per_page={$perPage}")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['per_page']);
})->with([0, 101]);

test('tasks can be sorted by board position', function () {
    $last = taskFor(['position' => 3000]);
    $first = taskFor(['position' => 1000]);
    $middle = taskFor(['position' => 2000]);

    $response = $this->actingAs($this->admin)->getJson('/api/tasks?sort_by=position&sort_direction=asc');

    $response->assertOk();
    expect(array_column($response->json('data'), 'id'))
        ->toBe([$first->id, $middle->id, $last->id]);
});

test('projects can be filtered by status', function () {
    Project::factory()->create(['created_by' => $this->admin->id, 'status' => 'archived']);
    Project::factory()->count(2)->create(['created_by' => $this->admin->id, 'status' => 'active']);

    $this->actingAs($this->admin)->getJson('/api/projects?status=archived')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('a query parameter that collides with a filter method name is ignored', function () {
    taskFor();

    $this->actingAs($this->admin)->getJson('/api/tasks?apply=1&filters=1')
        ->assertOk()
        ->assertJsonCount(1, 'data');

    $this->actingAs($this->admin)->getJson('/api/projects?apply=1')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});
