<?php

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
