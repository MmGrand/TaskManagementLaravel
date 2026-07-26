<?php

use App\Models\Project;
use App\Models\User;

test('a manager can create a project', function () {
    $manager = User::factory()->manager()->create();

    $response = $this->actingAs($manager)->postJson('/api/projects', [
        'name' => 'New Project',
        'description' => 'A test project',
    ]);

    $response->assertCreated()->assertJsonPath('data.name', 'New Project');

    $this->assertDatabaseHas('projects', ['name' => 'New Project', 'created_by' => $manager->id]);
});

test('a plain user cannot create a project', function () {
    $user = User::factory()->user()->create();

    $response = $this->actingAs($user)->postJson('/api/projects', [
        'name' => 'New Project',
    ]);

    $response->assertForbidden();
});

test('creating a project fails validation without a name', function () {
    $manager = User::factory()->manager()->create();

    $response = $this->actingAs($manager)->postJson('/api/projects', []);

    $response->assertUnprocessable()->assertJsonValidationErrors(['name']);
});

test('the author can update their project', function () {
    $manager = User::factory()->manager()->create();
    $project = Project::factory()->create(['created_by' => $manager->id]);

    $response = $this->actingAs($manager)->putJson("/api/projects/{$project->id}", [
        'name' => 'Renamed Project',
        'status' => 'completed',
    ]);

    $response->assertOk()->assertJsonPath('data.name', 'Renamed Project');
});

test('a non-author manager cannot update someone else\'s project', function () {
    $owner = User::factory()->manager()->create();
    $otherManager = User::factory()->manager()->create();
    $project = Project::factory()->create(['created_by' => $owner->id]);

    $response = $this->actingAs($otherManager)->putJson("/api/projects/{$project->id}", [
        'name' => 'Hijacked',
    ]);

    $response->assertForbidden();
});

test('the author can delete their project', function () {
    $manager = User::factory()->manager()->create();
    $project = Project::factory()->create(['created_by' => $manager->id]);

    $response = $this->actingAs($manager)->deleteJson("/api/projects/{$project->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('projects', ['id' => $project->id]);
});
