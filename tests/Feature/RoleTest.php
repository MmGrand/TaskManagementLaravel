<?php

use App\Models\Role;
use App\Models\User;

test('an admin can list the active roles', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->getJson('/api/roles');

    $response->assertOk()
        ->assertJsonStructure(['data' => [['id', 'slug', 'name', 'permissions', 'is_active']]]);
});

test('the roles list only contains active roles', function () {
    $admin = User::factory()->admin()->create();
    $disabled = Role::factory()->create(['slug' => 'disabled', 'is_active' => false]);

    $response = $this->actingAs($admin)->getJson('/api/roles');

    $response->assertOk()->assertJsonMissing(['id' => $disabled->id]);
});

test('a manager cannot list roles', function () {
    $manager = User::factory()->manager()->create();

    $this->actingAs($manager)->getJson('/api/roles')->assertForbidden();
});

test('a plain user cannot list roles', function () {
    $user = User::factory()->user()->create();

    $this->actingAs($user)->getJson('/api/roles')->assertForbidden();
});

test('a guest cannot list roles', function () {
    $this->getJson('/api/roles')->assertUnauthorized();
});
