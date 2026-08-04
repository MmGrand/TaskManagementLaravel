<?php

use App\Jobs\Notifications\TaskAssigned;
use App\Jobs\Notifications\TaskStatusChanged;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\TaskPositionService;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake();

    $this->admin = User::factory()->admin()->create();
    $this->assignee = User::factory()->user()->create();
    $this->project = Project::factory()->create(['created_by' => $this->admin->id]);
});

/**
 * @param  array<string, mixed>  $attributes
 */
function movableTask(array $attributes = []): Task
{
    return Task::factory()->create([
        'project_id' => test()->project->id,
        'created_by' => test()->admin->id,
        'assigned_to' => test()->assignee->id,
        'status' => 'pending',
        ...$attributes,
    ]);
}

/**
 * Порядок задач так, как его отдаёт доска. Проверять нужно именно порядок:
 * абсолютные значения position — деталь реализации, которую ребаланс меняет.
 *
 * @return array<int, int>
 */
function rankedIds(User $viewer): array
{
    return array_column(
        test()->actingAs($viewer)
            ->getJson('/api/tasks?sort_by=position&sort_direction=asc')
            ->json('data'),
        'id',
    );
}

test('a task is ranked strictly between the neighbours the client names', function () {
    $first = movableTask(['position' => 1000]);
    $last = movableTask(['position' => 3000]);
    $moving = movableTask(['position' => 9000]);

    $this->actingAs($this->admin)->patchJson("/api/tasks/{$moving->id}/move", [
        'after_task_id' => $first->id,
        'before_task_id' => $last->id,
    ])->assertOk();

    expect($moving->refresh()->position)->toBeGreaterThan(1000)->toBeLessThan(3000);
    expect(rankedIds($this->admin))->toBe([$first->id, $moving->id, $last->id]);
});

test('dropping a card into another status column updates the status and notifies', function () {
    $task = movableTask(['status' => 'pending']);

    $this->actingAs($this->admin)->patchJson("/api/tasks/{$task->id}/move", [
        'status' => 'in_progress',
        'after_task_id' => null,
        'before_task_id' => null,
    ])->assertOk()->assertJsonPath('data.status', 'in_progress');

    Queue::assertPushed(TaskStatusChanged::class);
});

test('dropping a card into another assignee column reassigns and notifies', function () {
    $task = movableTask();
    $other = User::factory()->user()->create();

    $this->actingAs($this->admin)->patchJson("/api/tasks/{$task->id}/move", [
        'assigned_to' => $other->id,
    ])->assertOk()->assertJsonPath('data.assigned_to', $other->id);

    Queue::assertPushed(TaskAssigned::class);
});

test('reordering inside one column notifies nobody', function () {
    $first = movableTask(['position' => 1000]);
    $moving = movableTask(['position' => 2000]);

    $this->actingAs($this->admin)->patchJson("/api/tasks/{$moving->id}/move", [
        'before_task_id' => $first->id,
    ])->assertOk();

    Queue::assertNothingPushed();
});

test('an assignee may drag their task between status columns', function () {
    $task = movableTask();

    $this->actingAs($this->assignee)->patchJson("/api/tasks/{$task->id}/move", [
        'status' => 'completed',
    ])->assertOk()->assertJsonPath('data.status', 'completed');
});

test('an assignee may not change the priority by dragging', function () {
    $task = movableTask();

    $this->actingAs($this->assignee)->patchJson("/api/tasks/{$task->id}/move", [
        'priority' => 'high',
    ])->assertUnprocessable()->assertJsonValidationErrors(['priority']);
});

test('an assignee may not reassign the task by dragging', function () {
    $task = movableTask();
    $other = User::factory()->user()->create();

    $this->actingAs($this->assignee)->patchJson("/api/tasks/{$task->id}/move", [
        'assigned_to' => $other->id,
    ])->assertUnprocessable()->assertJsonValidationErrors(['assigned_to']);
});

test('an unrelated user cannot move a task', function () {
    $task = movableTask();
    $stranger = User::factory()->user()->create();

    $this->actingAs($stranger)->patchJson("/api/tasks/{$task->id}/move", [
        'status' => 'completed',
    ])->assertForbidden();
});

test('dropping at the top of a column ranks the card above the first one', function () {
    $first = movableTask(['position' => 1000]);
    $moving = movableTask(['position' => 5000]);

    $this->actingAs($this->admin)->patchJson("/api/tasks/{$moving->id}/move", [
        'before_task_id' => $first->id,
    ])->assertOk();

    expect($moving->refresh()->position)->toBeLessThan(1000);
    expect(rankedIds($this->admin))->toBe([$moving->id, $first->id]);
});

test('dropping into an empty column ranks the card last', function () {
    movableTask(['position' => 7000]);
    $moving = movableTask(['position' => 2000]);

    $this->actingAs($this->admin)->patchJson("/api/tasks/{$moving->id}/move", [
        'status' => 'completed',
    ])->assertOk();

    expect($moving->refresh()->position)->toBe(7000 + TaskPositionService::STEP);
});

test('an exhausted gap is rebalanced without disturbing the order', function () {
    $first = movableTask(['position' => 1000]);
    $second = movableTask(['position' => 1001]);
    $moving = movableTask(['position' => 9000]);

    $this->actingAs($this->admin)->patchJson("/api/tasks/{$moving->id}/move", [
        'after_task_id' => $first->id,
        'before_task_id' => $second->id,
    ])->assertOk();

    expect(rankedIds($this->admin))->toBe([$first->id, $moving->id, $second->id]);
});

test('a task cannot be ranked against itself', function () {
    $task = movableTask();

    $this->actingAs($this->admin)->patchJson("/api/tasks/{$task->id}/move", [
        'after_task_id' => $task->id,
    ])->assertUnprocessable()->assertJsonValidationErrors(['after_task_id']);
});

test('a neighbour the mover cannot see is rejected', function () {
    $task = movableTask();
    $hidden = Task::factory()->create([
        'project_id' => Project::factory()->create()->id,
        'created_by' => User::factory()->user()->create()->id,
        'assigned_to' => User::factory()->user()->create()->id,
    ]);

    $this->actingAs($this->assignee)->patchJson("/api/tasks/{$task->id}/move", [
        'after_task_id' => $hidden->id,
    ])->assertUnprocessable()->assertJsonValidationErrors(['after_task_id']);
});
